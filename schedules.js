/**
  @typedef {Object} Schedule
  @property {string} id
  @property {string} name
  @property {string} description
  @property {string} ownerUuid
  @property {number} partyId
  @property {string} game
  @property {boolean} recurring
  @property {boolean} official
  @property {number} interval
  @property {'days' | 'months' | 'years'} intervalType
  @property {string} datetime
  @property {string} systemName
  @property {number} followerCount
  @property {boolean} playerLiked

  @property {string} ownerName
  @property {number} ownerRank
  @property {string} ownerString
  @property {string} ownerSystemName

  @property {string} discord
  @property {string} youtube
  @property {string} twitch
  @property {string} niconico
  @property {string} openrec
  @property {string} bilibili
*/

const escapeHtml = text => {
  const elm = document.createElement('div');
  elm.innerText = text;
  return elm.innerHTML;
};

const extendedMarkdown = [
  { p: /\n{2,}/g, r: '<br><br>' },
  { p: /\w{2,}\n/g, r: '<br>' },
  { p: /\n/g, r: ' ' },
];

function parseFreeformMarkdown(msg) {
  msg = parseMessageTextForMarkdown(msg);
  for (const syntax of extendedMarkdown)
    msg = msg.replace(syntax.p, syntax.r);
  return msg;
}

/** Events starting in 15 minutes or less are considered "ongoing". */
const ONGOING_SCHEDULES_THRESHOLD = 15 * 60 * 1000;
const YEAR = 366 * 24 * 60 * 60 * 1000;

const platformAuthorities = Object.freeze({
  discord: 'discord.com',
  youtube: 'youtube.com',
  twitch: 'twitch.tv',
  niconico: 'nicovideo.jp',
  openrec: 'openrec.tv',
  bilibili: 'bilibili.com',
});

let editingScheduleId;

function sanitizeLink(platform, link, pathOnly = false) {
  try {
    let parsed = new URL(link, 'https://' + platformAuthorities[platform]);
    let parsedHostname = parsed.hostname.replace('www.', '');
    if (parsedHostname !== platformAuthorities[platform]) return null;

    parsed.hostname = platformAuthorities[platform];
    parsed.protocol = 'https:';
    return pathOnly ? parsed.href.substring(parsed.origin.length + 1) : parsed;
  } catch (err) {
    console.warn(link, 'is not a valid link');
    return null;
  }
}

function formatScheduleFormValue(field, raw) {
  if (field === 'datetime') {
    try {
      let parsed = new Date(raw);
      parsed = +parsed - parsed.getTimezoneOffset() * 60 * 1000;
      return new Date(parsed).toISOString().slice(0, 23);
    } catch {
      return raw;
    }
  }
  return raw;
}

