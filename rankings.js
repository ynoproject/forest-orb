const rankingsUrl = `../rankings`;

const perGameCategoryIds = [];

let rankingCategoryCache = [];
let rankingCategoryId;
let rankingSubCategoryId;
let rankingPage;

(function() {
  setInterval(fetchAndPopulateRankingCategories, 3600000);
})();

function initRankingControls() {
  document.getElementById('rankingsButton').onclick = () => {
    if (!rankingCategoryCache.length)
      return;

    openModal('rankingsModal');
    addLoader(document.getElementById('rankingsModal'), true);

    fetchAndLoadRankings(rankingCategoryId, rankingSubCategoryId);
  };
}

function rankingsApiFetch(path) {
  return new Promise((resolve, reject) => {
    const sId = getCookie(sessionIdKey);
    const headers = sId ? { 'Authorization': sId } : {};
    fetch(`${rankingsUrl}/${path}`, { headers: headers })
      .then(response => resolve(response))
      .catch(err => reject(err));
  });
}

function fetchAndPopulateRankingCategories() {
  rankingsApiFetch(`categories?game=${gameId}`)
    .then(response => {
      if (!response.ok)
        throw new Error(response.statusText);
      return response.json();
    })
    .then(rankingCategories => {
      if (!localizedMessages)
        return;

      rankingCategoryCache = rankingCategories;

      const rankingCategoryTabs = document.getElementById('rankingCategoryTabs');
      const rankingSubCategoryTabs = document.getElementById('rankingSubCategoryTabs');

      if (!rankingCategoryId)
        rankingCategoryId = rankingCategoryTabs.querySelector('.active')?.dataset.categoryId || rankingCategoryCache[0].categoryId;
      if (!rankingSubCategoryId)
        rankingSubCategoryId = rankingSubCategoryTabs.querySelector('.active')?.dataset.subCategoryId || rankingCategoryCache.find(c => c.categoryId === rankingCategoryId).subCategories[0].subCategoryId;

      rankingCategoryTabs.innerHTML = '';
      rankingSubCategoryTabs.innerHTML = '';

      for (let category of rankingCategoryCache) {
        if (category.categoryId.endsWith(`_${gameId}`)) {
          category.categoryId = category.categoryId.slice(0, (gameId.length + 1) * -1);
          if (perGameCategoryIds.indexOf(category.categoryId) === -1)
            perGameCategoryIds.push(category.categoryId);
        }
        if (category.subCategories == null)
          continue;

        const categoryId = category.categoryId;
        
        if (!localizedMessages.rankings.categories.hasOwnProperty(categoryId))
          continue;

        let defaultSubCategoryId = category.subCategories[0].subCategoryId;
        if (eventPeriodCache) {
          const currentPeriodSubCategory = category.subCategories.find(sc => sc.subCategoryId == eventPeriodCache.periodOrdinal)?.subCategoryId;
          if (currentPeriodSubCategory)
            defaultSubCategoryId = currentPeriodSubCategory;
        }

        const tab = document.createElement('div');
        tab.classList.add('rankingCategoryTab', 'modalTab');
        if (categoryId === rankingCategoryId)
          tab.classList.add('active');
        tab.onclick = function () {
          if (tab.dataset.categoryId === rankingCategoryId)
            return;

          fetchAndLoadRankings(categoryId, defaultSubCategoryId)
            .then(success => {
              if (!success)
                return;

              rankingCategoryTabs.querySelector('.active')?.classList.remove('active');
              tab.classList.add('active');
    
              rankingSubCategoryTabs.querySelector('.active')?.classList.remove('active');
              for (let subTab of rankingSubCategoryTabs.children) {
                const isCategorySubTab = subTab.dataset.categoryId === categoryId;
                subTab.classList.toggle('hidden', !isCategorySubTab);
                subTab.classList.toggle('active', isCategorySubTab && subTab.dataset.subCategoryId === defaultSubCategoryId);
              }
            });
        };

        const tabLabel = document.createElement('label');
        tabLabel.classList.add('rankingCategoryTabLabel', 'modalTabLabel', 'unselectable');
        tabLabel.innerHTML = getMassagedLabel(localizedMessages.rankings.categories[categoryId].label, true);

        tab.appendChild(tabLabel);
        rankingCategoryTabs.appendChild(tab);

        tab.dataset.categoryId = categoryId;

        for (let subCategory of category.subCategories) {
          const subCategoryId = subCategory.subCategoryId;

          let subCategoryLabel;
          if (isNaN(subCategoryId)) {
            let subCategoryName;
            if (localizedMessages.rankings.subCategories.hasOwnProperty(subCategoryId))
              subCategoryName = localizedMessages.rankings.subCategories[subCategoryId];
            else if (localizedMessages.games.hasOwnProperty(subCategoryId))
              subCategoryName = localizedMessages.games[subCategoryId];
            if (!subCategoryName)
              continue;
            subCategoryLabel = getMassagedLabel(subCategoryName, true);
          } else if (categoryId === 'timeTrial') {
            subCategoryLabel = localizedMessages.rankings.subCategories.hasOwnProperty(subCategoryId)
              ? getMassagedLabel(localizedMessages.rankings.subCategories[subCategoryId], true)
              : getLocalizedMapLocations(gameId, subCategoryId.padStart(4, '0'), '0000', 0, 0, "&nbsp;|&nbsp;");
          } else
            subCategoryLabel = getMassagedLabel(localizedMessages.events.period, true).replace('{ORDINAL}', subCategoryId);
          
          const subTab = document.createElement('div');
          subTab.classList.add('subTab');
          subTab.onclick = function () {
            if (subTab.dataset.subCategoryId === rankingSubCategoryId)
              return;

            fetchAndLoadRankings(categoryId, subCategoryId)
              .then(success => {
                if (!success)
                  return;

                rankingSubCategoryTabs.querySelector('.active')?.classList.remove('active');
                subTab.classList.add('active');
              });
          };
          
          const subTabLabel = document.createElement('small');
          subTabLabel.classList.add('rankingSubCategoryTabLabel', 'subTabLabel', 'infoLabel', 'unselectable');
          if (categoryId === rankingCategoryId) {
            if (subCategoryId === rankingSubCategoryId)
              subTab.classList.add('active');
          } else
            subTab.classList.add('hidden');
          subTabLabel.innerHTML = subCategoryLabel;

          const subTabBg = document.createElement('div');
          subTabBg.classList.add('subTabBg');

          subTab.appendChild(subTabLabel);
          subTab.appendChild(subTabBg);
          rankingSubCategoryTabs.appendChild(subTab);

          subTab.dataset.categoryId = categoryId;
          subTab.dataset.subCategoryId = subCategoryId;
        }
      }
    });
}

