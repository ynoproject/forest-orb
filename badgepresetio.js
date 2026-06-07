const PRESET_FILE_EXT = '.badge-preset';
const PRESET_FILE_ACCEPT = '.badge-preset,.json';
const PRESET_FILE_MAX_BYTES = 64 * 1024;
const BADGE_ID_PATTERN = /^[a-zA-Z0-9_]+$/;
const SLOT_SET_CONCURRENCY = 8;

function getPresetIoMessage(key, fallback, replacements) {
  let message = fallback;
  const i18nextInstance = /** @type {any} */ (window).i18next;
  if (i18nextInstance)
    message = i18nextInstance.t(`modal.badgePreset.io.${key}`, fallback);
  if (replacements) {
    for (const replacementKey of Object.keys(replacements))
      message = message.replace(`{${replacementKey}}`, `${replacements[replacementKey]}`);
  }
  return message;
}

function getErrorMessage(error) {
  if (error instanceof Error)
    return error.message;
  return `${error}`;
}

function showPresetIoSuccess(message) {
  if (typeof showToastMessage === 'function')
    showToastMessage(getMassagedLabel(message, true), 'info', true);
}

function getCurrentGridDimensions(fallbackSlots) {
  const rows = typeof badgeSlotRows === 'number' && badgeSlotRows > 0
    ? badgeSlotRows
    : (fallbackSlots?.length || 1);
  const cols = typeof badgeSlotCols === 'number' && badgeSlotCols > 0
    ? badgeSlotCols
    : (fallbackSlots?.[0]?.length || 3);
  return { rows, cols };
}

function validateBadgeSlots(badgeSlots, maxRows, maxCols) {
  if (!Array.isArray(badgeSlots))
    throw new Error(getPresetIoMessage('importInvalidFormat', 'Invalid preset format'));

  if (maxRows && badgeSlots.length > maxRows)
    throw new Error(getPresetIoMessage('importInvalidFormat', 'Invalid preset format'));

  for (const row of badgeSlots) {
    if (!Array.isArray(row))
      throw new Error(getPresetIoMessage('importInvalidFormat', 'Invalid preset format'));
    if (maxCols && row.length > maxCols)
      throw new Error(getPresetIoMessage('importInvalidFormat', 'Invalid preset format'));

    for (const badgeId of row) {
      if (badgeId === null || badgeId === 'null')
        continue;
      if (typeof badgeId !== 'string')
        throw new Error(getPresetIoMessage('importInvalidFormat', 'Invalid preset format'));
      if (!BADGE_ID_PATTERN.test(badgeId)) {
        throw new Error(getPresetIoMessage(
          'importInvalidBadgeId',
          'Invalid badge ID in preset: {ID}',
          { ID: badgeId }
        ));
      }
    }
  }
}

function parsePresetFile(rawText, maxRows, maxCols) {
  const parsed = JSON.parse(rawText);

  let badgeSlots;
  if (Array.isArray(parsed))
    badgeSlots = parsed;
  else if (parsed && Array.isArray(parsed.badgeSlots))
    badgeSlots = parsed.badgeSlots;
  else
    throw new Error(getPresetIoMessage('importInvalidFormat', 'Invalid preset format'));

  validateBadgeSlots(badgeSlots, maxRows, maxCols);
  return badgeSlots;
}

function expandBadgeSlotsToGrid(badgeSlots, rows, cols) {
  const expanded = [];
  for (let r = 0; r < rows; r++) {
    const expandedRow = [];
    for (let c = 0; c < cols; c++) {
      const badgeId = badgeSlots?.[r]?.[c];
      if (badgeId === null || badgeId === 'null' || typeof badgeId === 'undefined')
        expandedRow.push('null');
      else
        expandedRow.push(badgeId);
    }
    expanded.push(expandedRow);
  }
  return expanded;
}

function computeChanges(targetSlots, currentSlots, rows, cols) {
  const changes = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const targetId = targetSlots[r]?.[c] ?? 'null';
      const currentId = currentSlots[r]?.[c] ?? 'null';
      if (targetId !== currentId)
        changes.push({ r, c, targetId, currentId });
    }
  }
  return changes;
}