/** @param {Schedule} schedule */
function addScheduleItem(schedule) {
  /** @type {HTMLElement} */
  const template = document.getElementById('scheduleTemplate').content.firstElementChild.cloneNode(true);
  const isMod = playerData && playerData.rank > 0;
  let parsedDatetime;
  try {
    if (schedule.datetime)
      parsedDatetime = new Date(schedule.datetime);
  } catch {}
  for (const slot of template.querySelectorAll('[data-role]')) {
    switch (slot.dataset.role) {
      case 'name':
        slot.append(schedule.name);
        break;
      case 'partyIcon':
        slot.classList.toggle('hidden', !schedule.partyId);
        break;
      case 'edit':
        if (!isMod && (!playerData?.uuid || playerData.uuid !== schedule.ownerUuid)) break;
        slot.classList.remove('hidden');
        if (schedule.game !== gameId) {
          slot.classList.add('toggled');
          addTooltip(slot, localizedMessages.schedules.wrongEditGame.replace('{GAME}', localizedMessages.games[schedule.game]));
        } else
          slot.addEventListener('click', () => openScheduleEditModal(schedule));
        break;
      case 'cancel':
        if (!isMod && (!playerData?.uuid || playerData.uuid !== schedule.ownerUuid)) break;
        slot.classList.remove('hidden');
        slot.addEventListener('click', () => {
          showConfirmModal(localizedMessages.schedules.confirmCancel, () => {
            apiFetch(`schedule?command=cancel&scheduleId=${schedule.id}`)
              .then(response => {
                if (!response.ok)
                  throw new Error(response.statusText);
                openSchedulesModal();
              }, err => console.error(err));
          });
        });
        break;
      case 'description':
        const descriptionContents = document.createElement('span');
        descriptionContents.classList.add('messageContents', 'themeText');
        let msg = parseFreeformMarkdown(escapeHtml(schedule.description));
        if (msg.includes('{{')) {
          // Special syntax: leads to yume.wiki
          msg = msg.replace(/{{l:(.+?)}}/g, (_, descriptor) => {            
            const [href, altText] = descriptor.split(',', 2);
            const a = document.createElement('a');
            a.target = '_blank';
            a.href = `https://yume.wiki/${schedule.game}/${href}`;
            a.innerText = altText || href;
            return a.outerHTML;
          });
        }
        populateMessageNodes(msg, descriptionContents, true);
        wrapMessageEmojis(descriptionContents);
        slot.appendChild(descriptionContents);
        slot.parentElement.addEventListener('mouseup', onclickDescription);
        break;
      case 'follow':
        if (!playerData?.uuid) break;
        slot.classList.toggle('fillIcon', !!schedule.playerLiked);
        slot.addEventListener('click', function () {
          apiFetch(`schedule?command=follow&value=${!schedule.playerLiked}&scheduleId=${schedule.id}`)
            .then(response => {
              if (!response.ok)
                throw new Error(response.statusText);
              return response.text();
            })
            .then(likeCount => {
              schedule.playerLiked = !schedule.playerLiked;
              this.classList.toggle('fillIcon', schedule.playerLiked);
              const elm = this.parentElement.querySelector('[data-role="followerCount"]');
              if (elm)
                elm.innerText = likeCount;
            }, err => console.error(err));
        });
        break;
      case 'links':
        const links = [];
        for (const platform in platformAuthorities)
          if (schedule[platform]) {
            const a = document.createElement('a');
            a.target = '_blank';
            a.href = sanitizeLink(platform, schedule[platform])?.href || 'javascript:void(0)';
            a.innerText = localizedMessages.schedules.platforms[platform];
            links.push(a.outerHTML);
          }
        slot.innerHTML = links.join(' | ');
        break;
      case 'organizer':
        const playerNameHtml = getPlayerName({ name: schedule.ownerName, systemName: schedule.ownerSystemName || 'null', rank: schedule.ownerRank, account: true, badge: schedule.ownerString || 'null' }, false, true, true);
        slot.innerHTML = localizedMessages.schedules.organizer.replace('{NAME}', playerNameHtml);
        break;
      case 'datetime':
        if (parsedDatetime) {
          const locale = globalConfig.lang === 'en' ? [] : globalConfig.lang;
          slot.innerText = parsedDatetime.toLocaleString(locale, { "dateStyle": "short", "timeStyle": "short" });
          if (schedule.recurring) {
            slot.appendChild(getSvgIcon('reconnect', true));
            if (schedule.interval === 1)
              switch (schedule.intervalType) {
                case 'days':
                  addTooltip(slot, localizedMessages.schedules.intervals.perDay); break;
                case 'months':
                  addTooltip(slot, localizedMessages.schedules.intervals.perMonth); break;
                case 'years':
                  addTooltip(slot, localizedMessages.schedules.intervals.perYear); break;
              }
            else if (schedule.interval % 7 == 0 && schedule.intervalType === 'days') {
              const weeks = schedule.interval / 7;
              if (weeks == 1)
                addTooltip(slot, localizedMessages.schedules.intervals.perWeek.replace('{WEEKDAY}', parsedDatetime.toLocaleString(locale, { weekday: 'long' })));
              else
                addTooltip(slot, localizedMessages.schedules.intervals.weeks.replace('{INTERVAL}', String(weeks)));
            } else
              addTooltip(slot, localizedMessages.schedules.intervals[schedule.intervalType].replace('{INTERVAL}', schedule.interval));
          } else {
            addTooltip(slot, parsedDatetime.toLocaleString(locale, { weekday: 'long' }));
          }
        }
        break;
      case 'followerCount':
        slot.innerText = schedule.followerCount;
        break;
      default:
        console.warn(`Unknown schedule slot "${slot.dataset.role}"`);
        break;
    }
  }

  if (schedule.systemName && schedule.game) { 
    let theme = schedule.systemName;
    if (!allGameUiThemes[schedule.game].includes(theme))
      theme = getDefaultUiTheme(schedule.game);
    initUiThemeContainerStyles(theme, schedule.game, false, () => {
      initUiThemeFontStyles(theme, schedule.game, 0, false);
      theme = theme.replace(/'|\s$/g, "").replace(/ /g, "_");
      applyThemeStyles(template, theme, schedule.game);
    });
  }
  updateThemedContainer(template);

  fastdom.mutate(() => {
    if (parsedDatetime && +parsedDatetime - +new Date <= ONGOING_SCHEDULES_THRESHOLD)
      document.getElementById('ongoingSchedules').appendChild(template);  
    else if (schedule.partyId && schedule.partyId === joinedPartyId)
      document.getElementById('partySchedules').appendChild(template);
    else if (schedule.official)
      document.getElementById('officialSchedules').appendChild(template);
    else
      document.getElementById('futureSchedules').appendChild(template);
  });
}

function onclickDescription(ev) {
  let selection;
  if (selection = getSelection()) {
    if (!selection.isCollapsed && this.contains(selection.anchorNode)) return;
  }
  this.classList.toggle('expanded');
}

function openSchedulesModal() {
  const schedulesModal = document.getElementById('schedulesModal');
  addLoader(schedulesModal);
  for (const elm of document.querySelectorAll('.scheduleContainer'))
    elm.replaceChildren();
  document.getElementById('createSchedule').classList.toggle('hidden', !playerData?.account);
  openModal('schedulesModal');
  return apiFetch('schedule?command=list')
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.json();
    })
    .then(
      /** @param {Schedule[]} schedules */
      schedules => { 
        if (!schedules)
          schedules = [];
        schedules.sort((a, z) => a.datetime.localeCompare(z.datetime));
        for (const schedule of schedules)
          if (!schedule.partyId || schedule.partyId === joinedPartyId)
            addScheduleItem(schedule); 
        document.getElementById('emptySchedules').classList.toggle('hidden', !!schedules.length);
      },
      err => console.error(err)
    ).finally(_ => removeLoader(schedulesModal));
}

