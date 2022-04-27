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

    fetchAndLoadRankings(rankingCategoryId, rankingSubCategoryId)
      .then(success => {
        if (success)
          openModal('rankingsModal');
      });
  };
}

function fetchAndPopulateRankingCategories() {
  apiFetch('ranking?command=categories')
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
        rankingSubCategoryId = rankingSubCategoryTabs.querySelector('.active')?.dataset.subCategoryId || rankingCategoryCache.find(c => c.categoryId === activeCategoryId).subCategories[0].subCategoryId;

      rankingCategoryTabs.innerHTML = '';

      for (let category of rankingCategoryCache) {
        if (!localizedMessages.rankings.categories.hasOwnProperty(categoryId))
          continue;

        const categoryId = category.categoryId;
        const firstSubCategoryId = category.subCategories[0].subCategoryId;

        const tab = document.createElement('div');
        tab.classList.add('rankingCategoryTab');
        if (categoryId === rankingCategoryId)
          tab.classList.add('active');
        tab.onclick = function () {
          if (tab.dataset.categoryId === rankingCategoryId)
            return;
            
          rankingCategoryTabs.querySelector('.active')?.classList.remove('active');
          tab.classList.add('active');

          rankingSubCategoryTabs.querySelector('.active')?.classList.remove('active');
          for (let subTab of rankingSubCategoryTabs) {
            const isCategorySubTab = subTab.dataset.categoryId === categoryId;
            subTab.classList.toggle('hidden', !isCategorySubTab);
            subTab.classList.toggle('active', isCategorySubTab && subTab.dataset.subCategoryId === firstSubCategoryId);
          }

          fetchAndLoadRankings(categoryId, firstSubCategoryId);
        };

        const tabLabel = document.createElement('label');
        tabLabel.classList.add('rankingCategoryTabLabel');
        tabLabel.classList.add('unselectable');
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
          } else
            subCategoryLabel = getMassagedLabel(localizedMessages.events.period, true).replace('{ORDINAL}', subCategoryId);
          
          const subTab = document.createElement('div');
          subTab.classList.add('subTab');
          subTab.onclick = function () {
            if (subTab.dataset.subCategoryId === rankingSubCategoryId)
              return;
            rankingSubCategoryTabs.querySelector('.active')?.classList.remove('active');
            subTab.classList.add('active');

            fetchAndLoadRankings(categoryId, subCategoryId);
          };
          
          const subTabLabel = document.createElement('small');
          subTabLabel.classList.add('rankingSubCategoryTabLabel');
          subTabLabel.classList.add('subTabLabel');
          subTabLabel.classList.add('infoLabel');
          subTabLabel.classList.add('unselectable');
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
  return new Promise(resolve => {
    apiFetch(`ranking?command=page&category=${categoryId}&subCategory=${subCategoryId}`)
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
  return new Promise(resolve => {
    apiFetch(`ranking?command=list&category=${categoryId}&subCategory=${subCategoryId}&page=${page}`)
      .then(response => {
        if (!response.ok)
          throw new Error(response.statusText);
        return response.json();
      })
      .then(rankings => {
        const rankingsContainer = document.getElementById('rankings');
        const rankingsPaginationContainer = document.getElementById('rankingsPagination');

        const pageCount = rankingCategoryCache.find(c => c.categoryId === categoryId)?.subCategories.find(sc => sc.subCategoryId == subCategoryId)?.pageCount || 1;
        let pageStart = Math.max(page - 2, 1);
        let pageEnd = Math.min(pageStart + 4, pageCount);

        rankingsPaginationContainer.innerHTML = '';

        if (page > 1) {
          const firstPageLink = document.createElement('a');
          firstPageLink.classList.add('rankingPageLink');
          firstPageLink.classList.add('rankingPageSkipLink');
          firstPageLink.href = 'javascript:void(0);';
          firstPageLink.onclick = () => fetchAndPopulateRankings(categoryId, subCategoryId, 1);
          firstPageLink.innerText = '◀◀';
          rankingsPaginationContainer.appendChild(firstPageLink);

          const prevPageLink = document.createElement('a');
          prevPageLink.classList.add('rankingPageLink');
          prevPageLink.classList.add('rankingPageLink');
          prevPageLink.href = 'javascript:void(0);';
          prevPageLink.onclick = () => fetchAndPopulateRankings(categoryId, subCategoryId, page - 1);
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
            pageLink.onclick = () => fetchAndPopulateRankings(categoryId, subCategoryId, pageLinkPage);
          }
          pageLink.classList.add('rankingPageLink');
          pageLink.innerText = p;
          rankingsPaginationContainer.appendChild(pageLink);
        }

        if (page < pageCount) {
          const nextPageLink = document.createElement('a');
          nextPageLink.classList.add('rankingPageLink');
          nextPageLink.classList.add('rankingPageLink');
          nextPageLink.href = 'javascript:void(0);';
          nextPageLink.onclick = () => fetchAndPopulateRankings(categoryId, subCategoryId, page + 1);
          nextPageLink.innerText = '▶';
          rankingsPaginationContainer.appendChild(nextPageLink);

          const lastPageLink = document.createElement('a');
          lastPageLink.classList.add('rankingPageLink');
          lastPageLink.classList.add('rankingPageSkipLink');
          lastPageLink.href = 'javascript:void(0);';
          lastPageLink.onclick = () => fetchAndPopulateRankings(categoryId, subCategoryId, pageCount);
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
          valueFunc = ranking => valueTemplate.replace('{PERCENT}', ranking.valueFloat);
        else if (valueTemplate.indexOf('{MINUTES}') > -1 || valueTemplate.indexOf('{SECONDS}') > -1) {
          valueFunc = ranking => {
            const minutes = Math.floor(ranking.valueInt / 60);
            const seconds = ranking.valueInt - minutes * 60;
            valueTemplate.replace('{MINUTES}', minutes.toString().padStart(2, '0')).replace('{SECONDS}', seconds.toString().padStart(2, '0'));
          };
        } else
          valueFunc = ranking => ranking.valueInt;

        document.getElementById('rankingValueHeader').innerHTML = getMassagedLabel(localizedMessages.rankings.categories[categoryId].valueLabel, true);

        for (let ranking of rankings) {
          const rankingRow = document.createElement('tr');

          const positionCell = document.createElement('td');
          positionCell.innerHTML = getInfoLabel(ranking.position);

          const systemName = ranking.systemName.replace(/'/g, "");
          initUiThemeContainerStyles(systemName, false, () => initUiThemeFontStyles(systemName, 0, false));

          const playerCell = document.createElement('td');
          playerCell.innerHTML = getPlayerName({ name: ranking.name, systemName: ranking.systemName, rank: ranking.rank, account: true, badge: ranking.badge }, false, true, true);

          const valueCell = document.createElement('td');
          valueCell.innerHTML = getInfoLabel(valueFunc(ranking));

          rankingRow.appendChild(positionCell);
          rankingRow.appendChild(playerCell);
          rankingRow.appendChild(valueCell);

          rankingsContainer.appendChild(rankingRow);
        }
        
        resolve(true);
      })
      .catch(err => {
        console.error(err);
        resolve(false);
      });
  });
}