function fetchSlotSet(badgeId, row, col) {
  const encodedBadgeId = encodeURIComponent(badgeId);
  return apiFetch(`badge?command=slotSet&id=${encodedBadgeId}&row=${row}&col=${col}`);
}

async function clearChangedSlotsFromChanges(changes) {
  const tasks = [];
  for (const { r, c, currentId } of changes) {
    if (currentId === 'null')
      continue;

    tasks.push(
      fetchSlotSet('null', r + 1, c + 1)
        .then(response => ({
          ok: response.ok,
          row: r + 1,
          col: c + 1,
          id: 'null'
        }))
        .catch(error => ({
          ok: false,
          row: r + 1,
          col: c + 1,
          id: 'null',
          error: error?.message || `${error}`
        }))
    );
  }

  return Promise.all(tasks);
}

async function placeNonNullSlotsConcurrent(changes, concurrency) {
  const tasks = changes
    .filter(change => change.targetId !== 'null')
    .map(({ r, c, targetId }) => async () => {
      try {
        const response = await fetchSlotSet(targetId, r + 1, c + 1);
        return {
          ok: response.ok,
          row: r + 1,
          col: c + 1,
          id: targetId
        };
      } catch (error) {
        return {
          ok: false,
          row: r + 1,
          col: c + 1,
          id: targetId,
          error: getErrorMessage(error)
        };
      }
    });

  const results = [];
  for (let index = 0; index < tasks.length; index += concurrency) {
    const batch = tasks.slice(index, index + concurrency).map(task => task());
    results.push(...await Promise.all(batch));
  }
  return results;
}

async function rollbackSlots(backupSlots) {
  if (!Array.isArray(backupSlots))
    return;

  const promises = [];
  for (let r = 0; r < backupSlots.length; r++) {
    for (let c = 0; c < backupSlots[r].length; c++) {
      const badgeId = backupSlots[r]?.[c] || 'null';
      promises.push(fetchSlotSet(badgeId, r + 1, c + 1).catch(() => null));
    }
  }
  await Promise.all(promises);
}

async function getPresetData(presetId) {
  const response = await apiFetch(`badge?command=presetGet&preset=${presetId}`);
  if (!response.ok)
    throw new Error(getPresetIoMessage('exportFetchFailed', 'Failed to fetch preset from server'));
  return response.json();
}

