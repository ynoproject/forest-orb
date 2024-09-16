const locationsData = [];

let visitedLocationIds = [];
let locationsSortOrder = 'recent';
let locationsScrollTop = 0;
let locationsScrollWatch = null;

function initLocationControls() {
  document.getElementById('locationsButton').onclick = () => {
    initLocationsModal(true);
    openModal('locationsModal');
  };
}

function initLocationsModal() {
  const locationsModal = document.getElementById('locationsModal');
  const scrollToRefreshIndicator = locationsModal.querySelector('.infiniteScrollRefreshIndicator');
  const locationItemsList = locationsModal.querySelector('.itemContainer');
  locationItemsList.innerHTML = '';

  addFilterInputs();
  scrollToRefreshIndicator.classList.add('transparent');
  locationItemsList.classList.remove('scrollToRefresh');
  locationItemsList.classList.remove('end');

  let limitOffset = 0;

  const contentWidth = window.innerWidth - 112 - 18;
  const itemsPerRow = Math.floor(contentWidth / 220);
  const chunkSize = itemsPerRow * 2;

  const addLocations = locations => {
    if (!locations?.length)
      return;

    for (let location of locations) {
      console.log(location)
      const locationItem = document.createElement('div');
      locationItem.classList.add('locationItem', 'imageItem', 'item', 'hideContents');

      const locationThumbnailContainer = document.createElement('div');
      locationThumbnailContainer.classList.add('locationThumbnailContainer', 'imageThumbnailContainer');

      const locationThumbnail = document.createElement('img');
      locationThumbnail.classList.add('locationThumbnail', 'imageThumbnail', 'unselectable');
      locationThumbnail.src = visitedLocationIds.includes(location.id)
        ? `${location.locationImage.replace('images/', 'images/thumb/')}/240px-${location.locationImage.slice(location.locationImage.lastIndexOf('/') + 1)}`
        : './images/unknown_location.png';

      const locationName = document.createElement('span');
      locationName.classList.add('locationName', 'imageItemLocation', 'infoText');
      locationName.innerHTML = get2kkiLocationHtml(location);

      locationThumbnailContainer.append(locationThumbnail);

      const locationControls = getLocationControls(location, () => {
        location.remove();
        limitOffset++;
      });

      locationItem.append(locationThumbnailContainer);
      locationItem.append(locationControls);
      locationItem.append(locationName);

      // Filter Locations - filter by text
      let textFilter = document.getElementById('filterInput')?.value;

      if (textFilter == "") {
        locationItemsList.append(locationItem);
      } else {
        textFilter = textFilter.toLowerCase();
      }

      updateThemedContainer(locationItem);
    }
  };

  const getFeedQuery = (offset, limit, offsetId) => {
    let query = `location?command=getLocationFeed&offset=${offset}&limit=${limit}`;
    if (offsetId)
      query += `&offsetId=${offsetId}`;
    if (locationsSortOrder)
      query += `&sortOrder=${locationsSortOrder}`;
    return query;
  };

  let offset = 0;
  let offsetId;

  if (locationsScrollWatch)
    locationsScrollWatch.destroy();
  locationsScrollWatch = new ScrollWatch({
    container: '#locationsModal .modalContent',
    watch: '.locationItem',
    watchOnce: false,
    infiniteScroll: true,
    infiniteOffset: 32,
    debounce: true,
    scrollDebounce: 25,
    resizeDebounce: 25,
    watchOffsetYTop: 250,
    watchOffsetYBottom: 250,
    onElementInView: e => e.el.classList.remove('hideContents'),
    onElementOutOfView: e => e.el.classList.add('hideContents'),
    onInfiniteYInView: () => {
      const query = getFeedQuery(offset, chunkSize + limitOffset, offsetId);
      offset += chunkSize + limitOffset;
      if (limitOffset)
        limitOffset = 0;
      window.setTimeout(() => {
      /*apiFetch(query).then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        return response.json();
      }).then(locations => {*/
        const locations = locationsData;
        if (locations?.length) {
          if (!offsetId) {
            offsetId = locations[0].id;
            removeLoader(locationsModal);
          }
          addLocations(locations);
          locationsScrollWatch.refresh();
        } else {
          if (!offsetId)
            removeLoader(locationsModal);
          locationsScrollWatch.pauseInfiniteScroll();
          locationItemsList.classList.add('end');
        }
      }, 10);
    }
  });

  addLoader(locationsModal);
}

function getLocationControls(location) {
  const locationControls = document.createElement('div');
  locationControls.classList.add('locationControls', 'imageControls');
  locationControls.dataset.locationId = location.id;

  if (gameId === '2kki') {
    const tracked = config.trackedLocationId === location.id;

    const trackButton = getSvgIcon('track');
    trackButton.classList.add('iconButton', 'toggleButton', 'altToggleButton', 'trackToggle');
    if (tracked)
      trackButton.classList.add('toggled');
    trackButton.onclick = function() {
      const toggled = !this.classList.contains('toggled');
      config.trackedLocationId = trackButton.classList.contains('toggled') ? location.id : null;
      document.getElementById('nextLocationContainer').classList.toggle('hidden', !toggled);
      if (toggled)
        sendSessionCommand('nl', [ location.id ]);
    };
    addTooltip(trackButton, getMassagedLabel(localizedMessages.locations.track.tooltip[tracked ? 'off' : 'on'], true), true);

    locationControls.append(trackButton);
  }

  return locationControls;
}