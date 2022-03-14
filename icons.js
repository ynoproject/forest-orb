const icons = {
  ban: 'm9 0a9 9 90 1 0 9 9 9 9 90 0 0 -9 -9zm0 2.1a6.9 6.9 90 0 1 4.1 1.3l-9.7 9.7a6.9 6.9 90 0 1 5.6 -11zm0 13.8a6.9 6.9 90 0 1 -4.1 -1.3l9.6-9.6a6.9 6.9 90 0 1 -5.5 10.9z',
  dev: 'm9.5 6.5l-8 8c-1 1.5 1 3 2 2l8-8c6 0.5 7-3.5 5.5-5.5l-2.5 2.5h-0.5l-1.5-1.5v-0.5l2.5-2.5c-2.5-1-6 0.5-5.5 5.5',
  info: 'm9 0a1 1 90 0 0 0 18 1 1 90 0 0 0 -18m-2 15.5v-1q1 0 1-1v-4q0-1-1-1v-1h4v6q0 1 1 1v1m-3-9c-1.625 0-2-1.5-2-2s0.375-2 2-2 2 1.5 2 2-0.375 2-2 2',
  join: 'm2 5v-3q0-2 2-2h10q2 0 2 2v14q0 2-2 2h-10q-2 0-2-2v-3h2v1c0 2 0 2 2 2h6c2 0 2 0 2-2v-10c0-2 0-2-2-2h-6c-2 0-2 0-2 2v1h-2m-2 2h6v-3l5 5-5 5v-3h-6v-4',
  leave: 'm16 5v-3q0-2-2-2h-10q-2 0-2 2v14q0 2 2 2h10q2 0 2-2v-3l-2 2c0 1-0.25 1-2 1h-6c-2 0-2 0-2-2v-10c0-2 0-2 2-2h6c2 0 2 0.25 2 1l2 2m-9 2h6v-3l5 5-5 5v-3h-6v-4',
  mod: 'm2 2q5 0 7-2 2 2 7 2 0 9-7 16-7-7-7-16m2 2q3 0 5-2 2 2 5 2-1 7-5 12-4-5-5-12',
  party: 'm9 4a1 1 90 0 0 0 5 1 1 90 0 0 0 -5m-4 13c0-5 1-7 4-7s4 2 4 7q-4 2-8 0m0-17a1 1 90 0 0 0 5 1 1 90 0 0 0 -5m-4 13c0-5 1-7 4-7 0.375 0 0.5 0 1.25 0.125-0.25 1.625 1.25 3.125 2.5 3.125q0.125 0.25 0.125 0.5c-1.75 0-3.625 1-3.875 4.125q-2.375 0-4-0.875m12-13a1 1 90 0 1 0 5 1 1 90 0 1 0 -5m4 13c0-5-1-7-4-7-0.375 0-0.5 0-1.25 0.125 0.25 1.625-1.25 3.125-2.5 3.125q-0.125 0.25-0.125 0.5c1.75 0 3.625 1 3.875 4.125q2.375 0 4-0.875',
  partyMember: 'm9 0a1.275 1.25 90 0 0 0 6.25 1.25 1.25 90 0 0 0 -6.25m-5 16.75c0-6.5 1.25-9 5-9s5 2.5 5 9.25q-5 2.25-10-0.25',
  partyOwner: 'm2 6a1 1 90 0 0 0 3 1 1 90 0 0 0 -3m14 3a1 1 90 0 0 0 -3 1 1 90 0 0 0 3m-7-2a1 1 90 0 0 0 -3 1 1 90 0 0 0 3m-5.75 1.25c0.75 0.75 3.75 0.75 5-1.5q0.75 0.5 1.5 0c1.25 2.25 4.25 2.25 5 1.5q0.25 0.5 1 0.75-1 3-1 6h-11.75q0-4-0.75-6 0.75-0.25 1-0.75',
  playerLocation: 'm9 0a1 1 0 0 0 0 18 1 1 0 0 0 0-18v18q-10-9 0-18 10 9 0 18m-7.5-4q7.5-3 15 0m-15-10q7.5 2 15 0m-16.5 5h18',
};

function getSvgIcon(iconId, fill) {
  if (!icons.hasOwnProperty(iconId))
    return null;
  
  const icon = document.createElement('div');
  icon.classList.add(`${iconId}Icon`);
  icon.classList.add('icon');
  if (fill)
    icon.classList.add('fillIcon');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 18 18');
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', icons[iconId]);

  svg.appendChild(path);
  icon.appendChild(svg);

  return icon;
}