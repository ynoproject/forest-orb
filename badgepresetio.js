const PRESET_FILE_EXT = '.badgepreset';
const PRESET_FILE_ACCEPT = '.badgepreset,.json';
const PRESET_FILE_MAX_BYTES = 64 * 1024;
const PRESET_FILE_MAX_ROWS = 10; // max badge slot based on server
const PRESET_FILE_MAX_COLS = 7;
const BADGE_ID_PATTERN = /^[a-zA-Z0-9_ ]+$/;
const SLOT_SET_CONCURRENCY = 8;

function getPresetIoMessage(key, fallback) {
  return i18next.t(`modal.badgePreset.io.${key}`, fallback);
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
    return false;

  if (maxRows && badgeSlots.length > maxRows)
    return false;

  for (const row of badgeSlots) {
    if (!Array.isArray(row))
      return false;
    if (maxCols && row.length > maxCols)
      return false;

    for (const badgeId of row) {
      if (badgeId === null || badgeId === 'null')
        continue;
      if (typeof badgeId !== 'string')
        return false;
      if (!BADGE_ID_PATTERN.test(badgeId))
        return false;
    }
  }

  return true;
}

function parsePresetFile(rawText, maxRows, maxCols) {
  const parsed = JSON.parse(rawText);

  let badgeSlots;
  if (Array.isArray(parsed))
    badgeSlots = parsed;
  else if (parsed && Array.isArray(parsed.badgeSlots))
    badgeSlots = parsed.badgeSlots;
  else
    return null;

  if (!validateBadgeSlots(badgeSlots, maxRows, maxCols))
    return null;

  return badgeSlots;
}

function expandBadgeSlotsToGrid(badgeSlots, rows, cols) {
  const expanded = [];
  for (let r = 0; r < rows; r++) {
    const expandedRow = [];
    for (let c = 0; c < cols; c++) {
      const badgeId = badgeSlots?.[r]?.[c];
      if (badgeId == null || badgeId === 'null')
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
        .then(response => ({ ok: response.ok }))
        .catch(() => ({ ok: false }))
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
        if (response.ok)
          return { ok: true };
        const message = await response.text();
        return {
          ok: message.includes('unknown badge')
            || message.includes('specified badge is locked')
        };
      } catch {
        return { ok: false };
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
    return null;
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
  const presetNumber = `${(parseInt(presetIndex, 10) || 0) + 1}`.padStart(2, '0');
  return `badge_preset_${presetNumber}-${formattedDate}${PRESET_FILE_EXT}`;
}

const PRESET_FILE_SAVE_TYPES = [{
  description: 'Badge Preset',
  accept: { 'application/json': ['.badgepreset', '.json'] }
}];

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
  const presetSelection = document.getElementById('badgePresetSelection');
  if (!presetSelection) {
    alert(getPresetIoMessage('exportFailed', 'Export failed.'));
    return;
  }

  try {
    const presetId = presetSelection.value;
    const filename = formatExportFilename(presetId);
    let fileHandle;

    if (typeof showSaveFilePicker === 'function') {
      try {
        fileHandle = await showSaveFilePicker({
          suggestedName: filename,
          types: PRESET_FILE_SAVE_TYPES
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        throw error;
      }
    }

    const presetSlots = await getPresetData(presetId);
    if (!presetSlots) {
      alert(getPresetIoMessage('exportFailed', 'Export failed.'));
      return;
    }

    if (isEmptyBadgeSlots(presetSlots)) {
      alert(getPresetIoMessage('empty', 'This preset is empty.'));
      return;
    }

    const { rows, cols } = getCurrentGridDimensions(presetSlots);
    const fullGridSlots = expandBadgeSlotsToGrid(presetSlots, rows, cols);
    const exportData = { badgeSlots: fullGridSlots };
    if (fileHandle) {
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(exportData, null, 2));
      await writable.close();
    } else {
      downloadJSON(exportData, filename);
    }
    showPresetIoSuccess(getPresetIoMessage('exportSuccess', 'Badge preset exported successfully.'));
  } catch (error) {
    console.error('Export failed:', error);
    alert(getPresetIoMessage('exportFailed', 'Export failed.'));
  }
}

async function applyPresetToSlot(badgeSlots) {
  const presetModal = document.getElementById('badgePresetModal');
  const presetSelection = document.getElementById('badgePresetSelection');

  if (!presetSelection || typeof apiFetch !== 'function')
    return false;

  let backupSlots = null;
  let changedServerSlots = false;
  let success = false;

  try {
    if (presetModal && typeof addLoader === 'function')
      addLoader(presetModal, true);

    const backupResponse = await apiFetch('badge?command=slotList');
    if (!backupResponse.ok)
      return false;
    backupSlots = await backupResponse.json();

    const playerRows = backupSlots.length;
    const playerCols = backupSlots[0]?.length || 0;
    const normalizedSlots = expandBadgeSlotsToGrid(badgeSlots, playerRows, playerCols);
    const changes = computeChanges(normalizedSlots, backupSlots, playerRows, playerCols);
    const clearResults = await clearChangedSlotsFromChanges(changes);
    // if invalid badge id, skip place
    const placeResults = await placeNonNullSlotsConcurrent(changes, SLOT_SET_CONCURRENCY);
    changedServerSlots = true;

    const allResults = [...clearResults, ...placeResults];
    if (allResults.some(result => !result.ok))
      return false;

    const saveResponse = await apiFetch(`badge?command=presetSave&preset=${presetSelection.value}`);
    if (!saveResponse.ok)
      return false;

    if (typeof initBadgePresetModal === 'function')
      initBadgePresetModal();
    success = true;
    return true;
  } finally {
    try {
      if (changedServerSlots && backupSlots)
        await rollbackSlots(backupSlots);
    } catch (error) {
      console.error('Badge preset import rollback failed:', error);
    } finally {
      if (presetModal && typeof removeLoader === 'function')
        removeLoader(presetModal);
    }
    if (success)
      showPresetIoSuccess(getPresetIoMessage('importSuccess', 'Badge preset imported successfully.'));
  }
}

function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = PRESET_FILE_ACCEPT;
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file)
      return;

    if (file.size > PRESET_FILE_MAX_BYTES) {
      alert(getPresetIoMessage('invalidFile', 'Invalid preset file.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const badgeSlots = parsePresetFile(loadEvent.target.result, PRESET_FILE_MAX_ROWS, PRESET_FILE_MAX_COLS);

        if (!badgeSlots) {
          alert(getPresetIoMessage('invalidFile', 'Invalid preset file.'));
          return;
        }

        if (isEmptyBadgeSlots(badgeSlots)) {
          alert(getPresetIoMessage('empty', 'This preset is empty.'));
          return;
        }

        const imported = await applyPresetToSlot(badgeSlots);
        if (!imported)
          alert(getPresetIoMessage('importFailed', 'Import failed.'));
      } catch (error) {
        console.error('Import failed:', error);
        alert(getPresetIoMessage('importFailed', 'Import failed.'));
      }
    };
    reader.onerror = () => {
      alert(getPresetIoMessage('invalidFile', 'Invalid preset file.'));
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