/** @param {Partial<Schedule>} schedule */
function openScheduleEditModal(schedule = {}) {
  const isMod = playerData && playerData.rank > 0;
  if (!isMod && schedule.ownerUuid && schedule.ownerUuid !== playerData?.uuid) return;
  editingScheduleId = schedule.id;

  /** @type {HTMLFormElement} */
  const form = document.getElementById('scheduleForm');
  for (const input of form.querySelectorAll('[name]')) {
    input.value = formatScheduleFormValue(input.name, schedule[input.name] || '');
    if (input.name === 'datetime') {
      let min = new Date();
      min.setHours(0, 0);
      const max = new Date(min.valueOf() + YEAR);
      input.setAttribute('min', min.toISOString().slice(0, 16));
      input.setAttribute('max', max.toISOString().slice(0, 16));
    }
  }
  document.getElementById('eventRecurring').classList.toggle('toggled', !!schedule.recurring);

  document.getElementById('eventOfficial').classList.toggle('toggled', !!schedule.official);
  document.getElementById('eventOfficialRow').classList.toggle('hidden', !isMod);

  document.getElementById('resetOrganizer').classList.remove('toggled');
  document.getElementById('resetOrganizerRow').classList.toggle('hidden', !isMod || !schedule.id);

  form.interval.toggleAttribute('required', !!schedule.recurring);
  form.intervalType.toggleAttribute('required', !!schedule.recurring);

  document.getElementById('eventInterval').classList.toggle('hidden', !schedule.recurring);
  document.getElementById('restrictPartyRow').classList.toggle('hidden', !joinedPartyCache || joinedPartyCache.ownerUuid !== playerData?.uuid);
  document.getElementById('restrictParty').classList.toggle('toggled', !!schedule.partyId);

  let scheduleSystemName = schedule.systemName;
  if (!scheduleSystemName)
    scheduleSystemName = config.uiTheme === 'auto' ? systemName : config.uiTheme;
  setScheduleTheme(scheduleSystemName);
  openModal('scheduleEditModal', scheduleSystemName, 'schedulesModal');
  updateYnomojiContainerPos(false, document.getElementById('editScheduleDescription'));
}

