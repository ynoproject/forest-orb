/**
  @typedef {Object} Schedule
  @property {string} id
  @property {string} name
  @property {string} description
  @property {string} ownerUuid
  @property {number} partyId
  @property {string} game
  @property {boolean} recurring
  @property {number} interval
  @property {string} intervalType
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

let escapeHtml;

(function() {
  const elm = document.createElement('div');
  escapeHtml = text => {
    elm.innerText = text;
    return elm.innerText;
  };
})();

/** Events starting in 15 minutes or less are considered "ongoing". */
const ONGOING_SCHEDULES_THRESHOLD = 15 * 60 * 1000;

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
        slot.addEventListener('click', () => openScheduleEditModal(schedule));
        break;
      case 'cancel':
        if (!isMod && (!playerData?.uuid || playerData.uuid !== schedule.ownerUuid)) break;
        slot.classList.remove('hidden');
        slot.addEventListener('click', () => {
          apiFetch(`schedule?command=cancel&scheduleId=${schedule.id}`)
            .then(response => {
              if (!response.ok)
                throw new Error(response.statusText);
              openSchedulesModal();
            }, err => console.error(err));
        });
        break;
      case 'description':
        const descriptionContents = document.createElement('span');
        descriptionContents.classList.add('messageContents');
        let msg = parseMessageTextForMarkdown(escapeHtml(schedule.description));
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
        if (parsedDatetime)
          slot.innerText = parsedDatetime.toLocaleString(globalConfig.lang === 'en' ? [] : globalConfig.lang, { "dateStyle": "short", "timeStyle": "short" });
        break;
      case 'followerCount':
        slot.innerText = schedule.followerCount;
        break;
      default:
        console.warn(`Unknown schedule slot "${slot.dataset.role}"`);
        break;
    }
  }
  if (schedule.systemName && schedule.game)
    applyThemeStyles(template, schedule.systemName, schedule.game);

  if (parsedDatetime && +parsedDatetime - +new Date <= ONGOING_SCHEDULES_THRESHOLD)
    document.getElementById('ongoingSchedules').appendChild(template);  
  else if (schedule.partyId && schedule.partyId === joinedPartyId)
    document.getElementById('partySchedules').appendChild(template);
  else
    document.getElementById('futureSchedules').appendChild(template);
}

function openSchedulesModal() {
  document.getElementById('futureSchedules').replaceChildren();
  document.getElementById('ongoingSchedules').replaceChildren();
  document.getElementById('partySchedules').replaceChildren();
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
        if (!schedules) schedules = [];
        schedules.sort((a, z) => a.datetime.localeCompare(z.datetime));
        for (const schedule of schedules)
          if (!schedule.partyId || schedule.partyId === joinedPartyId)
            requestAnimationFrame(() => addScheduleItem(schedule));
        document.getElementById('emptySchedules').classList.toggle('hidden', !!schedules.length);
      },
      err => console.error(err)
    );
}

/** @param {Partial<Schedule>} schedule */
function openScheduleEditModal(schedule = {}) {
  if (schedule.ownerUuid && schedule.ownerUuid !== playerData?.uuid) return;
  editingScheduleId = schedule.id;

  /** @type {HTMLFormElement} */
  const form = document.getElementById('scheduleForm');
  for (const input of form.querySelectorAll('[name]')) {
    input.value = formatScheduleFormValue(input.name, schedule[input.name] || '');
  }
  document.getElementById('eventRecurring').classList.toggle('toggled', !!schedule.recurring);
  form.interval.toggleAttribute('required', !!schedule.recurring);
  form.intervalType.toggleAttribute('required', !!schedule.recurring);
  document.getElementById('eventInterval').classList.toggle('hidden', !schedule.recurring);
  document.getElementById('restrictPartyRow').classList.toggle('hidden', !joinedPartyCache || joinedPartyCache.ownerUuid !== playerData?.uuid);
  document.getElementById('restrictParty').classList.toggle('toggled', !!schedule.partyId);
  openModal('scheduleEditModal', null, 'schedulesModal');
  updateYnomojiContainerPos(false, document.getElementById('editScheduleDescription'));
}

document.getElementById('schedulesButton').addEventListener('click', () => openSchedulesModal());

document.getElementById('eventRecurring').addEventListener('click', function () {
  const enabled = !this.classList.contains('toggled');
  this.classList.toggle('toggled', enabled);
  document.getElementById('eventInterval').classList.toggle('hidden', !enabled);
  const form = document.getElementById('scheduleForm');
  form.interval.toggleAttribute('required', enabled);
  form.intervalType.toggleAttribute('required', enabled);
});

document.getElementById('restrictParty').addEventListener('click', function () {
  const enabled = !this.classList.contains('toggled');
  this.classList.toggle('toggled', enabled);
});

document.getElementById('scheduleForm').addEventListener('submit', function editSchedule() {
  if (!playerData?.account) return;
  const form = document.getElementById('scheduleForm');
  const schedule = Object.fromEntries(new FormData(form).entries());
  if (editingScheduleId)
    schedule.id = editingScheduleId;
  schedule.recurring = document.getElementById('eventRecurring').classList.contains('toggled');
  schedule.datetime = new Date(schedule.datetime).toISOString();
  schedule.ownerUuid = playerData.uuid;
  schedule.systemName = playerData.systemName;
  schedule.game = gameId;

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
  apiFetch(`schedule?command=cancel&scheduleId=${editingScheduleId}`)
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      openSchedulesModal();
    }, err => console.error(err));
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