function formatExportFilename(presetIndex) {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  const hour = `${now.getHours()}`.padStart(2, '0');
  const minute = `${now.getMinutes()}`.padStart(2, '0');
  const second = `${now.getSeconds()}`.padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}-${hour}h${minute}m${second}s`;
  const presetNumber = `${(Number.parseInt(presetIndex, 10) || 0) + 1}`.padStart(2, '0');
  return `badge_preset_${presetNumber}-${formattedDate}${PRESET_FILE_EXT}`;
}

function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

async function handleExport() {
  try {
    const presetSelection = document.getElementById('badgePresetSelection');
    if (!presetSelection)
      throw new Error(getPresetIoMessage('importRequiredElementsNotFound', 'Required elements not found'));

    const presetId = presetSelection.value;
    const presetSlots = await getPresetData(presetId);
    if (isEmptyBadgeSlots(presetSlots)) {
      alert(getPresetIoMessage('exportEmpty', 'The badge preset to export is empty.'));
      return;
    }

    const { rows, cols } = getCurrentGridDimensions(presetSlots);
    const fullGridSlots = expandBadgeSlotsToGrid(presetSlots, rows, cols);
    downloadJSON({ badgeSlots: fullGridSlots }, formatExportFilename(presetId));
    showPresetIoSuccess(getPresetIoMessage('exportSuccess', 'Badge preset exported successfully.'));
  } catch (error) {
    alert(`${getPresetIoMessage('exportFailed', 'Export failed: ')}${getErrorMessage(error)}`);
  }
}

async function applyPresetToSlot(badgeSlots) {
  const presetModal = document.getElementById('badgePresetModal');
  const presetSelection = document.getElementById('badgePresetSelection');

  if (!presetSelection || typeof apiFetch !== 'function')
    throw new Error(getPresetIoMessage('importRequiredElementsNotFound', 'Required elements not found'));

  let backupSlots = null;
  let changedServerSlots = false;

  try {
    if (presetModal && typeof addLoader === 'function')
      addLoader(presetModal, true);

    const backupResponse = await apiFetch('badge?command=slotList');
    if (!backupResponse.ok)
      throw new Error(getPresetIoMessage('importFetchSlotsFailed', 'Failed to fetch current slots'));
    backupSlots = await backupResponse.json();

    const playerRows = backupSlots.length;
    const playerCols = backupSlots[0]?.length || 0;
    validateBadgeSlots(badgeSlots, playerRows, playerCols);
    const normalizedSlots = expandBadgeSlotsToGrid(badgeSlots, playerRows, playerCols);

    const changes = computeChanges(normalizedSlots, backupSlots, playerRows, playerCols);
    const clearResults = await clearChangedSlotsFromChanges(changes);
    const placeResults = await placeNonNullSlotsConcurrent(changes, SLOT_SET_CONCURRENCY);
    changedServerSlots = clearResults.length > 0 || placeResults.length > 0;

    const allResults = [...clearResults, ...placeResults];
    const failures = allResults.filter(result => !result.ok);
    if (failures.length > 0) {
      throw new Error(getPresetIoMessage(
        'importSetSlotsFailed',
        'Failed to set slots ({FAIL}/{TOTAL}).',
        { FAIL: failures.length, TOTAL: allResults.length }
      ));
    }

    const saveResponse = await apiFetch(`badge?command=presetSave&preset=${presetSelection.value}`);
    if (!saveResponse.ok)
      throw new Error(getPresetIoMessage('importSaveFailed', 'Failed to save the preset.'));

    if (typeof initBadgePresetModal === 'function')
      initBadgePresetModal();
    showPresetIoSuccess(getPresetIoMessage('importSuccess', 'Badge preset imported successfully.'));
  } finally {
    try {
      if (changedServerSlots && backupSlots)
        await rollbackSlots(backupSlots);
    } finally {
      if (presetModal && typeof removeLoader === 'function')
        removeLoader(presetModal);
    }
  }
}

function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = PRESET_FILE_ACCEPT;
  input.onchange = (event) => {
    const fileInput = /** @type {HTMLInputElement} */ (event.target);
    const file = fileInput?.files?.[0];
    if (!file)
      return;

    if (file.size > PRESET_FILE_MAX_BYTES) {
      alert(getPresetIoMessage('importFileTooLarge', 'File is too large.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const rawText = `${loadEvent.target?.result || ''}`;
        const maxRows = typeof maxBadgeSlotRows === 'number' ? maxBadgeSlotRows : 8;
        const maxCols = typeof maxBadgeSlotCols === 'number' ? maxBadgeSlotCols : 7;
        const badgeSlots = parsePresetFile(rawText, maxRows, maxCols);

        if (isEmptyBadgeSlots(badgeSlots)) {
          alert(getPresetIoMessage('importEmpty', 'The badge preset to import is empty.'));
          return;
        }

        await applyPresetToSlot(badgeSlots);
      } catch (error) {
        alert(`${getPresetIoMessage('importPresetFailed', 'Failed to import the badge preset: ')}${getErrorMessage(error)}`);
      }
    };
    reader.onerror = () => {
      alert(getPresetIoMessage('importFileReadFailed', 'Failed to read the file.'));
    };
    reader.readAsText(file);
  };
  input.click();
}

function initBadgePresetIO() {
  const exportButton = document.getElementById('badgePresetExport');
  const importButton = document.getElementById('badgePresetImport');
  if (!exportButton || !importButton)
    return;
  if (exportButton.dataset.initialized === 'true')
    return;

  exportButton.onclick = handleExport;
  importButton.onclick = handleImport;
  exportButton.dataset.initialized = 'true';
}

window.initBadgePresetIO = initBadgePresetIO;