function fetchAndLoadRankings(categoryId, subCategoryId) {
  const queryCategoryId = perGameCategoryIds.indexOf(categoryId) > -1 ? `${categoryId}_${gameId}` : categoryId;
  return new Promise(resolve => {
    rankingsApiFetch(`page?category=${queryCategoryId}&subCategory=${subCategoryId}`)
      .then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        return response.text();
      })
      .then(page => {
        fetchAndLoadRankingsPage(categoryId, subCategoryId, parseInt(page))
          .then(success => resolve(success));
      })
      .catch(err => {
        console.error(err);
        resolve(false);
      });
    });
}

function fetchAndLoadRankingsPage(categoryId, subCategoryId, page) {
  const queryCategoryId = perGameCategoryIds.indexOf(categoryId) > -1 ? `${categoryId}_${gameId}` : categoryId;
  return new Promise(resolve => {
    addLoader(document.getElementById('rankingsModal'));
    rankingsApiFetch(`list?game=${gameId}&category=${queryCategoryId}&subCategory=${subCategoryId}&page=${page}`)
      .then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        return response.json();
      })
      .then(rankings => {
        if (!rankings)
          resolve(false);

        const rankingsContainer = document.getElementById('rankings');
        const rankingsPaginationContainer = document.getElementById('rankingsPagination');

        const pageCount = rankingCategoryCache.find(c => c.categoryId === categoryId)?.subCategories.find(sc => sc.subCategoryId == subCategoryId)?.pageCount || 1;
        let pageStart = Math.max(page - 2, 1);
        let pageEnd = Math.min(pageStart + 4, pageCount);

        rankingsPaginationContainer.innerHTML = '';

        if (page > 1) {
          const firstPageLink = document.createElement('a');
          firstPageLink.classList.add('rankingPageLink', 'rankingPageSkipLink');
          firstPageLink.href = 'javascript:void(0);';
          firstPageLink.onclick = () => fetchAndLoadRankingsPage(categoryId, subCategoryId, 1);
          firstPageLink.innerText = '◀◀';
          rankingsPaginationContainer.appendChild(firstPageLink);

          const prevPageLink = document.createElement('a');
          prevPageLink.classList.add('rankingPageLink', 'rankingPageLink');
          prevPageLink.href = 'javascript:void(0);';
          prevPageLink.onclick = () => fetchAndLoadRankingsPage(categoryId, subCategoryId, page - 1);
          prevPageLink.innerText = '◀';
          rankingsPaginationContainer.appendChild(prevPageLink);
        }

        for (let p = pageStart; p <= pageEnd; p++) {
          let pageLink;
          if (p === page) {
            pageLink = document.createElement('label');
          } else {
            const pageLinkPage = p;
            pageLink = document.createElement('a');
            pageLink.href = 'javascript:void(0);'
            pageLink.onclick = () => fetchAndLoadRankingsPage(categoryId, subCategoryId, pageLinkPage);
          }
          pageLink.classList.add('rankingPageLink');
          pageLink.innerText = p;
          rankingsPaginationContainer.appendChild(pageLink);
        }

        if (page < pageCount) {
          const nextPageLink = document.createElement('a');
          nextPageLink.classList.add('rankingPageLink', 'rankingPageLink');
          nextPageLink.href = 'javascript:void(0);';
          nextPageLink.onclick = () => fetchAndLoadRankingsPage(categoryId, subCategoryId, page + 1);
          nextPageLink.innerText = '▶';
          rankingsPaginationContainer.appendChild(nextPageLink);

          const lastPageLink = document.createElement('a');
          lastPageLink.classList.add('rankingPageLink', 'rankingPageSkipLink');
          lastPageLink.href = 'javascript:void(0);';
          lastPageLink.onclick = () => fetchAndLoadRankingsPage(categoryId, subCategoryId, pageCount);
          lastPageLink.innerText = '▶▶';
          rankingsPaginationContainer.appendChild(lastPageLink);
        }

        rankingCategoryId = categoryId;
        rankingSubCategoryId = subCategoryId;
        rankingPage = page;

        rankingsContainer.innerHTML = '';

        let valueFunc;
        let valueTemplate = localizedMessages.rankings.categories[categoryId].value;
        if (valueTemplate.indexOf('{NUMBER}') > -1)
          valueFunc = ranking => valueTemplate.replace('{NUMBER}', ranking.valueInt);
        else if (valueTemplate.indexOf('{PERCENT}') > -1)
          valueFunc = ranking => valueTemplate.replace('{PERCENT}', Math.round(ranking.valueFloat * 10000) / 100);
        else if (valueTemplate.indexOf('{MINUTES}') > -1 || valueTemplate.indexOf('{SECONDS}') > -1) {
          valueFunc = ranking => {
            const minutes = Math.floor(ranking.valueInt / 60);
            const seconds = ranking.valueInt - minutes * 60;
            return valueTemplate.replace('{MINUTES}', minutes.toString().padStart(2, '0')).replace('{SECONDS}', seconds.toString().padStart(2, '0'));
          };
        } else
          valueFunc = ranking => ranking.valueInt;

        document.getElementById('rankingValueHeader').innerHTML = getMassagedLabel(localizedMessages.rankings.categories[categoryId].valueLabel, true);

        for (let ranking of rankings) {
          const rankingRow = document.createElement('tr');
          if (playerData?.account && ranking.name === playerData?.name)
            rankingRow.classList.add('highlight');

          const positionCell = document.createElement('td');
          positionCell.innerHTML = getInfoLabel(ranking.position);

          const systemName = (ranking.systemName || getDefaultUiTheme()).replace(/'/g, "");
          initUiThemeContainerStyles(systemName, null, false, () => initUiThemeFontStyles(systemName, null, 0));

          const playerCell = document.createElement('td');
          playerCell.innerHTML = getPlayerName({ name: ranking.name, systemName: ranking.systemName || 'null', rank: ranking.rank, account: true, badge: ranking.badge || 'null' }, false, true, true);

          if (ranking.badge && localizedBadges) {
            const badgeEl = playerCell.querySelector('.badge');
            if (badgeEl) {
              const badge = badgeCache.find(b => b.badgeId === ranking.badge);
              const badgeGame = Object.keys(localizedBadges).find(game => {
                return Object.keys(localizedBadges[game]).find(b => b === ranking.badge);
              });
              if (badgeGame) {
                const badgeTippy = addTooltip(badgeEl, getMassagedLabel(localizedBadges[badgeGame][ranking.badge].name, true), true, true);
                if (!badge || badge.hidden)
                  badgeTippy.popper.querySelector('.tooltipContent').classList.add('altText');
              }
              if (ranking.name) {
                if (badge?.overlayType & BadgeOverlayType.LOCATION)
                  handleBadgeOverlayLocationColorOverride(badgeEl.querySelector('.badgeOverlay'), badgeEl.querySelector('.badgeOverlay2'), null, ranking.name);
                addOrUpdatePlayerBadgeGalleryTooltip(badgeEl, ranking.name, systemName);
                badgeEl.classList.toggle('badgeButton', ranking.name);
              }
            }
          }

          if (ranking.medals) {
            const medalsContainer = document.createElement('div');
            medalsContainer.classList.add('medalsContainer');

            let medalCount = 0;
            for (let t = medalTypes.length - 1; t >= 0; t--) {
              const imgSrc = `images/medal_${medalTypes[t].toLowerCase()}.png`;
              for (let m = 0; m < ranking.medals[t]; m++) {
                const medalImg = document.createElement('img');
                medalImg.classList.add('medal');
                medalImg.src = imgSrc;
                medalsContainer.prepend(medalImg);
                if (++medalCount >= 5)
                  break;
              }
              if (medalCount >= 5)
                break;
            }
        
            medalsContainer.style.minWidth = `${Math.max(medalCount << 3, 16)}px`;

            playerCell.appendChild(medalsContainer);
          }

          const valueCell = document.createElement('td');
          valueCell.innerHTML = getInfoLabel(valueFunc(ranking));

          rankingRow.appendChild(positionCell);
          rankingRow.appendChild(playerCell);
          rankingRow.appendChild(valueCell);

          rankingsContainer.appendChild(rankingRow);
        }

        removeLoader(document.getElementById('rankingsModal'));
        resolve(true);
      })
      .catch(err => {
        console.error(err);
        removeLoader(document.getElementById('rankingsModal'));
        resolve(false);
      });
  });
}