document.getElementById('schedulesButton').addEventListener('click', () => openSchedulesModal());

{
  let toggleButton = elm => {
    const enabled = !elm.classList.contains('toggled');
    elm.classList.toggle('toggled', enabled);
    return enabled;
  };

  document.getElementById('eventRecurring').addEventListener('click', function () {
    const enabled = toggleButton(this);
    document.getElementById('eventInterval').classList.toggle('hidden', !enabled);
    const form = document.getElementById('scheduleForm');
    form.interval.toggleAttribute('required', enabled);
    form.intervalType.toggleAttribute('required', enabled);
  });

  for (const elmid of ['eventOfficial', 'restrictParty', 'resetOrganizer'])
    document.getElementById(elmid).addEventListener('click', function () { toggleButton(this); });
}

document.getElementById('scheduleForm').addEventListener('submit', function editSchedule() {
  if (!playerData?.account) return;
  const form = document.getElementById('scheduleForm');
  const schedule = Object.fromEntries(new FormData(form).entries());
  if (editingScheduleId)
    schedule.id = editingScheduleId;
  schedule.recurring = document.getElementById('eventRecurring').classList.contains('toggled');
  schedule.datetime = new Date(schedule.datetime).toISOString();
  schedule.systemName = document.getElementById('scheduleThemeButton').nextElementSibling.value;
  schedule.game = gameId;
  schedule.official = document.getElementById('eventOfficial').classList.contains('toggled');

  schedule.ownerUuid = playerData.uuid;
  if (editingScheduleId && playerData.rank > 0 && !document.getElementById('resetOrganizer').classList.contains('toggled'))
    schedule.ownerUuid = '';

  if (joinedPartyCache?.ownerUuid && joinedPartyCache.ownerUuid === playerData?.uuid) {
    const partyOnly = document.getElementById('restrictParty').classList.contains('toggled');
    if (partyOnly) {
      schedule.partyId = joinedPartyId;
      schedule.systemName = joinedPartyCache.systemName;
    } else
      delete schedule.partyId;
  }
  apiFetch(`schedule?command=update&${new URLSearchParams(schedule).toString()}`)
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.text();
    })
    .then(() => {
      closeModal();
      openSchedulesModal();
    }, err => console.error(err));
  return false;
});

document.getElementById('cancelSchedule').addEventListener('click', function () {
  if (!editingScheduleId) {
    openSchedulesModal();
    return;
  }
  showConfirmModal(localizedMessages.schedules.confirmCancel, () => {
    apiFetch(`schedule?command=cancel&scheduleId=${editingScheduleId}`)
      .then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        openSchedulesModal();
      }, err => console.error(err));
  });
});

document.getElementById('scheduleThemeButton').addEventListener('click', function () {
  openModal('uiThemesModal', this.nextElementSibling.value, 'scheduleEditModal');
});

for (const platformInput of document.querySelectorAll('input[data-platform]')) {
  platformInput.addEventListener('change', function () {
    const sanitized = sanitizeLink(platformInput.name, this.value, true);
    if (sanitized !== null) {
      this.value = sanitized;
      this.setCustomValidity('');
    } else
      this.setCustomValidity(localizedMessages.schedules.invalidPlatformLink);
  });
}
