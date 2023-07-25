let playerLoaderSprite = gameDefaultSprite.sprite || gameDefaultSprite;
let playerLoaderSpriteIdx = gameDefaultSprite.idx || 0;
let loaderSpriteCache = {};
let activeLoaders = {};

function addLoader(target, instant) {
  if (activeLoaders.hasOwnProperty(target))
    return;

  const getLoaderSprites = [
    getLoaderSpriteImg(playerLoaderSprite, playerLoaderSpriteIdx, 0),
    getLoaderSpriteImg(playerLoaderSprite, playerLoaderSpriteIdx, 1),
    getLoaderSpriteImg(playerLoaderSprite, playerLoaderSpriteIdx, 2)
  ];
  const frameIndexes = [ 1, 0, 1, 2 ]
  Promise.allSettled(getLoaderSprites)
    .then(() => {
      if (activeLoaders.hasOwnProperty(target))
        return;
        
      const el = document.createElement('div');
      el.classList.add('loader');

      const targetPosition = getComputedStyle(target).position;
      switch (targetPosition) {
        case 'fixed':
        case 'relative':
          el.style.position = 'fixed';
          break;
      }

      const updateLoaderFrame = () => {
        getLoaderSpriteImg(playerLoaderSprite, playerLoaderSpriteIdx, frameIndexes[loader.frame])
          .then(url => loader.element.children[0].src = url);
        if (loader.frame < 3)
          loader.frame++;
        else
          loader.frame = 0;
      };
      const loader = {
        element: el,
        timer: setInterval(updateLoaderFrame, 150),
        frame: 0
      };
      activeLoaders[target] = loader;

      const img = document.createElement('img');

      el.appendChild(img);

      const isIframe = target.nodeName === 'IFRAME';

      if (isIframe)
        target.parentElement.appendChild(el);
      else
        target.appendChild(el);

      if (instant)
        el.classList.add('visible');
      else
        setTimeout(() => el.classList.add('visible'), 0);

      updateLoader(target);

      updateLoaderFrame();
    });
}

function updateLoader(target) {
  if (activeLoaders.hasOwnProperty(target)) {
    const el = activeLoaders[target].element;
    el.style.top = `${target.offsetTop}px`;
    el.style.left = `${target.offsetLeft}px`;
    el.style.width = `${target.offsetWidth}px`;
    el.style.height = `${target.offsetHeight}px`;

    const scaleX = Math.max(Math.min(Math.floor(target.offsetWidth / 48), 10), 1);
    const scaleY = Math.max(Math.min(Math.floor(target.offsetHeight / 64), 10), 1);
    const scale = Math.min(scaleX, scaleY);

    el.children[0].style.transform = `scale(${scale})`;
  }
}

function removeLoader(target) {
  if (activeLoaders.hasOwnProperty(target)) {
    const el = activeLoaders[target].element;
    el.classList.remove('visible');
    setTimeout(() => el.remove(), 500);
    clearInterval(activeLoaders[target].timer);
    delete activeLoaders[target];
  }
}

async function getLoaderSpriteImg(sprite, idx, frameIdx, dir) {
  const isBrave = ((navigator.brave && await navigator.brave.isBrave()) || false);
  return new Promise(resolve => {
    const spriteData = loaderSpriteCache;
    if (!spriteData[sprite])
      spriteData[sprite] = {};
    if (!spriteData[sprite][idx])
      spriteData[sprite][idx] = [null, null, null];
    const spriteUrl = spriteData[sprite][idx][frameIdx];
    if (spriteUrl)
      return resolve(spriteUrl);
    const img = new Image();
    img.onload = function () {
      getSpriteImg(img, spriteData, sprite, idx, frameIdx, 24, 32, 0, false, isBrave)
        .then(url => resolve(url));
    };
    if (!dir) {
      dir = `../data/${ynoGameId}/CharSet/`;
      img.onerror = () => getLoaderSpriteImg(sprite, idx, frameIdx, `images/charsets/${ynoGameId}/`).then(url => resolve(url));
    } else {
      img.onerror = () => {
        console.error(`Charset '${sprite}' not found`);
        resolve(null);
      };
    }

    img.src = !sprite?.startsWith('#') ? `${dir}${sprite}.png` : '';
  });
}

(function() {
  addLoader(document.getElementById('loadingOverlay'), true);
})();