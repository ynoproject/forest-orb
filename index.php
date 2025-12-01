<?php
  $gameId = substr($_SERVER['REQUEST_URI'], 1, strrpos($_SERVER['REQUEST_URI'], '/', 1) - 1);
  $enableBadgeTools = isset($_GET['badge_tools']) && $_GET['badge_tools'] == 'true';
  switch ($gameId) {
    case "2kki":
      $gameName = "Yume 2kki";
      break;
    case "amillusion":
      $gameName = "Amillusion";
      break;
    case "braingirl":
      $gameName = "Braingirl";
      break;
    case "unconscious":
      $gameName = "Collective Unconscious";
      break;
    case "deepdreams":
      $gameName = "Deep Dreams";
      break;
    case "flow":
      $gameName = ".flow";
      break;
    case "fog":
      $gameName = "FOG";
      break;
    case "genie":
      $gameName = "Dream Genie";
      break;
    case "if":
      $gameName = "If";
      break;
    case "mikan":
      $gameName = "Mikan Muzou";
      break;
    case "muma":
      $gameName = "Muma Rope";
      break;
    case "nostalgic":
      $gameName = "nostAlgic";
      break;
    case "oneshot":
      $gameName = "OneShot";
      break;
    case "oversomnia":
      $gameName = "Oversomnia";
      break;
    case "prayers":
      $gameName = "Answered Prayers";
      break;
    case "sheawaits":
      $gameName = "She Awaits";
      break;
    case "someday":
      $gameName = "Someday";
      break;
    case "tsushin":
      $gameName = "Yume Tsushin";
      break;
    case "ultraviolet":
      $gameName = "Ultra Violet";
      break;
    case "unaccomplished":
      $gameName = "Unaccomplished";
      break;
    case "unevendream":
      $gameName = "Uneven Dream";
      break;
    case "yume":
      $gameName = "Yume Nikki";
      break;
    default:
      $gameId = "2kki";
      $gameName = "Yume 2kki";
      break;
  }

  $userAgent = $_SERVER['HTTP_USER_AGENT'];
  $isMobile = strpos($userAgent, 'Mobile') !== false;
  $isFirefox = strpos($userAgent, 'Firefox') !== false;
?>
<!doctype html>
<html lang="en">
<head>
  <title><?php echo $gameName; ?> Online - YNOproject</title>
  <meta charset="utf-8">
  <meta name="description" content="Play multiplayer <?php echo $gameName; ?> for free! Ad-free and no registration required.">
  <meta name="viewport" content="width=device-width, initial-scale=1.0 <?php if ($isFirefox && $isMobile): ?>, user-scalable=no<?php endif ?>">
  <?php if ($gameId == "2kki"): ?>
    <meta name="2kkiVersion" content=""> <!-- eg. 0.117g Patch 4 -->
  <?php endif ?>
  <link rel="manifest" href="/manifest.json"/>
  <link rel="stylesheet" href="play.css">
  <link rel="stylesheet" href="gamecanvas.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/animations/scale.css" />
  <script src="https://cdn.jsdelivr.net/npm/wasm-feature-detect/dist/umd/index.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/i18next@21.6.4/dist/umd/i18next.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/loc-i18next@0.1.4/dist/umd/loc-i18next.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/tinycolor/1.4.2/tinycolor.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/dist/tippy-bundle.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/scrollwatch@2.0.1/dist/ScrollWatch-2.0.1.min.js"></script>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body <?php if ($isFirefox): ?>class="browserFirefox"<?php endif ?>>
  <div id="background"></div>
  <div id="backgroundOverlay"></div>
  <div id="content">
    <div id="top"></div>
    <div id="header">
      <div id="headerLogoContainer">
        <button id="nexusButton" class="iconButton fillIcon unselectable" data-i18n="[title]tooltips.nexus" dir="ltr">
          <svg height="48" viewBox="0 0 64 28" xmlns="http://www.w3.org/2000/svg">
            <path d="m0 0h6v10h16v-10h6v16h-11v12.5h-6v-12.5h-11v-15.5m34-0.5h22v6h-16v22.5h-6v-28.5m22 6h6v22.5h-6v-22.5"></path>
          </svg>
          <svg height="48" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
            <path d="m0 0h28v28h-28v-28m10 13h-2v2h2v-2m-4 9h16v-16h-16v16m0.5-15.5h15v15h-15v-15"></path>
            <path d="m0 0h28v28h-10l-6 7v-21l9-9h-15v17h3v6h-9v-28m22 5h-0.5v17h0.5v-17m-6 15h-1.5v0.5h-0.5v1.5h2v-2"></path>
          </svg>
          <svg height="48" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
            <path d="m0 0h28v28h-28v-28m10 13h-2v2h2v-2m-4 9h16v-16h-16v16m0.5-15.5h15v15h-15v-15"></path>
            <path d="m0 0h28v28h-10l-6 7v-21l9-9h-15v17h3v6h-9v-28m22 5h-0.5v17h0.5v-17m-6 15h-1.5v0.5h-0.5v1.5h2v-2"></path>
          </svg>
        </button>
        <div id="gameLogoContainer">
          <div id="gameLogo" class="transparent">
            <div id="gameLogoOverlay"></div>
          </div>
        </div>
      </div>
      <div id="headerIconContainer" class="itemContainer smallItemContainer">
        <div id="badgeButton" class="badgeItem item accountRequired unselectable"></div>
        <button id="locationsButton" class="iconButton fillIcon unselectable hidden" data-i18n="[title]tooltips.locations">
          <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="m0 14zv-2.5l3.75-4 3 2 5.25-5 6 4.5v5zm0-9.5a1.0313 1.0313 90 0 0 4 0 1.0313 1.0313 90 0 0-4 0z" /></svg>
        </button>
        <button id="communityScreenshotsButton" class="iconButton fillIcon unselectable" data-i18n="[title]tooltips.communityScreenshots">
          <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="m0.75 5.5h14.5v9.25h-1.25v-8h-13.25zm14.5 9.25v1.25h-14.5v-9.25h1.25v8zm-12.5-0.75v-1.25l2.25-2.5 1.75 1.25 3-3 3.5 2.5v3zm0-5.5a0.5 0.5 90 0 0 2.5 0 0.5 0.5 90 0 0-2.5 0zm0-4.25h13.75v9.75h-1v-8.75h-12.75v-1m2-1.25h13v9h-1v-8h-12v-1" /></svg>
        </button>
        <button id="rankingsButton" class="iconButton fillIcon unselectable" data-i18n="[title]tooltips.rankings">
          <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="m0 18v-11h5.75v11m0.5 0v-16h5.5v16m0.5-6h5.75v6h-5.75v-6" /></svg>
        </button>
        <button id="schedulesButton" class="iconButton fillIcon unselectable" data-i18n="[title]tooltips.schedules">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
            xml:space="preserve" width="32" height="32" viewBox="0 0 18 18">
            <path d="M18 3V18H0V3H3V4.5a.5.5 90 003 0V3H7.5V4.5a.5.5 90 003 0V3H12V4.5a.5.5 90 003 0V3ZM3.5 4.5a.5.5 90 002 0V1a.5.5 90 00-2 0ZM8 4.5a.5.5 90 002 0V1A.5.5 90 008 1Zm4.5 0a.5.5 90 002 0V1a.5.5 90 00-2 0ZM8 7H1.5v4H8Zm2 0v4h6.5V7ZM1.5 16.5H8v-4H1.5Zm8.5-4v4h6.5v-4Z"/>
          </svg>
        </button>
        <button id="loginButton" type="button" class="unselectable" data-i18n="[html]account.login">Login</button>
        <button id="logoutButton" type="button" class="unselectable" data-i18n="[html]account.logout">Logout</button>
      </div>
    </div>
    <div id="layout">
      <div id="mainContainer" class="container">
        <div id="gameContainer">
          <div id="controls">
            <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
              <defs id="svgDefs"></defs>
            </svg>
            <div id="leftControls">
              <button id="privateModeButton" class="iconButton toggleButton altToggleButton transparentToggleButton unselectable" data-i18n="[title]tooltips.togglePrivateMode">
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m5 0a1 1 90 0 0 0 5 1 1 90 0 0 0-5m-4 13c0-5 1-7 4-7 0.375 0 0.5 0 1.25 0.125-0.25 1.625 1.25 3.125 2.5 3.125q0.125 0.25 0.125 0.5c-1.75 0-3.625 1-3.875 4.125q-2.375 0-4-0.875m12-13a1 1 90 0 1 0 5 1 1 90 0 1 0-5m4 13c0-5-1-7-4-7-0.375 0-0.5 0-1.25 0.125 0.25 1.625-1.25 3.125-2.5 3.125q-0.125 0.25-0.125 0.5c1.75 0 3.625 1 3.875 4.125q2.375 0 4-0.875" /><path d="m9 4a1 1 90 0 0 0 5 1 1 90 0 0 0-5m-4 13c0-5 1-7 4-7s4 2 4 7q-4 2-8 0" /></svg>
              </button><button id="saveButton" class="iconButton unselectable" data-i18n="[title]tooltips.save">
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m0 1.5q0-1.5 1.5-1.5h11.25l2.25 2.25v12.75q0 1.5-1.5 1.5h-12q-1.5 0-1.5-1.5v-13.5m4.5-1.5v3.75q0 0.75 0.75 0.75h4.5q0.75 0 0.75-0.75v-3.75m-1.75 1v2.5h0.75v-2.5h-0.75m-5.75 15.5v-6.75q0-0.75 0.75-0.75h7.5q0.75 0 0.75 0.75v6.75m-7.5-6h6m-6 2.25h6m-6 2.25h6" /></svg>
              </button><button id="uiThemeButton" class="iconButton unselectable" data-i18n="[title]tooltips.uiTheme">
                <svg viewBox="0 0 21 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m4.5 3c4.5-4.5 13.5-3 13.5-0.375m-4.125 6.375c-1.875 0-3.375 1.5-1.875 1.875m3 2.625c3 1.5-4.5 6-10.5 4.5-7.5-3-4.5-12 0-15m9-0.75a1.5 1.5 90 0 0 0 3.75 1.5 1.5 90 0 0 0-3.75m-6 0.75a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m-3.75 4.5a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m1.5 5.25a1.5 1.5 90 0 0 0 3 1.5 1.5 90 0 0 0-3m6-0.75a1.5 1.5 90 0 0-0.75 4.5q2.25 0 3-1.875m7.5-14.625q-6 4.5-7.5 10.5l1.5 0.75q4.5-3.75 6-11.25m-7.5 10.5c-3 0-1.5 3-3 4.5 6 0 4.5-3 4.5-3.75m-3.75 2.25c0.75 1.5 1.5 0 1.5 1.275" /></svg>
              </button><button id="chatButton" class="iconButton toggleButton offToggleButton unselectable" data-i18n="[title]tooltips.toggleChat">
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m3 18l6-4.5h6q3 0 3-3v-7.5q0-3-3-3h-12q-3 0-3 3v7.5q0 3 3 3h1.5l-1.5 4.5m11.25-12.75a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3m-5.25 0a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3m-5.25 0a1.5 1.5 90 0 1 0 3 1.5 1.5 90 0 1 0 -3"/><path d="m-2 16l22-14" /></svg>
              </button><?php if ($gameId == "2kki"): ?><button id="explorerButton" style="display: none" class="iconButton toggleButton onToggleButton accountRequired unselectable" data-i18n="[title]tooltips.toggleExplorer">
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m6.75 6.75h4.5v4.5h-4.5v-4.5m2.25 0v-3.75h-1.5v-3h3v3h-1.5m2.25 6h3.75v-1.5h3v3h-3v-1.5m-6 2.25v3.75h1.5v3h-3v-3h1.5m-2.25-6h-3.75v-1.5h-3v3h3v-1.5"/><path d="m-2 16l22-14" /></svg>
              </button><?php endif ?><button id="screenshotButton" class="iconButton unselectable" data-i18n="[title]tooltips.screenshot">
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m3 8q0-1 1-1h1.5c1 0 1-2 2-2h3c1 0 1 2 2 2h1.5q1 0 1 1v4q0 1-1 1h-10q-1 0-1-1zm6-0.5a2 2 90 0 0 0 4 2 2 90 0 0 0 -4m-9-2.5v-2q0-1 1-1h2m12 0h2q1 0 1 1v2m0 8v2q0 1-1 1h-2m-12 0h-2q-1 0-1-1v-2"></path></svg>
              </button><button id="myScreenshotsButton" class="iconButton accountRequired unselectable" data-i18n="[title]tooltips.myScreenshots">
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m0 2h18v13h-18zv13-11.5 11.5zm2.5 10.5v-1.5l2.75-3 2.25 1.5 3.75-3.75 4.25 3.25v3.5zm0-6.75a0.75 0.75 90 0 0 3 0 0.75 0.75 90 0 0-3 0z"></path></svg>
              </button><button id="settingsButton" class="iconButton unselectable" data-i18n="[title]tooltips.settings">
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m9 5.5a1 1 90 0 0 0 7 1 1 90 0 0 0 -7m-7 5.5l-2-0.25v-3.5l2-0.25 0.75-1.5-1.25-1.75 2.25-2.25 1.75 1.25 1.5-0.75 0.25-2h3.5l0.25 2 1.5 0.75 1.75-1.25 2.25 2.25-1.25 1.75 0.75 1.5 2 0.25v3.5l-2 0.25-0.75 1.5 1.25 1.75-2.25 2.25-1.75-1.25-1.5 0.75-0.25 2h-3.5l-0.25-2-1.5-0.75-1.75 1.25-2.25-2.25 1.25-1.75-0.75-1.5" /></svg>
              </button><button id="muteButton" class="iconButton toggleButton offToggleButton unselectable" data-i18n="[title]tooltips.toggleMute">
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m0 7h3l4-4v12l-4-4h-3v-4m10 0q1 2 0 4m3-5.5q2 3.5 0 7m3-9.5q4 6 0 12" /><path d="m-2 16l22-14" /></svg>
              </button><button id="hideLocationButton" class="iconButton toggleButton offToggleButton unselectable" data-i18n="[title]tooltips.toggleHideLocation">
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m3 5q1-5 6-5t6 5-6 11q-7-6-6-11m6-2a1 1 0 0 0 0 5 1 1 0 0 0 0 -5m-2 11c-1 0-3 1-3 2s2 2 5 2 5-1 5-2-2-2-3-2" /><path d="m-2 16l22-14" /></svg>
              </button>
            </div>
            <div id="rightControls">
              <div id="badgeHintControls"></div>
              <div id="mapControls"></div>
              <?php if ($gameId == "2kki"): ?>
                <div id="explorerControls"></div>
              <?php endif ?>
              <div id="eventControls" class="accountRequired" style="display: none">
                <button id="eventsButton" class="iconButton unselectable" data-i18n="[title]tooltips.events">
                  <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m0 9l6.5-1.5-1.5-2.5 2.5 1.5 1.5-6.5 1.5 6.5 2.5-1.5-1.5 2.5 6.5 1.5-6.5 1.5 1.5 2.5-2.5-1.5-1.5 6.5-1.5-6.5-2.5 1.5 1.5-2.5-6.5-1.5m7.75-6q-4.75 0-4.75 4.75m7.25-4.75q4.75 0 4.75 4.75m-7.25 7.25q-4.75 0-4.75-4.75m7.2656 4.75q4.7344 0 4.7344-4.75m-6-2.75a1 1 90 0 0 0 3 1 1 90 0 0 0 -3" /></svg>
                </button>
              </div>

              <!-- Fullscreen-only controls -->
              <button id="fsBadgesButton" class="iconButton fillIcon unselectable fsOnlyControl accountRequired" data-i18n="[title]tooltips.badges">
                <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                  <path d="m9 0 2 2.5 3.5-1v3.5l3.5 1-1.5 3 1.5 3-3.5 1v3.5l-3.5-1-2 2.5-2-2.5-3.5 1v-3.5l-3.5-1 1.5-3-1.5-3 3.5-1v-3.5l3.5 1 2-2.5m0-3v7" />
                </svg>
              </button>
              <button id="fsLocationsButton" class="iconButton fillIcon unselectable fsOnlyControl" data-i18n="[title]tooltips.locations">
                <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                  <path d="m0 14zv-2.5l3.75-4 3 2 5.25-5 6 4.5v5zm0-9.5a1.0313 1.0313 90 0 0 4 0 1.0313 1.0313 90 0 0-4 0z" />
                </svg>
              </button>
              <button id="fsCommunityScreenshotsButton" class="iconButton fillIcon unselectable fsOnlyControl" data-i18n="[title]tooltips.communityScreenshots">
                <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                  <path d="m0.75 5.5h14.5v9.25h-1.25v-8h-13.25zm14.5 9.25v1.25h-14.5v-9.25h1.25v8zm-12.5-0.75v-1.25l2.25-2.5 1.75 1.25 3-3 3.5 2.5v3zm0-5.5a0.5 0.5 90 0 0 2.5 0 0.5 0.5 90 0 0-2.5 0zm0-4.25h13.75v9.75h-1v-8.75h-12.75v-1m2-1.25h13v9h-1v-8h-12v-1" />
                </svg>
              </button>
              <button id="fsRankingsButton" class="iconButton fillIcon unselectable fsOnlyControl" data-i18n="[title]tooltips.rankings">
                <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                  <path d="m0 18v-11h5.75v11m0.5 0v-16h5.5v16m0.5-6h5.75v6h-5.75v-6" />
                </svg>
              </button>
              <button id="fsSchedulesButton" class="iconButton fillIcon unselectable fsOnlyControl" data-i18n="[title]tooltips.schedules">
                <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                  <path d="M18 3V18H0V3H3V4.5a.5.5 90 003 0V3H7.5V4.5a.5.5 90 003 0V3H12V4.5a.5.5 90 003 0V3ZM3.5 4.5a.5.5 90 002 0V1a.5.5 90 00-2 0ZM8 4.5a.5.5 90 002 0V1A.5.5 90 008 1Zm4.5 0a.5.5 90 002 0V1a.5.5 90 00-2 0ZM8 7H1.5v4H8Zm2 0v4h6.5V7ZM1.5 16.5H8v-4H1.5Zm8.5-4v4h6.5v-4Z"/>
                </svg>
              </button>

              <button id="controls-fullscreen" class="iconButton unselectable">
                <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M13.5 13.5H10m3.5 0V10m0 3.5l-4-4m.5-8h3.5m0 0V5m0-3.5l-4 4M5 1.5H1.5m0 0V5m0-3.5l4 4m-4 4.5v3.5m0 0H5m-3.5 0l4-4"></path></svg>
              </button>
            </div>
          </div>

          <div id="canvasContainer">
            <div id="crashFix"> </div>
            <canvas id="canvas" tabindex="-1"></canvas>
          </div>

          <div id="gameChatContainer" class="hidden">
            <div id="gameChatInputContainer" class="gameChatMessageContainer">
              <div class="gameChatMessage message">
                <div class="messageContents">>&nbsp;<span id="gameChatModeIcon"></span><div class="globalCooldownIcon icon hidden"><svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle class="bgCircle" cx="9" cy="9" r="9" /><circle class="timerCircle" cx="9" cy="9" r="9" /></svg></div><span id="gameChatInput" contenteditable="true"></span></div>
              </div>
            </div>
          </div>

          <div id="locationDisplayContainer" class="unselectable">
            <div id="locationDisplayLabelContainer">
              <label id="locationDisplayLabel"></label>
            </div>
            <div id="locationDisplayLabelContainerOverlay"></div>
            <label id="locationDisplayLabelOverlay"></label>
          </div>

          <div id="dpad" class="unselectable">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" class="baseColorFill">
              <path id="dpad-up" data-key="ArrowUp" data-key-code="38" d="M48,5.8C48,2.5,45.4,0,42,0H29.9C26.6,0,24,2.4,24,5.8V24h24V5.8z" />
              <path id="dpad-right" data-key="ArrowRight" data-key-code="39" d="M66.2,24H48v24h18.2c3.3,0,5.8-2.7,5.8-6V29.9C72,26.5,69.5,24,66.2,24z" />
              <path id="dpad-down" data-key="ArrowDown" data-key-code="40" d="M24,66.3c0,3.3,2.6,5.7,5.9,5.7H42c3.3,0,6-2.4,6-5.7V48H24V66.3z" />
              <path id="dpad-left" data-key="ArrowLeft" data-key-code="37" d="M5.7,24C2.4,24,0,26.5,0,29.9V42c0,3.3,2.3,6,5.7,6H24V24H5.7z" />
              <rect id="dpad-center" x="24" y="24" width="24" height="24" />
            </svg>
          </div>

          <div id="apad" class="unselectable">
            <div id="apad-escape" class="baseColorBg apadCircBtn apadBtn" data-key="Escape" data-key-code="27"></div>
            <div id="apad-enter" class="baseColorBg apadCircBtn apadBtn" data-key="Enter" data-key-code="13"></div>
            <?php if ($gameId != "yume"): ?>
              <div id="apad-shift" class="baseColorBg apadRectBtn apadBtn" data-key="ShiftLeft" data-key-code="16"></div>
            <?php endif ?>
            <?php if ($gameId == "yume" || $gameId == "unconscious" || $gameId == "prayers" || $gameId == "someday" || $gameId == "unevendream" || $gameId == "braingirl" || $gameId == "tsushin" || $gameId == "oneshot" || $gameId == "unaccomplished" || $gameId == "fog"): ?>
              <div id="apad-numbers" class="apadBtnContainer">
                <?php if ($gameId == "tsushin"): ?>
                  <div id="apad-0" class="baseColorBg apadSqBtn apadBtn" data-key="Digit0" data-key-code="48"></div>
                <?php endif ?>
                <?php if ($gameId != "prayers"): ?>
                  <div id="apad-1" class="baseColorBg apadSqBtn apadBtn" data-key="Digit1" data-key-code="49"></div>
                <?php endif ?>
                <?php if ($gameId == "unevendream" || $gameId == "braingirl"): ?>
                  <div id="apad-2" class="baseColorBg apadSqBtn apadBtn" data-key="Digit2" data-key-code="50"></div>
                <?php endif ?>
                <?php if ($gameId == "yume" || $gameId == "unconscious" || $gameId == "unevendream" || $gameId == "someday" || $gameId == "tsushin"): ?>
                  <div id="apad-3" class="baseColorBg apadSqBtn apadBtn" data-key="Digit3" data-key-code="51"></div>
                <?php endif ?>
                <?php if ($gameId == "unevendream"): ?>
                  <div id="apad-4" class="baseColorBg apadSqBtn apadBtn" data-key="Digit4" data-key-code="52"></div>
                <?php endif ?>
                <?php if ($gameId == "yume" || $gameId == "unconscious" || $gameId == "unaccomplished"): ?>
                  <div id="apad-5" class="baseColorBg apadSqBtn apadBtn" data-key="Digit5" data-key-code="53"></div>
                <?php endif ?>
                <div id="apad-9" class="baseColorBg apadSqBtn apadBtn" data-key="Digit9" data-key-code="57"></div>
              </div>
            <?php endif ?>
          </div>
          
          <div id="joystick" class="unselectable hidden">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" class="baseColorFill hidden" data-style="joystick">
              <defs>
                <mask id="joystickInset">
                  <rect width="100%" height="100%" fill="white"></rect>
                  <circle id="insetCircle" cx="25" cy="25" r="20" fill="black"></circle>
                </mask>
              </defs>
              <circle id="joystickCircle" cx="25" cy="25" r="25" mask="url(#joystickInset)"></circle>
            </svg>
            <svg width="13.229166mm" height="13.229167mm" viewBox="0 0 13.229166 13.229167" version="1.1"
              data-style="dpad" class="baseColorFill hidden" xmlns="http://www.w3.org/2000/svg"
              xmlns:svg="http://www.w3.org/2000/svg">
              <g id="dpadCircle" transform="translate(-11.225154,-3.5548219)">
                <path
                  d="m 17.839738,3.5548218 a 6.6145835,6.6145835 0 0 0 -6.614583,6.6145832 6.6145835,6.6145835 0 0 0 6.614583,6.614583 6.6145835,6.6145835 0 0 0 6.614583,-6.614583 6.6145835,6.6145835 0 0 0 -6.614583,-6.6145832 z M 16.436723,4.644161 h 2.806547 c 0.242771,0 0.438216,0.1954449 0.438216,0.4382161 v 3.24528 h 3.24528 c 0.242771,0 0.438216,0.1954449 0.438216,0.4382161 v 2.8070638 c 0,0.242772 -0.195445,0.438216 -0.438216,0.438216 h -3.24528 v 3.244763 c 0,0.242772 -0.195445,0.438216 -0.438216,0.438216 h -2.806547 c -0.242772,0 -0.438216,-0.195444 -0.438216,-0.438216 v -3.244763 h -3.24528 c -0.242772,0 -0.438216,-0.195444 -0.438216,-0.438216 V 8.7658732 c 0,-0.2427712 0.195444,-0.4382161 0.438216,-0.4382161 h 3.24528 v -3.24528 c 0,-0.2427712 0.195444,-0.4382161 0.438216,-0.4382161 z"
                  class="joystickBase" />
                <path
                  d="M 15.998507,12.011153 V 8.3276571 h -3.24528 c -0.242772,0 -0.438216,0.1954449 -0.438216,0.4382161 v 2.8070638 c 0,0.242772 0.195444,0.438216 0.438216,0.438216 z"
                  id="joystickLeft" class="joystickDpad" />
                <path
                  d="m 19.681486,12.011153 h -3.682979 v 3.244763 c 0,0.242772 0.195444,0.438216 0.438216,0.438216 h 2.806547 c 0.242771,0 0.438216,-0.195444 0.438216,-0.438216 z"
                  id="joystickDown" class="joystickDpad" />
                <path d="m 19.681486,8.3276571 h -3.682979 v 3.6834959 h 3.682979 z" class="joystickDpad" />
                <path
                  d="m 19.681486,8.3276571 v 3.6834959 h 3.24528 c 0.242771,0 0.438216,-0.195444 0.438216,-0.438216 V 8.7658732 c 0,-0.2427712 -0.195445,-0.4382161 -0.438216,-0.4382161 z"
                  id="joystickRight" class="joystickDpad" />
                <path
                  d="m 16.436723,4.644161 c -0.242772,0 -0.438216,0.1954449 -0.438216,0.4382161 v 3.24528 h 3.682979 v -3.24528 c 0,-0.2427712 -0.195445,-0.4382161 -0.438216,-0.4382161 z"
                  id="joystickUp" class="joystickDpad" />
              </g>
            </svg>
          </div>

        </div>
      </div>
      <div id="chatboxContainer" class="container" style="display: none">
        <div id="chatbox" class="allChat">
          <div id="chatboxInfo">
            <div id="onlineInfo" class="info hidden">
              <span id="connStatus" class="infoContainer unselectable"><span id="connStatusIcon" class="punct">●</span>
              <label id="connStatusText" class="infoText">Disconnected</label>
              <a id="reconnectButton" href="javascript:void(0);" class="reconnectLink iconLink unselectable" data-i18n="[title]chatbox.reconnect">
                <div class="reconnectIcon icon fillIcon altIcon">
                  <svg viewBox="0 0 18 18">
                    <path d="m0 7q1.5-7 9-7 3 0 5.5 2.5l2-2.5 1.5 8h-8l2-2.5q-5-3.5-8 1.5h-4m18 4q-1.5 7-9 7-3 0-5.5-2.5l-2 2.5-1.5-8h8l-2 2.5q5 3.5 8-1.5h4"></path>
                  </svg>
                </div>
              </a></span><span id="playerCountLabel" class="playerCountLabel infoLabel unselectable"></span><span id="mapPlayerCountLabel" class="playerCountLabel infoLabel unselectable hidden"></span><span id="immersionModeLabel" class="infoLabel unselectable" data-i18n="[html]chatbox.immersionMode">Immersion Mode</span>
            </div>
            <div id="location" class="info hidden">
              <span id="locationLabel" class="infoLabel nowrap" data-i18n="[html]chatbox.location">Location:&nbsp;</span><span id="locationText" class="infoText nofilter"></span>
            </div>
            <div id="nextLocationContainer" class="info hidden">
              <button id="toggleNextLocationButton" class="icon fillIcon iconButton" data-i18n="[title]tooltips.chat.toggleNextLocation">
                <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="14" height="14"><path d="m9 0a1 1 0 0 0 0 18 1 1 0 0 0 0-18m0 2a1 1 0 0 1 0 14 1 1 0 0 1 0-14m4 11-2-6-6-2 2 6 6 2m-4-5a1 1 0 0 1 0 2 1 1 0 0 1 0-2"></path></svg>
              </button>
              <div id="nextLocation" class="info">
                <span id="nextLocationLabel" class="infoLabel nowrap" data-i18n="[html]chatbox.nextLocation">Next Loc:&nbsp;</span><span id="nextLocationText" class="infoText nofilter"></span>
              </div>
            </div>
          </div>
          <div id="chatboxContent">
            <div id="chatboxTabs">
              <div id="chatboxTabChat" class="chatboxTab active" data-tab-section="chat">
                <label class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.chat">Chat</label>
                <div id="unreadMessageCountContainer" class="notificationCountContainer hidden">
                  <div class="notificationCount">
                    <label class="notificationCountLabel">0</label>
                  </div>
                </div>
              </div>
              <div id="chatboxTabPlayers" class="chatboxTab" data-tab-section="players">
                <label class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.players">Players</label>
                <div id="incomingFriendRequestCountContainer" class="notificationCountContainer hidden">
                  <div class="notificationCount">
                    <label class="notificationCountLabel">0</label>
                  </div>
                </div>
              </div>
              <div id="chatboxTabParties" class="chatboxTab" data-tab-section="parties">
                <label class="chatboxTabLabel unselectable" data-i18n="[html]chatbox.tab.parties">Parties</label>
              </div>
            </div>
            <div id="chat" class="chatboxTabSection">
              <div id="chatHeader" class="tabHeader">
                <div id="chatTabs" class="subTabs">
                  <div id="chatTabAll" class="chatTab subTab active">
                    <small class="chatTabLabel subTabLabel infoLabel unselectable" data-i18n="[html]chatbox.chat.tab.all">All</small>
                    <div class="subTabBg"></div>
                  </div>
                  <div id="chatTabMap" class="chatTab subTab">
                    <small class="chatTabLabel subTabLabel infoLabel unselectable" data-i18n="[html]chatbox.chat.tab.map">Map</small>
                    <div class="subTabBg"></div>
                  </div>
                  <div id="chatTabGlobal" class="chatTab subTab">
                    <small class="chatTabLabel subTabLabel infoLabel unselectable" data-i18n="[html]chatbox.chat.tab.global">Global</small>
                    <div class="subTabBg"></div>
                  </div>
                  <div id="chatTabParty" class="chatTab partySubTab subTab">
                    <small class="chatTabLabel subTabLabel infoLabel unselectable" data-i18n="[html]chatbox.chat.tab.party">Party</small>
                    <div class="subTabBg"></div>
                  </div>
                </div>
                <div id="chatButtons" class="tabButtons">
                  <button id="globalMessageLocationsButton" class="iconButton toggleButton offToggleButton unselectable" data-i18n="[title]tooltips.chat.toggleGlobalMessageLocations">
                    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                      <path d="m9 0a1 1 0 0 0 0 18 1 1 0 0 0 0-18v18q-10-9 0-18 10 9 0 18m-7.5-4q7.5-3 15 0m-15-10q7.5 2 15 0m-16.5 5h18" /><path d="m-2 16l22-14" />
                    </svg>
                  </button>
                  <button id="messageTimestampsButton" class="iconButton toggleButton offToggleButton unselectable" data-i18n="[title]tooltips.chat.toggleMessageTimestamps">
                    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                      <path d="m9 0a1 1 0 0 0 0 18 1 1 0 0 0 0-18m0 3v6l4 4" /><path d="m-2 16l22-14" />
                    </svg>
                  </button>
                  <button id="mentionFilterButton" class="iconButton toggleButton offToggleButton unselectable" data-i18n="[title]tooltips.chat.filterMentions">
                    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                      <path d="M13.5 9a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0Zc0 1.657 1.007 3 2.25 3S18 10.657 18 9a9 9 0 10-2.636 6.364M13.5 9V5.25"/><path d="M13.5 9a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0Zc0 1.657 1.007 3 2.25 3S18 10.657 18 9a9 9 0 10-2.636 6.364M13.5 9V5.25"/>
                    </svg>
                  </button>
                  <button id="clearChatButton" class="iconButton unselectable" data-i18n="[title]tooltips.chat.clearChat">
                    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                      <path d="m3 18l6-4.5h6q3 0 3-3v-7.5q0-3-3-3h-12q-3 0-3 3v7.5q0 3 3 3h1.5l-1.5 4.5m9.5-14.75l-7 7m0-7l7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              <div id="messages" class="chatboxTabContent scrollableContainer"></div>
            </div>
            <div id="players" class="chatboxTabSection hidden">
              <div id="playersHeader" class="tabHeader">
                <div id="playersTabs" class="subTabs">
                  <div id="playersTabMap" class="playersTab subTab active">
                    <small class="playersTabLabel subTabLabel infoLabel unselectable" data-i18n="[html]chatbox.players.tab.map">Map</small>
                    <div class="subTabBg"></div>
                  </div>
                  <div id="playersTabFriends" class="playersTab friendsSubTab subTab">
                    <small class="playersTabLabel subTabLabel infoLabel unselectable" data-i18n="[html]chatbox.players.tab.friends">Friends</small>
                    <div class="subTabBg"></div>
                  </div>
                  <div id="playersTabParty" class="playersTab partySubTab subTab">
                    <small class="playersTabLabel subTabLabel infoLabel unselectable" data-i18n="[html]chatbox.players.tab.party">Party</small>
                    <div class="subTabBg"></div>
                  </div>
                </div>
                <div id="playersButtons" class="tabButtons"></div>
              </div>
              <div id="playerList" class="playerList chatboxTabContent scrollableContainer"></div>
              <div id="friendsPlayerList" class="playerList chatboxTabContent scrollableContainer"></div>
              <div id="partyPlayerList" class="playerList chatboxTabContent scrollableContainer"></div>
            </div>
            <div id="parties" class="chatboxTabSection hidden">
              <div id="partiesHeader" class="tabHeader">
                <div id="partiesTabs" class="subTabs"></div>
                <div id="partiesButtons" class="tabButtons">
                  <button id="createPartyButton" class="iconButton unselectable" data-i18n="[title]tooltips.parties.createParty">
                    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                      <path d="m9 4a1 1 90 0 0 0 5 1 1 90 0 0 0-5m-4 13c0-5 1-7 4-7 1.625 0 2.5313 0.6875 2.75 1.125v0.625h-3v3.5h3v2.25q-3.2344 1.2344-6.75-0.5m0-17a1 1 90 0 0 0 5 1 1 90 0 0 0-5m-4 13c0-5 1-7 4-7 0.375 0 0.5 0 1.25 0.125-0.25 1.625 1.25 3.125 2.5 3.125q0.125 0.25 0.125 0.5c-1.75 0-3.625 1-3.875 4.125q-2.375 0-4-0.875m12-13a1 1 90 0 1 0 5 1 1 90 0 1 0-5m4 11.75c-0.125-3.625-1-5.75-4-5.75-0.375 0-0.5 0-1.25 0.125 0.25 1.625-1.25 3.125-2.5 3.125q-0.125 0.25-0.125 0.5c1.75 0 2.5 0.875 2.625 1v-2h3.5v3h1.75m-2 6.25v-3h3v-3h-3v-3h-3v3h-3v3h3v3h3" />
                    </svg>
                  </button>
                  <button id="disbandPartyButton" class="iconButton unselectable" data-i18n="[title]tooltips.parties.disbandParty">
                    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                      <path d="m9 4c0.4375 0 1.375 0.1875 1.9062 0.875l-1.9062 1.875-1.9063-1.875c0.6563-0.75 1.4688-0.875 1.9063-0.875m-4 11.25l4-4 3.9375 3.9375s0.0625 0.25 0.0625 1.8125q-4 2-8 0-0.0625-1.5 0-1.75m0-15.25m1.6562 4.4063c2.2813-2.4688-0.4687-5.2813-2.7812-4.1563q-0.5 0.3125-0.7813 0.625l3.5625 3.5313m-5.6562 8.5937c0.5 0.25 0.9375 0.4375 1.25 0.5l4.5-4.5-2.875-2.875c-3.1875 0.5-2.875 6.125-2.875 6.875m10.344-8.5937c-2.2813-2.4688 0.4687-5.2813 2.7812-4.1563q0.5 0.3125 0.7813 0.625l-3.5625 3.5313m5.6562 8.5937c-0.5 0.25-0.9375 0.4375-1.25 0.5l-4.5-4.5 2.875-2.875c3.1875 0.5 2.875 6.125 2.875 6.875m-14-12l6 6 7-7 2 2-7 7 7 7-2 2-7-7-7 7-2-2 7-7-6-6 2-2" />
                    </svg>
                  </button>
                </div>
              </div>
              <div id="partyList" class="partyList chatboxTabContent scrollableContainer"></div>
            </div>
          </div>
          <div id="chatInputContainer" style="display: none">
            <form action="javascript:chatInputActionFired()">
              <input id="chatInput" data-ynomoji="true" type="text" autocomplete="off" maxlength="150" disabled="true" />
              <div id="globalChatInputOverlay"></div>
              <div id="chatBorder"></div>
            </form>
            <div class="globalCooldownIcon icon">
              <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <circle class="bgCircle" cx="9" cy="9" r="9" />
                <circle class="timerCircle" cx="9" cy="9" r="9" />
              </svg>
            </div>
            <button id="globalMessageButton" class="iconButton fadeToggle unselectable" data-i18n="[title]tooltips.toggleGlobalMessage">
              <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <path d="m9 0a1 1 0 0 0 0 18 1 1 0 0 0 0-18v18q-10-9 0-18 10 9 0 18m-7.5-4q7.5-3 15 0m-15-10q7.5 2 15 0m-16.5 5h18" />
                <path d="m-2 16l22-14" />
              </svg>
            </button>
          </div>
          <div id="ynomojiContainer" class="scrollableContainer hidden"></div>
          <div id="enterNameContainer">
            <span id="enterNameInstruction">
              <span data-i18n="[html]chatbox.chat.nickname.header">You must set a nickname before you can chat.</span>
              <br>
              <small>
                <span data-i18n="[html]chatbox.chat.nickname.rule.maxLength">* Maximum 12 characters</span>
                <br>
                <span data-i18n="[html]chatbox.chat.nickname.rule.alphanumeric">* Alphanumeric characters only</span>
              </small>
            </span>
            <form id="enterNameForm" action="javascript:chatNameCheck()">
              <input id="nameInput" type="text" autocomplete="off" maxlength="10" />
            </form>
          </div>
        </div>
        <?php if ($gameId == "2kki"): ?>
        <div id="explorerContainer" style="display: none" class="accountRequired" data-game-ids>
          <iframe id="explorerFrame" class="unselectable"></iframe>
          <a id="explorerUndiscoveredLocationsLink" href="javascript:void(0);" class="iconLink hidden" data-i18n="[title]tooltips.explorerUndiscoveredLocations">
            <div class="helpIcon icon fillIcon invertFillIcon altIcon">
              <svg viewBox="0 0 18 18">
                <path d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25" />
              </svg>
            </div>
          </a>
        </div>
        <?php endif ?>
      </div>
      <div id="modalContainer" class="modalContainer hidden">
        <div id="loginModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.login.title">Login</h1>
          </div>
          <div class="modalContent">
            <form id="loginForm">
              <ul class="formControls">
                <li class="formControlRow">
                  <label for="loginUsername" class="unselectable" data-i18n="[html]modal.login.fields.username">Username</label><input id="loginUsername" name="user" type="text" autocomplete="off" maxlength="12" />
                </li>
                <li class="formControlRow">
                  <label for="loginPassword" class="unselectable" data-i18n="[html]modal.login.fields.password">Password</label><input id="loginPassword" name="password" type="password" autocomplete="off" />
                </li>
                <li id="loginErrorRow" class="formControlRow hidden">
                  <label id="loginError"></label>
                </li>
              </ul>
              <div class="cf-turnstile" data-sitekey="<YOUR-SITE-KEY>"></div>
              <button type="submit" data-i18n="[html]modal.login.submit">Submit</button>
            </form>
          </div>
          <div class="modalFooter">
            <span class="infoLabel" data-i18n="[html]modal.login.registerPrompt">Don't have an account?&nbsp;</span><a id="loginRegisterLink" href="javascript:void(0);" data-i18n="[html]modal.login.register">Register</a>
          </div>
        </div>
        <div id="registerModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.register.title">Register</h1>
          </div>
          <div class="modalContent">
            <form id="registerForm">
              <ul class="formControls">
                <!--<li class="formControlRow">
                  <label for="registerEmail" class="unselectable" data-i18n="[html]modal.register.fields.email">Email</label><input id="registerEmail" type="text" autocomplete="off" />
                </li>-->
                <li class="formControlRow">
                  <label for="registerUsername" class="unselectable" data-i18n="[html]modal.register.fields.username">Username</label><input id="registerUsername" name="user" type="text" autocomplete="off" maxlength="12" />
                </li>
                <li class="formControlRow">
                  <label for="registerPassword" class="unselectable" data-i18n="[html]modal.register.fields.password">Password</label><input id="registerPassword" name="password" type="password" autocomplete="off" maxlength="72" />
                </li>
                <li class="formControlRow">
                  <label for="registerConfirmPassword" class="unselectable" data-i18n="[html]modal.register.fields.confirmPassword">Confirm Password</label><input id="registerConfirmPassword" type="password" autocomplete="off" maxlength="72" />
                </li>
                <li id="registerErrorRow" class="formControlRow hidden">
                  <label id="registerError"></label>
                </li>
              </ul>
              <div class="cf-turnstile" data-sitekey="<YOUR-SITE-KEY>"></div>
              <button type="submit" data-i18n="[html]modal.register.submit">Submit</button>
            </form>
          </div>
          <div class="modalFooter">
            <span class="infoLabel" data-i18n="[html]modal.register.loginPrompt">Already have an account?&nbsp;</span><a href="javascript:void(0);" onclick="openModal('loginModal')" data-i18n="[html]modal.register.login">Login</a>
          </div>
        </div>
        <div id="settingsModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.settings.title">Settings</h1>
          </div>
          <div class="modalContent">
            <ul class="formControls">
              <li class="formControlRow">
                <label for="lang" class="unselectable" data-i18n="[html]modal.settings.fields.lang">Language</label>
                <div>
                  <label id="translationInstruction" class="nofilter hidden"><a id="translationLink" target="_blank" data-i18n="[html]instruction.translation">Translation Work Needed</a></label>
                  <div>
                    <select id="lang" size="4">
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                      <option value="zh">中文</option>
                      <option value="ko">한국어</option>
                      <option value="es">Español</option>
                      <option value="eo">Esperanto</option>
                      <option value="pt">Português</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="it">Italiano</option>
                      <option value="pl">Polski</option>
                      <option value="ro">Română</option>
                      <option value="tr">Türkçe</option>
                      <option value="ru">Русский</option>
                      <option value="vi">Tiếng Việt</option>
                      <option value="ar">العربية</option>
                      <option value="id">Bahasa Indonesia</option>
                      <option value="uk">Українська</option>
                    </select>
                  </div>
                  <label id="noGameLocInstruction" class="hidden" data-i18n="[html]instruction.noGameLoc">* Game Localization Unsupported</label>
                </div>
              </li>
              <li class="formControlRow">
                <label for="nametagMode" class="unselectable" data-i18n="[html]modal.settings.fields.nametagMode.label">Nametags</label>
                <div>
                  <select id="nametagMode" size="4">
                    <option value="0" data-i18n="[html]modal.settings.fields.nametagMode.values.none">None</option>
                    <option value="1" data-i18n="[html]modal.settings.fields.nametagMode.values.classic" selected>Classic</option>
                    <option value="2" data-i18n="[html]modal.settings.fields.nametagMode.values.compact">Compact</option>
                    <option value="3" data-i18n="[html]modal.settings.fields.nametagMode.values.slim">Slim</option>
                  </select>
                </div>
              </li>
              <li class="formControlRow">
                <label for="wikiLinkMode" class="unselectable" data-i18n="[html]modal.settings.fields.wikiLinkMode.label">Wiki Link Popup</label>
                <div>
                  <select id="wikiLinkMode" size="3">
                    <option value="2" data-i18n="modal.settings.fields.wikiLinkMode.values.always">Always</option>
                    <option value="1" data-i18n="modal.settings.fields.wikiLinkMode.values.fullscreen" selected>Fullscreen Only</option>
                    <option value="0" data-i18n="modal.settings.fields.wikiLinkMode.values.never">Never</option>
                  </select>
                </div>
              </li>
              <li class="formControlRow">
                <label for="saveReminder" class="unselectable" data-i18n="[html]modal.settings.fields.saveReminder.label">Save Notification Interval</label>
                <div>
                  <select id="saveReminder" size="4">
                    <option value="10" data-i18n="modal.settings.fields.saveReminder.interval.minutes" i18n-options="{'interval':10}">10 minutes</option>
                    <option value="15" data-i18n="modal.settings.fields.saveReminder.interval.minutes" i18n-options="{'interval':15}">15 minutes</option>
                    <option value="20" data-i18n="modal.settings.fields.saveReminder.interval.minutes" i18n-options="{'interval':20}">20 minutes</option>
                    <option value="30" data-i18n="modal.settings.fields.saveReminder.interval.minutes" i18n-options="{'interval':30}">30 minutes</option>
                    <option value="45" data-i18n="modal.settings.fields.saveReminder.interval.minutes" i18n-options="{'interval':45}">45 minutes</option>
                    <option value="60" data-i18n="modal.settings.fields.saveReminder.interval.minutes" i18n-options="{'interval':60}">60 minutes</option>
                    <option value="90" data-i18n="modal.settings.fields.saveReminder.interval.minutes" i18n-options="{'interval':90}">90 minutes</option>
                    <option value="120" data-i18n="modal.settings.fields.saveReminder.interval.minutes" i18n-options="{'interval':120}">120 minutes</option>
                    <option value="0" data-i18n="modal.settings.fields.saveReminder.interval.never">Never</option>
                  </select>
                </div>
              </li>
              <li class="formControlRow">
                <label for="soundVolume" class="unselectable" data-i18n="[html]modal.settings.fields.soundVolume">Sound Volume</label>
                <div>
                  <input id="soundVolume" type="range" min="0" max="100" value="100" step="5" class="slider" />
                </div>
              </li>
              <li class="formControlRow">
                <label for="musicVolume" class="unselectable" data-i18n="[html]modal.settings.fields.musicVolume">Music Volume</label>
                <div>
                  <input id="musicVolume" type="range" min="0" max="100" value="100" step="5" class="slider" />
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable" data-i18n="[html]modal.settings.fields.togglePlayerSounds">Player Sounds</label>
                <div>
                  <button id="playerSoundsButton" class="checkboxButton inverseToggle unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable">
                  <span data-i18n="[html]modal.settings.fields.toggleEnableBadgeHints.label">Badge Hints</span>
                  <a href="javascript:void(0);" class="helpLink iconLink" data-i18n="[title]modal.settings.fields.toggleEnableBadgeHints.helpText">
                    <div class="helpIcon icon fillIcon invertFillIcon altIcon">
                      <svg viewBox="0 0 18 18">
                        <path d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25" />
                      </svg>
                    </div>
                  </a>
                </label>
                <div>
                  <button id="badgeHintsButton" class="checkboxButton inverseToggle unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow indent badgeHintRow">
                <label class="unselectable" data-i18n="[html]modal.settings.fields.togglePlayBadgeHintSound">Play Badge Hint Sound</label>
                <div>
                  <button id="playBadgeHintSoundButton" class="checkboxButton inverseToggle unselectable"><span></span></button>
                </div>
              </li>
              <?php if ($gameId == "2kki"): ?>
              <li class="formControlRow">
                <label class="unselectable">
                  <span data-i18n="[html]modal.settings.fields.toggleEnableExplorer.label">Navigator</span>
                  <a href="javascript:void(0);" class="helpLink iconLink" data-i18n="[title]modal.settings.fields.toggleEnableExplorer.helpText">
                    <div class="helpIcon icon fillIcon invertFillIcon altIcon">
                      <svg viewBox="0 0 18 18">
                        <path d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25" />
                      </svg>
                    </div>
                  </a>
                </label>
                <div>
                  <button id="enableExplorerButton" class="checkboxButton unselectable"><span></span></button>
                </div>
              </li>
              <?php endif ?>
              <li class="formControlRow">
                <label class="unselectable">
                  <span data-i18n="[html]modal.settings.fields.toggleImmersionMode.label">Immersion Mode</span>
                  <a href="javascript:void(0);" class="helpLink iconLink" data-i18n="[title]modal.settings.fields.toggleImmersionMode.helpText">
                    <div class="helpIcon icon fillIcon invertFillIcon altIcon">
                      <svg viewBox="0 0 18 18">
                        <path d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25" />
                      </svg>
                    </div>
                  </a>
                </label>
                <div>
                  <button id="immersionModeButton" class="checkboxButton unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable">
                  <span data-i18n="[html]modal.settings.fields.toggleSingleplayerMode.label">Singleplayer Mode</span>
                  <a href="javascript:void(0);" class="helpLink iconLink" data-i18n="[title]modal.settings.fields.toggleSingleplayerMode.helpText">
                    <div class="helpIcon icon fillIcon invertFillIcon altIcon">
                      <svg viewBox="0 0 18 18">
                        <path d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25" />
                      </svg>
                    </div>
                  </a>
                </label>
                <div>
                  <button id="singleplayerModeButton" class="checkboxButton unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow mobileOnly">
                <label class="unselectable" data-i18n="[html]modal.settings.fields.toggleMobileControls">Show Mobile Controls</label>
                <div>
                  <button id="mobileControlsButton" class="checkboxButton inverseToggle unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow mobileOnly">
                <label class="unselectable">
                  <span data-i18n="[html]modal.settings.fields.mobileControlsType.label">Mobile Controls Type</span>
                  <a href="javascript:void(0);" class="helpLink iconLink" data-i18n="[title]tooltips.mobileControlsType">
                    <div class="helpIcon icon fillIcon invertFillIcon altIcon">
                      <svg viewBox="0 0 18 18">
                        <path d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25" />
                      </svg>
                    </div>
                  </a>
                </label>
                <div>
                  <select id="mobileControl" size="3">
                    <option value="default" selected data-i18n="[html]modal.settings.fields.mobileControlsType.default">D-Pad</option>
                    <option value="joystick" data-i18n="[html]modal.settings.fields.mobileControlsType.joystick">Floating Joystick</option>
                    <option value="dpad" data-i18n="[html]modal.settings.fields.mobileControlsType.dpad">Floating D-Pad</option>
                  </select>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable" data-i18n="[html]modal.settings.fields.toggleLocationDisplay">Location Display</label>
                <div>
                  <button id="locationDisplayButton" class="checkboxButton unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable" data-i18n="[html]modal.settings.fields.toggleRankings">Rankings</label>
                <div>
                  <button id="toggleRankingsButton" class="checkboxButton inverseToggle unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable" data-i18n="[html]modal.settings.fields.toggleSchedules">Events</label>
                <div>
                  <button id="toggleSchedulesButton" class="checkboxButton inverseToggle unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable">
                  <span data-i18n="[html]modal.settings.fields.togglePreloads.label">Preloads</span>
                  <a href="javascript:void(0);" class="helpLink iconLink" data-i18n="[title]modal.settings.fields.togglePreloads.helpText">
                    <div class="helpIcon icon fillIcon invertFillIcon altIcon">
                      <svg viewBox="0 0 18 18">
                        <path d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25" />
                      </svg>
                    </div>
                  </a>
                </label>
                <div>
                  <button id="togglePreloadsButton" class="checkboxButton unselectable"><span></span></button>
                </div>
              </li>
              <?php if ($gameId == "2kki"): ?>
              <li class="formControlRow indent preloadRow hidden">
                <label class="unselectable">
                  <span data-i18n="[html]modal.settings.fields.toggleQuestionablePreloads">Preload PC Wallpapers</span>
                </label>
                <div>
                  <button id="toggleQuestionablePreloadsButton" class="checkboxButton unselectable"><span></span></button>
                </div>
              </li>
              <?php endif ?>
              <li class="formControlRow">
                <label class="unselectable">
                  <span data-i18n="[html]modal.settings.fields.unicodeFont">Alternate Font</span>
                </label>
                <div>
                  <button id="toggleUnicodeFont" class="checkboxButton unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow buttonRow">
                <button id="blocklistButton" class="unselectable" type="button" data-i18n="[html]modal.settings.blocklist">Blocklist</button>
                <button id="chatSettingsButton" class="unselectable" type="button" data-i18n="[html]modal.settings.chatSettings" onclick="openModal('chatSettingsModal', null, 'settingsModal')">Chat</button>
                <button id="screenshotSettingsButton" class="unselectable" type="button" data-i18n="[html]modal.settings.screenshotSettings" onclick="openModal('screenshotSettingsModal', null, 'settingsModal')">Screenshots</button>
                <button id="notificationSettingsButton" class="unselectable" type="button" data-i18n="[html]modal.settings.notificationSettings" onclick="openModal('notificationSettingsModal', null, 'settingsModal')">Notifications</button>
                <button id="cacheSettingsButton" class="unselectable" type="button" data-i18n="[html]modal.settings.cacheSettings" onclick="openCacheSettingsModal('settingsModal')">Cache</button>
                <button id="accountSettingsButton" class="unselectable accountRequired" type="button" data-i18n="[html]modal.settings.accountSettings">Account</button>
                <button class="unselectable" type="button" data-i18n="[html]modal.settings.engineSettings" onclick="closeModal();simulateKeyboardInput('F1',112)">Engine (F1)</button>
              </li>
            </ul>
          </div>
        </div>
        <div id="blocklistModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.blocklist.title">Blocklist</h1>
          </div>
          <div class="modalContent">
            <span id="blocklistModalEmptyLabel" class="infoLabel" data-i18n="[html]modal.blocklist.empty">Your blocklist is currently empty</span>
            <div id="blocklistModalPlayerListContainer" class="scrollableContainer">
              <div id="blocklistModalPlayerList" class="playerList"></div>
            </div>
          </div>
        </div>
        <div id="chatSettingsModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.chatSettings.title">Chat Settings</h1>
          </div>
          <div class="modalContent">
            <ul class="formControls">
              <li class="formControlRow">
                <label class="unselectable" data-i18n="[html]modal.chatSettings.fields.toggleGameChat.label">In-Game Chat Overlay</label>
                <div>
                  <button id="gameChatButton" class="checkboxButton unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow indent gameChatRow">
                <label class="unselectable" data-i18n="[html]modal.chatSettings.fields.toggleGameChat.global">Global Chat Overlay</label>
                <div>
                  <button id="gameChatGlobalButton" class="checkboxButton unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow indent gameChatRow">
                <label class="unselectable" data-i18n="[html]modal.chatSettings.fields.toggleGameChat.party">Party Chat Overlay</label>
                <div>
                  <button id="gameChatPartyButton" class="checkboxButton unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow desktopOnly">
                <label class="unselectable" data-i18n="[html]modal.chatSettings.fields.toggleTabToChat">Press Tab to Chat</label>
                <div>
                  <button id="tabToChatButton" class="checkboxButton inverseToggle unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable" data-i18n="[html]modal.chatSettings.fields.togglePlayMentionSound">Play Mention Sound</label>
                <div>
                  <button id="playMentionSoundButton" class="checkboxButton inverseToggle unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable" data-i18n="[html]modal.chatSettings.fields.blurScreenshotEmbeds">Blur All Screenshots</label>
                <div>
                  <button id="blurScreenshotEmbedsButton" class="checkboxButton unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label for="mapChatHistoryLimit" class="unselectable" data-i18n="[html]modal.chatSettings.fields.mapChatHistoryLimit.label">Map Chat History Limit</label>
                <div>
                  <select id="mapChatHistoryLimit">
                    <option value="25" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.25">25</option>
                    <option value="50" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.50">50</option>
                    <option value="100" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.100" selected>100</option>
                    <option value="250" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.250">250</option>
                    <option value="500" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.500">500</option>
                    <option value="1000" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.1000">1000</option>
                    <option value="2500" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.2500">2500</option>
                    <option value="0" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.0">Unlimited</option>
                  </select>
                </div>
              </li>
              <li class="formControlRow">
                <label for="globalChatHistoryLimit" class="unselectable" data-i18n="[html]modal.chatSettings.fields.globalChatHistoryLimit.label">Global Chat History Limit</label>
                <div>
                  <select id="globalChatHistoryLimit">
                    <option value="25" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.25">25</option>
                    <option value="50" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.50">50</option>
                    <option value="100" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.100" selected>100</option>
                    <option value="250" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.250">250</option>
                    <option value="500" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.500">500</option>
                    <option value="1000" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.1000">1000</option>
                    <option value="2500" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.2500">2500</option>
                    <option value="0" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.0">Unlimited</option>
                  </select>
                </div>
              </li>
              <li class="formControlRow">
                <label for="partyChatHistoryLimit" class="unselectable" data-i18n="[html]modal.chatSettings.fields.partyChatHistoryLimit.label">Map Chat History Limit</label>
                <div>
                  <select id="partyChatHistoryLimit">
                    <option value="25" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.25">25</option>
                    <option value="50" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.50">50</option>
                    <option value="100" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.100">100</option>
                    <option value="250" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.250" selected>250</option>
                    <option value="500" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.500">500</option>
                    <option value="1000" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.1000">1000</option>
                    <option value="2500" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.2500">2500</option>
                    <option value="0" data-i18n="[html]modal.chatSettings.fields.chatHistoryLimit.values.0">Unlimited</option>
                  </select>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div id="screenshotSettingsModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.screenshotSettings.title">Screenshot Settings</h1>
          </div>
          <div class="modalContent">
            <ul class="formControls">
              <li class="formControlRow">
                <label class="unselectable" data-i18n="[html]modal.screenshotSettings.fields.autoDownloadScreenshots">Automatically Download Screenshots</label>
                <div>
                  <button id="autoDownloadScreenshotsButton" class="checkboxButton unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label for="screenshotResolution" class="unselectable" data-i18n="[html]modal.screenshotSettings.fields.screenshotResolution.label">Screenshot Download Resolution</label>
                <div>
                  <select id="screenshotResolution">
                    <option value="1" data-i18n="[html]modal.screenshotSettings.fields.screenshotResolution.values.1" selected>1x - 320x240</option>
                    <option value="2" data-i18n="[html]modal.screenshotSettings.fields.screenshotResolution.values.2">2x - 640x480</option>
                    <option value="3" data-i18n="[html]modal.screenshotSettings.fields.screenshotResolution.values.3">3x - 960x720</option>
                    <option value="4" data-i18n="[html]modal.screenshotSettings.fields.screenshotResolution.values.4">4x - 1280x960</option>
                  </select>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div id="notificationSettingsModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.notificationSettings.title">Notification Settings</h1>
          </div>
          <div class="modalContent">
            <ul class="formControls">
              <li class="formControlRow">
                <label class="unselectable" data-i18n="[html]modal.notificationSettings.fields.toggleNotifications">Notifications</label>
                <div>
                  <button id="notificationsButton" class="checkboxButton inverseToggle unselectable"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label for="notificationScreenPosition" class="unselectable" data-i18n="[html]modal.notificationSettings.fields.screenPosition.label">Screen Position</label>
                <div>
                  <select id="notificationScreenPosition" size="4">
                    <option value="bottomLeft" data-i18n="[html]modal.notificationSettings.fields.screenPosition.values.bottomLeft">Bottom Left</option>
                    <option value="bottomRight" data-i18n="[html]modal.notificationSettings.fields.screenPosition.values.bottomRight">Bottom Right</option>
                    <option value="topLeft" data-i18n="[html]modal.notificationSettings.fields.screenPosition.values.topLeft">Top Left</option>
                    <option value="topRight" data-i18n="[html]modal.notificationSettings.fields.screenPosition.values.topRight">Top Right</option>
                  </select>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div id="cacheSettingsModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.cacheSettings.title">Cache Settings</h1>
          </div>
          <div class="modalContent">
            <ul class="formControls" style="overflow: visible">
              <li class="formControlRow">
                <label class="unselectable" data-i18n="[html]modal.cacheSettings.fields.locationCache">Location Cache</label>
                <div>
                  <button type="button" id="clearLocationCacheButton" class="unselectable" data-i18n="[html]modal.cacheSettings.clear" onclick="clearCache(CACHE_TYPE.location, this)">Clear</button>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable" data-i18n="[html]modal.cacheSettings.fields.mapCache">Map Cache</label>
                <div>
                  <button type="button" id="clearMapCacheButton" class="unselectable" data-i18n="[html]modal.cacheSettings.clear" onclick="clearCache(CACHE_TYPE.map, this)">Clear</button>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable" data-i18n="[html]modal.cacheSettings.fields.locationColorCache">Location Color Cache</label>
                <div>
                  <button type="button" id="clearLocationColorCacheButton" class="unselectable" data-i18n="[html]modal.cacheSettings.clear" onclick="clearCache(CACHE_TYPE.locationColor, this)">Clear</button>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div id="accountSettingsModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.accountSettings.title">Account Settings</h1>
          </div>
          <div class="modalContent itemContainer">
            <ul class="formControls">
              <li class="formControlRow buttonRow">
                <button id="changePasswordButton" class="unselectable" type="button" data-i18n="[html]modal.accountSettings.fields.changePassword">Change Password</button>
              </li>
              <li class="formControlRow">
                <label for="accountBadgeButton" class="unselectable" data-i18n="[html]modal.accountSettings.fields.badge">Badge</label>
                <div>
                  <div id="accountBadgeButton" class="badgeItem item unselectable"></div>
                </div>
              </li>
              <li id="saveSyncSlotIdRow" class="formControlRow buttonRow">
                <button id="clearSaveSyncButton" class="unselectable" type="button" data-i18n="[html]modal.accountSettings.fields.clearSaveSync">Clear Save Sync Data</button>
              </li>
            </ul>
          </div>
        </div>
        <div id="passwordModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.password.title">Change Password</h1>
          </div>
          <div class="modalContent">
            <form id="changePasswordForm" class="fullWidth">
              <ul class="formControls">
                <li class="formControlRow">
                  <label for="oldPassword" class="unselectable" data-i18n="[html]modal.password.fields.oldPassword">Old Password</label><input id="oldPassword" name="password" type="password" autocomplete="off" />
                </li>
                <li class="formControlRow">
                  <label for="newPassword" class="unselectable" data-i18n="[html]modal.password.fields.newPassword">New Password</label><input id="newPassword" name="newPassword" type="password" autocomplete="off" />
                </li>
                <li class="formControlRow">
                  <label for="confirmPassword" class="unselectable" data-i18n="[html]modal.password.fields.newConfirmPassword">Confirm New Password</label><input id="newConfirmPassword" type="password" autocomplete="off" />
                </li>
                <li id="passwordErrorRow" class="formControlRow hidden">
                  <label id="passwordError"></label>
                </li>
              </ul>
              <button type="submit" data-i18n="[html]modal.password.submit">Submit</button>
            </form>
          </div>
        </div>
        <div id="badgesModal" class="modal fullscreenModal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.badges.title">Badge</h1>
            <div id="badgeControls" class="uiControls wrap">
              <div class="uiControl">
                <label for="badgeUnlockStatus" class="unselectable" data-i18n="[html]modal.badges.fields.unlockStatus.label">Unlock Status:&nbsp;</label>
                <select id="badgeUnlockStatus">
                  <option value="" data-i18n="[html]modal.badges.fields.unlockStatus.values.all">All</option>
                  <option value="0" data-i18n="[html]modal.badges.fields.unlockStatus.values.0">Locked</option>
                  <option value="1" data-i18n="[html]modal.badges.fields.unlockStatus.values.1">Unlocked</option>
                  <option value="recentUnlock" data-i18n="[html]modal.badges.fields.unlockStatus.values.recentUnlock">Recently Unlocked</option>
                </select>
              </div>
              <div class="uiControl">
                <label for="badgeSortOrder" class="unselectable" data-i18n="[html]modal.badges.fields.sortOrder.label">Sort Order:&nbsp;</label>
                <select id="badgeSortOrder">
                  <option value="" data-i18n="[html]modal.badges.fields.sortOrder.values.default">Default</option>
                </select>
              </div>
              <div class="uiControl">
                <label for="badgeSearch" class="unselectable" data-i18n="[html]modal.badges.fields.search.label">Search:&nbsp;</label>
                <div style="display: inline-block">
                  <svg data-kind="name" class="icon searchIcon hidden" height="24px" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M14.2639 15.9376L12.5958 14.2835C11.7909 13.4852 11.3884 13.0861 10.9266 12.9402C10.5204 12.8119 10.0838 12.8166 9.68048 12.9537C9.22188 13.1096 8.82814 13.5173 8.04068 14.3327L4.04409 18.2802M14.2639 15.9376L14.6053 15.5991C15.4112 14.7999 15.8141 14.4003 16.2765 14.2544C16.6831 14.1262 17.12 14.1312 17.5236 14.2688C17.9824 14.4252 18.3761 14.834 19.1634 15.6515L20 16.4936M14.2639 15.9376L18.275 19.9566M18.275 19.9566C17.9176 20.0001 17.4543 20.0001 16.8 20.0001H7.2C6.07989 20.0001 5.51984 20.0001 5.09202 19.7821C4.71569 19.5904 4.40973 19.2844 4.21799 18.9081C4.12796 18.7314 4.07512 18.5322 4.04409 18.2802M18.275 19.9566C18.5293 19.9257 18.7301 19.8728 18.908 19.7821C19.2843 19.5904 19.5903 19.2844 19.782 18.9081C20 18.4803 20 17.9202 20 16.8001V16.4936M12.5 4L7.2 4.00011C6.07989 4.00011 5.51984 4.00011 5.09202 4.21809C4.71569 4.40984 4.40973 4.7158 4.21799 5.09213C4 5.51995 4 6.08 4 7.20011V16.8001C4 17.4576 4 17.9222 4.04409 18.2802M20 11.5V16.4936M14 10.0002L16.0249 9.59516C16.2015 9.55984 16.2898 9.54219 16.3721 9.5099C16.4452 9.48124 16.5146 9.44407 16.579 9.39917C16.6515 9.34859 16.7152 9.28492 16.8425 9.1576L21 5.00015C21.5522 4.44787 21.5522 3.55244 21 3.00015C20.4477 2.44787 19.5522 2.44787 19 3.00015L14.8425 7.1576C14.7152 7.28492 14.6515 7.34859 14.6009 7.42112C14.556 7.4855 14.5189 7.55494 14.4902 7.62801C14.4579 7.71033 14.4403 7.79862 14.4049 7.97518L14 10.0002Z"
                      stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <svg data-kind="location" class="icon searchIcon hidden" viewBox="-2 -2 18 18" fill="none"
                    xmlns="http://www.w3.org/2000/svg" height="18">
                    <path
                      d="m3 5q1-5 6-5t6 5-6 11q-7-6-6-11m6-2a1 1 0 0 0 0 5 1 1 0 0 0 0 -5m-2 11c-1 0-3 1-3 2s2 2 5 2 5-1 5-2-2-2-3-2" />
                  </svg>
                  <svg data-kind="artist" class="icon searchIcon hidden" viewBox="0 0 10 10" fill="none"
                    xmlns="http://www.w3.org/2000/svg" height="12">
                    <path
                      d="m10 4a1 1 90 000 5 1 1 90 000-5M5 17c0-5 1-7 5-7s5 2 5 7q-5 2-10 0" />
                  </svg>
                  <input id="badgeSearch" type="text" autocomplete="off">
                  <div class="dropdown hidden" id="badgeDropdown">
                    <div class="dropdownItem" tabindex="0">
                      <i data-i18n="[html]modal.badges.fields.search.name">Name:</i> <span id="searchName"></span>
                    </div>
                    <div class="dropdownItem" tabindex="0">
                      <i data-i18n="[html]modal.badges.fields.search.location">Location:</i> <span id="searchLocation"></span>
                    </div>
                    <div class="dropdownItem" tabindex="0">
                      <i data-i18n="[html]modal.badges.fields.search.artist">Artist:</i> <span id="searchArtist"></span>
                    </div>
                  </div>
                </div>
                <a id="badgeSearchClearLink" href="javascript:void(0);" class="unselectable hidden">✖</a>
              </div>
            </div>
          </div>
          <div id="badgeGameTabs" class="modalTabsContainer"></div>
          <div id="badgeCategoryTabs" class="subTabs"></div>
          <div class="modalContent itemContainer"></div>
          <div class="modalFooter">
            <button id="badgeGalleryButton" class="unselectable" type="button" data-i18n="[html]modal.badges.manageBadgeGallery">Manage Badge Gallery</button>
            <?php if ($enableBadgeTools): ?>
            <button type="button" onclick="openModal('badgeToolsModal')">Badge Tools</button>
            <?php endif ?>
          </div>
        </div>
        <div id="badgeGalleryModal" class="modal semiWideModal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.badgeGallery.title">Manage Badge Gallery</h1>
            <div id="badgeGalleryInfoContainer" class="modalInfoContainer">
              <label id="badgeGalleryTotalBc">0 Badges</label>
              <label id="badgeGalleryTotalBp">0 BP</label>
            </div>
            <div id="badgeGalleryRowProgressContainer" class="badgeGalleryProgressContainer progressContainer">
              <label id="badgeGalleryRowProgressLabel" class="progressBarHeading" data-i18n="[html]modal.badgeGallery.badgeGalleryRowProgress">Next Row Upgrade (BP)</label>
              <div id="badgeGalleryRowProgressBarContainer" class="progressBarContainer">
                <label id="badgeGalleryRowProgressBarLabel" class="progressBarLabel altText unselectable"></label>
                <div id="badgeGalleryRowProgressBar" class="progressBar"></div>
              </div>
            </div>
            <div id="badgeGalleryColProgressContainer" class="badgeGalleryProgressContainer progressContainer">
              <label id="badgeGalleryColProgressLabel" class="progressBarHeading" data-i18n="[html]modal.badgeGallery.badgeGalleryColProgress">Next Column Upgrade (Badges)</label>
              <div id="badgeGalleryColProgressBarContainer" class="progressBarContainer">
                <label id="badgeGalleryColProgressBarLabel" class="progressBarLabel altText unselectable"></label>
                <div id="badgeGalleryColProgressBar" class="progressBar"></div>
              </div>
            </div>
          </div>
          <div class="modalContent itemContainer itemRowContainer smallItemContainer" dir="ltr"></div>
          <div class="modalFooter">
            <button id="removeBadgesButton" class="unselectable" type="button" data-i18n="[html]modal.badgeGallery.removeMode.activate">Remove Badges</button>
            <button id="badgePresetButton" class="unselectable" type="button" data-i18n="[html]modal.badgeGallery.manageBadgePreset">Manage Presets</button>
          </div>
        </div>
        <div id="badgePresetModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.badgePreset.title">Manage Badge Presets</h1>
            <div class="formControls" style="width:100%">
              <div class="formControlRow">
                <label for="badgePresetSelection" data-i18n="[html]modal.badgePreset.selectPreset">Select Preset</label>
                <select id="badgePresetSelection">
                  <option value="0" data-i18n="[html]modal.badgePreset.presetName" i18n-options="{'index':1}">Preset 1</option>
                  <option value="1" data-i18n="[html]modal.badgePreset.presetName" i18n-options="{'index':2}">Preset 2</option>
                  <option value="2" data-i18n="[html]modal.badgePreset.presetName" i18n-options="{'index':3}">Preset 3</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modalContent"></div>
          <div class="modalFooter">
            <button id="badgePresetSave" class="unselectable" type="button" data-i18n="[html]modal.common.save">Save</button>
            <button id="badgePresetLoad" class="unselectable" type="button" data-i18n="[html]modal.common.apply">Apply</button>
          </div>
        </div>
        <div id="uiThemesModal" class="modal fullscreenModal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.uiTheme.title">UI Theme</h1>
          </div>
          <div class="modalContent itemContainer"></div>
          <div class="modalFooter">
            <div class="uiControl">
              <label for="fontStyle" class="unselectable" data-i18n="[html]fontStyle.label">Font Style:</label>
              <select id="fontStyle" class="fontStyle">
                <option value="0" data-i18n="[html]fontStyle.values.style1">Style 1</option>
                <option value="1" data-i18n="[html]fontStyle.values.style2">Style 2</option>
                <?php if ($gameId !== "muma" && $gameId !== "genie"): ?>
                  <?php if ($gameId !== "someday"): ?>
                    <option value="2" data-i18n="[html]fontStyle.values.style3">Style 3</option>
                  <?php endif ?>
                  <?php if ($gameId !== "deepdreams"): ?>
                    <option value="3" data-i18n="[html]fontStyle.values.style4">Style 4</option>
                  <?php endif ?>
                  <?php if ($gameId == "yume" || $gameId == "2kki" || $gameId == "unconscious" || $gameId == "flow" || $gameId == "mikan"): ?>
                    <option value="4" data-i18n="[html]fontStyle.values.style5">Style 5</option>
                    <?php if ($gameId != "mikan"): ?>
                      <option value="5" data-i18n="[html]fontStyle.values.style6">Style 6</option>
                      <option value="6" data-i18n="[html]fontStyle.values.style7">Style 7</option>
                    <?php endif ?>
                  <?php endif ?>
                <?php endif ?>
              </select>
            </div>
          </div>
        </div>
        <div id="saveModal" class="modal wideModal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle">
              <span data-i18n="[html]modal.save.title">
                Manage Save Data
              </span>
              <a href='javascript:void(0);' class='helpLink iconLink' data-i18n='[title]modal.save.info'> <div class='helpIcon icon fillIcon invertFillIcon altIcon'> <svg viewBox='0 0 18 18'> <path d='m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25' /> </svg> </div> </a>
            </h1>
          </div>
          <div class="modalContent">
            <div id="saveSlotList" class="scrollableContainer">
            </div>
          </div>
          <div class="modalFooter">
            <button id="saveModalReloadButton" class="unselectable hidden" type="button" data-i18n="[html]modal.save.reload">Save Changes and Reload</button>
          </div>
        </div>
        <div id="createPartyModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle">
              <span class="createTitle" data-i18n="[html]modal.createParty.title.create">Create Party</span>
              <span class="updateTitle" data-i18n="[html]modal.createParty.title.update">Update Party</span>
            </h1>
          </div>
          <div class="modalContent">
            <form id="createPartyForm" class="fullWidth">
              <ul class="formControls">
                <li class="formControlRow">
                  <label for="partyName" class="unselectable" data-i18n="[html]modal.createParty.fields.partyName">Party Name</label><input id="partyName" name="name" type="text" autocomplete="off" />
                </li>
                <li class="formControlRow">
                  <div class="textareaContainer">
                    <label for="partyDescription" class="unselectable" data-i18n="[html]modal.createParty.fields.description">Description</label>
                    <textarea id="partyDescription" name="description" class="autoExpand"></textarea>
                  </div>
                </li>
                <li class="formControlRow">
                  <label class="unselectable" data-i18n="[html]modal.createParty.fields.public">Public</label>
                  <div>
                    <button id="publicPartyButton" class="checkboxButton inverseToggle unselectable" type="button"><span></span></button>
                    <input type="checkbox" name="public" style="display: none" checked />
                  </div>
                </li>
                <li class="formControlRow hidden">
                  <div>
                    <a id="showHidePartyPasswordLink" href="javascript:void(0);" class="showHidePasswordLink">
                        <span data-i18n="[html]modal.createParty.showPassword">Show Password</span>
                        <span data-i18n="[html]modal.createParty.hidePassword">Hide Password</span>
                    </a>
                    <div>
                      <label for="partyPassword" class="unselectable" data-i18n="[html]modal.createParty.fields.password">Password</label><input id="partyPassword" name="pass" type="password" autocomplete="off" />
                    </div>
                  </div>
                </li>
                <li class="formControlRow">
                  <label for="partyThemeButton" class="unselectable" data-i18n="[html]modal.createParty.fields.theme">Theme</label>
                  <div>
                    <div id="partyThemeButton" class="uiThemeItem item unselectable"></div>
                    <input id="partyTheme" type="hidden" name="theme" />
                  </div>
                </li>
              </ul>
              <button type="submit" data-i18n="[html]modal.createParty.submit">Submit</button>
            </form>
          </div>
        </div>
        <div id="joinPrivatePartyModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.joinPrivateParty.title">Join Private Party</h1>
          </div>
          <div class="modalContent">
            <form id="joinPrivatePartyForm">
              <ul class="formControls">
                <li class="formControlRow">
                  <div>
                    <a id="showHidePrivatePartyPasswordLink" href="javascript:void(0);" class="showHidePasswordLink">
                        <span data-i18n="[html]modal.joinPrivateParty.showPassword">Show Password</span>
                        <span data-i18n="[html]modal.joinPrivateParty.hidePassword">Hide Password</span>
                    </a>
                    <div>
                      <label for="partyPassword" class="unselectable" data-i18n="[html]modal.joinPrivateParty.fields.password">Password</label><input id="privatePartyPassword" name="pass" type="password" autocomplete="off" />
                    </div>
                  </div>
                </li>
                <li id="joinPrivatePartyFailed" class="formControlRow hidden">
                  <label data-i18n="[html]modal.joinPrivateParty.incorrectPassword">Incorrect Password: Please try again.</label>
                </li>
              </ul>
              <button type="submit" data-i18n="[html]modal.joinPrivateParty.submit">Submit</button>
            </form>
          </div>
        </div>
        <div id="partyModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle"></h1>
          </div>
          <div class="modalContent">
            <div id="partyModalDescriptionContainer">
              <div class="infoIcon icon fillIcon">
                <svg viewBox="0 0 18 18">
                  <path d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0 -18m-2 15.5v-1q1 0 1-1v-4q0-1-1-1v-1h4v6q0 1 1 1v1m-3-9c-1.625 0-2-1.5-2-2s0.375-2 2-2 2 1.5 2 2-0.375 2-2 2" />
                </svg>
              </div>
              <div id="partyModalDescription" class="infoText"></div>
            </div>
            <div id="partyModalPlayerListContainer" class="scrollableContainer">
              <h4 id="partyModalOnlineCount" class="partyModalPlayerCount infoText">Online - 0</h4>
              <div id="partyModalOnlinePlayerList" class="playerList"></div>
              <h4 id="partyModalOfflineCount" class="partyModalPlayerCount infoText">Offline - 0</h4>
              <div id="partyModalOfflinePlayerList" class="playerList"></div>
            </div>
          </div>
        </div>
        <div id="eventsModal" class="modal accountRequired hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.events.title">Expeditions</h1>
          </div>
          <div class="modalContent">
            <div id="expRankInfoContainer" class="modalInfoContainer">
              <label id="totalExp">0 ExP</label>
              <div id="expRankContainer">
                <label id="expRank">Rank: Novice</label>
                <img id="expRankBadge" class="badge" style="display: none" />
              </div>
            </div>
            <div id="rankExpContainer">
              <label id="rankExpLabel" class="progressBarHeading" data-i18n="[html]modal.events.rankExp">Next Rank</label>
              <div id="rankExpBarContainer" class="progressBarContainer">
                <label id="rankExpBarLabel" class="progressBarLabel altText unselectable"></label>
                <div id="rankExpBar" class="progressBar"></div>
              </div>
            </div>
            <div id="eventPeriodInfoContainer">
              <h3 id="eventPeriod">Season 1</h3>
              <label id="eventPeriodEndDateLabel">Ends</label>
            </div>
            <label id="weekExpLabel" class="progressBarHeading" data-i18n="[html]modal.events.weekExp">ExP This Week</label>
            <div id="weekExpBarContainer" class="progressBarContainer">
              <label id="weekExpBarLabel" class="progressBarLabel altText unselectable"></label>
              <div id="weekExpBar" class="progressBar"></div>
            </div>
            <div id="eventTabs" class="subTabs">
              <div id="eventTabLocations" class="eventTab subTab active" data-tab-list="locations">
                <small class="subTabLabel infoLabel unselectable" data-i18n="[html]modal.events.tabs.locations">Locations</small>
                <div class="subTabBg"></div>
              </div>
              <div id="eventTabVms" class="eventTab subTab" data-tab-list="vms">
                <small class="subTabLabel infoLabel unselectable" data-i18n="[html]modal.events.tabs.vms">Vending Machine</small>
                <div class="subTabBg"></div>
              </div>
            </div>
            <div id="eventLocationsList" class="eventList scrollableContainer"></div>
            <div id="eventVmsList" class="eventList scrollableContainer hidden"></div>
          </div>
        </div>
        <div id="rankingsModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.rankings.title">Rankings</h1>
          </div>
          <div class="modalContent">
            <div id="rankingCategoryTabs" class="modalTabsContainer"></div>
            <div id="rankingSubCategoryTabs" class="subTabs"></div>
            <table id="rankingsTable">
              <thead>
                <tr>
                  <th>#</th>
                  <th data-i18n="[html]modal.rankings.player">Player</th>
                  <th id="rankingValueHeader"></th>
                </tr>
              </thead>
              <tbody id="rankings"></tbody>
            </table>
            <div id="rankingsPagination"></div>
          </div>
        </div>
        <div id="locationsModal" class="modal fullscreenModal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.locations.title">Locations</h1>
            <div id="locationsControls" class="uiControls wrap">
              <div class="uiControl">
                <span></span>
                <select id="locationsVisited">
                  <option value="" data-i18n="[html]modal.locations.fields.visited.values.all">All</option>
                  <option value="visited" data-i18n="[html]modal.locations.fields.visited.values.visited">Visited</option>
                  <option value="unvisted" data-i18n="[html]modal.locations.fields.visited.values.unvisited">Unvisited</option>
                </select>
              </div>
              <div class="uiControl">
                <span></span>
                <select id="locationsSortOrder">
                  <option value="newest" data-i18n="[html]modal.locations.fields.sortOrder.values.newest">Newest</option>
                  <option value="oldest" data-i18n="[html]modal.locations.fields.sortOrder.values.oldest">Oldest</option>
                  <option value="shallowest" data-i18n="[html]modal.locations.fields.sortOrder.values.shallowest">Shallowest</option>
                  <option value="deepest" data-i18n="[html]modal.locations.fields.sortOrder.values.deepest">Deepest</option>
                  <option value="alpha" data-i18n="[html]modal.locations.fields.sortOrder.values.alpha">Alphabetical</option>
                  <option value="players" data-i18n="[html]modal.locations.fields.sortOrder.values.players">Player Count</option>
                </select>
              </div>
            </div>
            <div class="infiniteScrollRefreshIndicator transparent unselectable">
              <label class="infoLabel" data-i18n="[html]modal.locations.scrollToRefresh">Scroll to Top to Refresh</label>
            </div>
          </div>
          <div class="modalContent infiniteScrollContainer itemContainer">
          </div>
        </div>
        <div id="screenshotModal" class="modal fullscreenModal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.screenshot.title">Your Screenshot</h1>
            <h1 class="playerScreenshotModalTitle hidden"></h1>
          </div>
          <div class="modalContent noScroll"></div>
          <div class="modalFooter">
            <button class="downloadScreenshotButton unselectable" type="button" data-i18n="[html]modal.screenshot.download">Download</button>
            <button class="saveScreenshotButton unselectable" type="button" data-i18n="[html]modal.screenshot.save">Save to My Screenshots</button>
            <button class="shareScreenshotButton unselectable" type="button" data-i18n="[html]modal.screenshot.share">Share Screenshot in Chat</button>
          </div>
        </div>
        <div id="myScreenshotsModal" class="modal fullscreenModal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.myScreenshots.title">My Screenshots</h1>
            <h3 id="myScreenshotsLimitLabel"></h3>
            <div id="screenshotSlotProgressContainer" class="screenshotSlotProgressContainer progressContainer">
              <label id="screenshotSlotProgressLabel" class="progressBarHeading" data-i18n="[html]modal.myScreenshots.screenshotSlotProgress">Next Slot Upgrade (BP)</label>
              <div id="screenshotSlotProgressBarContainer" class="progressBarContainer">
                <label id="screenshotSlotProgressBarLabel" class="progressBarLabel altText unselectable"></label>
                <div id="screenshotSlotProgressBar" class="progressBar"></div>
              </div>
            </div>
            <span id="myScreenshotsEmptyLabel" class="infoLabel hidden" data-i18n="[html]modal.myScreenshots.empty">You haven't saved any screenshots yet.</span>
          </div>
          <div class="modalContent itemContainer">
          </div>
        </div>
        <div id="communityScreenshotsModal" class="modal fullscreenModal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.communityScreenshots.title">Community Screenshots</h1>
            <div id="communityScreenshotsControls" class="uiControls wrap">
              <div class="uiControl">
                <label for="communityScreenshotsGame" class="unselectable" data-i18n="[html]modal.communityScreenshots.fields.game.label">Game:&nbsp;</label>
                <select id="communityScreenshotsGame" class="gameSelect">
                  <option value="" data-i18n="[html]modal.communityScreenshots.fields.game.values.all">All</option>
                </select>
              </div>
              <div class="uiControl">
                <span></span>
                <select id="communityScreenshotsSortOrder">
                  <option value="recent" data-i18n="[html]modal.communityScreenshots.fields.sortOrder.values.recent">Newest</option>
                  <option value="likes" data-i18n="[html]modal.communityScreenshots.fields.sortOrder.values.likes">Most Liked</option>
                </select>
              </div>
              <div class="uiControl">
                <span></span>
                <select id="communityScreenshotsInterval">
                  <option value="day" data-i18n="[html]modal.communityScreenshots.fields.interval.values.day">Today</option>
                  <option value="week" data-i18n="[html]modal.communityScreenshots.fields.interval.values.week">This Week</option>
                  <option value="month" data-i18n="[html]modal.communityScreenshots.fields.interval.values.month">This Month</option>
                  <option value="year" data-i18n="[html]modal.communityScreenshots.fields.interval.values.year">This Year</option>
                  <option value="" data-i18n="[html]modal.communityScreenshots.fields.interval.values.all">All Time</option>
                </select>
              </div>
            </div>
            <div class="infiniteScrollRefreshIndicator transparent unselectable">
              <label class="infoLabel" data-i18n="[html]modal.communityScreenshots.scrollToRefresh">Scroll to Top to Refresh</label>
            </div>
          </div>
          <div class="modalContent infiniteScrollContainer itemContainer">
          </div>
        </div>
        <div id="wikiModal" class="modal fullscreenModal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalContent noScroll">
            <iframe id="wikiFrame" class="unselectable"></iframe>
          </div>
        </div>
        <div id="rulesModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.rules.title">Rules</h1>
          </div>
          <div class="modalContent">
            <ul>
              <li><span data-i18n="[html]modal.rules.rule1">Please be respectful and polite.</span></li>
              <li><span data-i18n="[html]modal.rules.rule2">No 18+ discussion (NSFW, gore, etc.).</span></li>
              <li><span data-i18n="[html]modal.rules.rule3">No politics.</span></li>
              <li><span data-i18n="[html]modal.rules.rule4">No inflammatory remarks (including slurs).</span></li>
              <li><span data-i18n="[html]modal.rules.rule5">No cheating of any kind for any reason.</span></li>
              <li><span data-i18n="[html]modal.rules.rule6">If there's trouble, please inform the moderators.</span></li>
            </ul>
          </div>
        </div>
        <?php if ($gameId == "2kki"): ?>
        <div id="explorerUndiscoveredLocationsModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.explorerUndiscoveredLocations.title">Undiscovered Locations</h1>
          </div>
          <div class="modalContent">
            <ul id="explorerUndiscoveredLocations"></ul>
            <span id="explorerUndiscoveredLocationsEmptyLabel" class="infoLabel hidden" data-i18n="[html]modal.explorerUndiscoveredLocations.complete">You've discovered every available location! Congrats!!</span>
          </div>
        </div>
        <?php endif ?>
        <div id="modSettingsModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle">Moderator Settings</h1>
          </div>
          <div class="modalContent">
            <ul class="formControls"></ul>
          </div>
        </div>
        <div id="schedulesModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.schedule.title">Events</h1>
          </div>
          <div class="modalContent">
            <div style="width:100%">
              <div class="messageContainer themeText scheduleGroupHeader" data-i18n="[html]modal.schedule.official">Official Events</div>
              <div id="officialSchedules" class="scheduleContainer"></div>
            </div>
            <div style="width:100%">
              <div class="messageContainer themeText scheduleGroupHeader" data-i18n="[html]modal.schedule.ongoing">Ongoing Events</div>
              <div id="ongoingSchedules" class="scheduleContainer"></div>
            </div>
            <div style="width:100%">
              <div class="messageContainer themeText scheduleGroupHeader" data-i18n="[html]modal.schedule.party">Party Events</div>
              <div id="partySchedules" class="scheduleContainer"></div>
            </div>
            <div style="width:100%">
              <div class="messageContainer themeText scheduleGroupHeader" data-i18n="[html]modal.schedule.future">Future Events</div>
              <div id="futureSchedules" class="scheduleContainer"></div>
            </div>
            <div id="emptySchedules" class="hidden" data-i18n="[html]modal.schedule.noResults">
              No events have been scheduled.
            </div>
          </div>
          <template id="scheduleTemplate">
            <div class="listEntry schedule">
              <div class="listEntryMain">
                <strong class="nameMarker eventName" data-role="name">
                  <svg width="16" height="16" class="icon fillIcon hidden" data-role="partyIcon">
                    <path d="m9 4a1 1 90 0 0 0 5 1 1 90 0 0 0 -5m-4 13c0-5 1-7 4-7s4 2 4 7q-4 2-8 0m0-17a1 1 90 0 0 0 5 1 1 90 0 0 0 -5m-4 13c0-5 1-7 4-7 0.375 0 0.5 0 1.25 0.125-0.25 1.625 1.25 3.125 2.5 3.125q0.125 0.25 0.125 0.5c-1.75 0-3.625 1-3.875 4.125q-2.375 0-4-0.875m12-13a1 1 90 0 1 0 5 1 1 90 0 1 0 -5m4 13c0-5-1-7-4-7-0.375 0-0.5 0-1.25 0.125 0.25 1.625-1.25 3.125-2.5 3.125q-0.125 0.25-0.125 0.5c1.75 0 3.625 1 3.875 4.125q2.375 0 4-0.875"></path>
                  </svg>
                </strong>
                <div class="themeText scheduleHeader">
                  <button data-role="edit" class="icon iconButton fillIcon unselectable hidden toggleButton offToggleButton" style="padding-inline-end: 12px;">
                    <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="m12.25 3h-8.25q-2 0-2 2v10q0 2 2 2h10q2 0 2-2v-7.75l-2 2.25v3.5c0 2 0 2-2 2h-6c-2 0-2 0-2-2v-6c0-2 0-2 2-2h4.5l1.75-2m3.75-2l-7 8-1 3 3-1 7-8q0-2-2-2m-0.875 1l2 2-0.8125 0.9375-2-2m-5.3125 6.0625l2 2m-2.75 0.25l0.5 0.5" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                      <path d="m-2 16l22-14"></path>
                    </svg>
                  </button>
                  <div data-role="cancel" class="deleteIcon icon iconButton hidden" style="padding-inline-end: 12px">
                    <svg viewBox="0 0 18 18" width="24" height="24"><path d="m3.5 2h11q2 0 2 3h-15q0-3 2-3m4-2h2q2 0 2 2h-5q0-2 2-2m-5.5 5 1 13h10l1-13m-8.5 11-0.5-9m3 9v-9m2.5 9 0.5-9"></path></svg>
                  </div>
                  <div class="likeContainer" style=" display: flex; align-items: center;">
                    <div class="likeIcon icon iconButton toggleButton altToggleButton" data-role="follow">
                      <svg viewBox="0 0 18 18" width="24" height="24">
                        <path
                          d="m16.65 2c-1.875-2.025-4.875-1.95-6.825 0.075l-0.825 0.975-0.825-0.975c-1.95-2.025-4.95-2.1-6.75-0.075h-0.075c-1.8 1.95-1.8 5.25 0.15 7.275l4.05 4.425 3.45 3.675 3.3-3.6 4.2-4.5c1.95-2.025 1.95-5.325 0.15-7.275z">
                        </path>
                      </svg>
                    </div>
                    <span class="infoLabel likeCount unselectable" data-role="followerCount" style=" margin-inline-start: 8px; font-size: 1.2em; "></span>
                  </div>
                </div>
              </div>

              <div class="scheduleDescription">
                <span class="themeText" data-role="description">
                </span>
              </div>

              <div style="padding-bottom: 4px; font-size: 0.9em;" data-role="links">
              </div>

              <div style="justify-content: space-between; width: 100%; font-size: 0.9em;" class="listEntryMain themeText">
                <div data-role="organizer" style="display:inline-flex; white-space:nowrap"></div>
                <div data-role="datetime" class="scheduleDatetime">
                </div>
              </div>
            </div>
          </template>
          <div class="modalFooter">
            <button id="createSchedule" type="button" class="unselectable" onclick="openScheduleEditModal()" data-i18n="[html]modal.schedule.doSchedule">Schedule an Event</button>
          </div>
        </div>
        <div id="scheduleEditModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.scheduleEdit.title">Edit Event</h1>
          </div>
          <div class="modalContent">
            <ul class="formControls" style="width:100%">
              <form id="scheduleForm" action="javascript:void(0)">
                <li class="formControlRow fullWidth">
                  <div class="textareaContainer">
                    <label for="name" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.name">Event Name</label>
                    <input type="text" name="name" class="autoExpand" maxlength="255" required>
                  </div>
                </li>
                <li class="formControlRow fullWidth">
                  <div class="textareaContainer">
                    <label for="description" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.description">Description</label>
                    <textarea id="editScheduleDescription" data-ynomoji="expandDown" name="description" type="text" class="autoExpand" maxlength="1000" data-i18n="[placeholder]placeholders.scheduleDescription" placeholder="Markdown syntax is accepted, use {{l:World,optional link name}} to insert a link to yume.wiki"></textarea>
                  </div>
                </li>
                <li class="formControlRow">
                  <label for="datetime" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.datetime">Event Date and Time</label>
                  <div>
                    <input name="datetime" type="datetime-local" name="eventStart" required>
                  </div>
                </li>
                <li class="formControlRow">
                  <label class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.recurring">Recurring Event</label>
                  <div>
                    <button id="eventRecurring" class="checkboxButton unselectable" type="button">
                      <span></span>
                    </button>
                  </div>
                </li>
                <li id="eventInterval" class="formControlRow indent">
                  <label for="interval" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.interval.title">Interval</label>
                  <div>
                    <input name="interval" type="number" min="1" value="1">
                    <select name="intervalType">
                      <option value="days" data-i18n="[html]modal.scheduleEdit.fields.interval.days">days</option>
                      <option value="months" data-i18n="[html]modal.scheduleEdit.fields.interval.months">months</option>
                      <option value="years" data-i18n="[html]modal.scheduleEdit.fields.interval.years">years</option>
                    </select>
                  </div>
                </li>
                <li id="restrictPartyRow" class="formControlRow">
                  <label class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.restrictParty">Limit to Party</label>
                  <div>
                    <button id="restrictParty" class="checkboxButton unselectable" type="button">
                      <span></span>
                    </button>
                  </div>
                </li>
                <li id="eventOfficialRow" class="formControlRow hidden">
                  <label class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.official">Official Event</label>
                  <div>
                    <button id="eventOfficial" class="checkboxButton unselectable" type="button">
                      <span></span>
                    </button>
                  </div>
                </li>
                <li id="resetOrganizerRow" class="formControlRow hidden">
                  <label class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.resetOrganizer">Reset Organizer</label>
                  <div>
                    <button id="resetOrganizer" class="checkboxButton unselectable" type="button">
                      <span></span>
                    </button>
                  </div>
                </li>
                <li class="formControlRow">
                  <label for="scheduleThemeButton" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.theme">Theme</label>
                  <div>
                    <div id="scheduleThemeButton" class="uiThemeItem item unselectable"></div>
                    <input id="scheduleTheme" type="hidden" name="theme" />
                  </div>
                </li>
                <li class="formControlRow">
                  <label class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.title">External Links</label>
                </li>
                <li class="formControlRow indent">
                  <label for="discord" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.discord">Discord</label>
                  <div>
                    <input name="discord" type="text" data-platform>
                  </div>
                </li>
                <li class="formControlRow indent">
                  <label for="youtube" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.youtube">YouTube</label>
                  <div>
                    <input name="youtube" type="text" data-platform>
                  </div>
                </li>
                <li class="formControlRow indent">
                  <label for="twitch" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.twitch">Twitch</label>
                  <div>
                    <input name="twitch" type="text" data-platform>
                  </div>
                </li>
                <li class="formControlRow indent">
                  <label for="niconico" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.niconico">Nicovideo</label>
                  <div>
                    <input name="niconico" type="text" data-platform>
                  </div>
                </li>
                <li class="formControlRow indent">
                  <label for="openrec" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.openrec">Openrec</label>
                  <div>
                    <input name="openrec" type="text" data-platform>
                  </div>
                </li>
                <li class="formControlRow indent">
                  <label for="bilibili" class="unselectable" data-i18n="[html]modal.scheduleEdit.fields.platforms.bilibili">Bilibili</label>
                  <div>
                    <input name="bilibili" type="text" data-platform>
                  </div>
                </li>
                <li class="formControlRow buttonRow fullWidth">
                  <button type="submit" data-i18n="[html]modal.scheduleEdit.save">Save</button>
                  <button type="button" id="cancelSchedule" data-i18n="[html]modal.scheduleEdit.cancel">Cancel Event</button>
                </li>
              </form>
            </ul>
          </div>
        </div>
        <div id="reportModal" class="modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle" data-i18n="[html]modal.report.title">Report</h1>
          </div>
          <div class="modalContent">
            <ul class="formControls" style="width:100%">
              <form id="reportForm" action="javascript:void(0);">
                <li class="formControlRow">
                  <label for="reason" class="unselectable" data-i18n="[html]modal.report.fields.reason.title">Reason</label>
                  <div>
                    <select id="reportReasonSelect" value=":1" name="reason">
                      <option value=":1" data-i18n="[html]modal.report.fields.reason.1">Slurs, harmful or inappropriate language</option>
                      <option value=":2" data-i18n="[html]modal.report.fields.reason.2">Harassment, bullying, stalking</option>
                      <option value=":3" data-i18n="[html]modal.report.fields.reason.3">Inappropriate names</option>
                      <option value=":4" data-i18n="[html]modal.report.fields.reason.4">Ban evasion</option>
                      <option value=":5" data-i18n="[html]modal.report.fields.reason.5">Cheating, abusing exploits</option>
                      <option value=":6" data-i18n="[html]modal.report.fields.reason.6">Underage player</option>
                      <option value=":7" data-i18n="[html]modal.report.fields.reason.7">Spam</option>
                      <option value="" data-i18n="[html]modal.report.fields.reason.other">Other (specify)</option>
                    </select>
                  </div>
                </li>
                <li id="reportCustomReason" class="formControlRow fullWidth hidden">
                  <div class="textareaContainer">
                    <input type="text" name="customReason" class="autoExpand" maxlength="50" placeholder="Custom reason (max 50 characters)" data-i18n="[placeholder]modal.report.fields.reason.placeholder">
                  </div>
                </li>
                <li class="formControlRow buttonRow fullWidth">
                  <button type="submit" data-i18n="[html]modal.report.submit">Submit</button>
                </li>
              </form>
            </ul>
          </div>
        </div>
        <?php if ($enableBadgeTools): ?>
        <div id="badgeToolsModal" class="modal wideModal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalHeader">
            <h1 class="modalTitle">
              <span>Badge Tools</span>
            </h1>
          </div>
          <div class="modalContent">
            <form id="badgeToolsForm" enctype="multipart/form-data" method="post" class="fullWidth" @submit="validateForm">
              <h3>Badge</h3>
              <div class="modalTabsContainer">
                <template :key="b" v-for="(badge, b) in badges">
                  <div class="modalTab" v-if="!badge.deleted" :class="{ active: b === badgeIndex }" @click="badgeIndex = b">
                    <label class="modalTabLabel">{{badge.badgeId}} ({{badge.gameName}})</label>
                  </div>
                </template>
                <div class="modalTab" @click="addBadge()"><label class="modalTabLabel">+</label></div>
              </div>
              <template :key="b" v-for="(badge, b) in badges">
                <badge v-if="!badge.deleted" v-show="badge.index === badgeIndex" :index="b" />
              </template>
              <button type="button" @click="exportZip()">Export</button>
            </form>
          </div>
        </div>
        <template id="badgeTemplate">
          <div>
            <ul class="formControls flexFormControls">
              <li class="formControlRow fullWidth">
                <label class="unselectable">Badge ID</label><input v-model="badgeId" type="text" autocomplete="off" />
              </li>
              <li class="formControlRow">
                <label class="unselectable">Game</label>
                <select v-model="gameId">
                  <option :key="gameOption.key" :value="gameOption.key" v-for="gameOption in gameOptions">{{gameOption.label}}</option>
                </select>
              </li>
              <li class="formControlRow" v-if="groupOptions.length">
                <label class="unselectable">Group</label>
                <select v-model="group">
                  <option :key="groupOption.key" :value="groupOption.key" v-for="groupOption in groupOptions">{{groupOption.label}}</option>
                </select>
              </li>
              <li class="formControlRow">
                <label class="unselectable">Order</label>
                <input v-model="order" type="number" min="0" max="9999" autocomplete="off" />
              </li>
              <li class="formControlRow">
                <label class="unselectable">Map Order</label>
                <input v-model="mapOrder" type="number" min="0" max="9999" autocomplete="off" />
              </li>
              <li class="formControlRow">
                <label class="unselectable">Badge Name</label><input v-model="name" type="text" autocomplete="off" />
              </li>
              <li class="formControlRow fullWidth">
                <div class="textareaContainer">
                  <label class="unselectable">Description</label>
                  <textarea v-model="description" class="autoExpand"></textarea>
                </div>
              </li>
              <li class="formControlRow fullWidth">
                <div class="textareaContainer">
                  <label class="unselectable">Condition</label>
                  <textarea v-model="condition" class="autoExpand"></textarea>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable">Artist</label><input v-model="art" type="text" autocomplete="off" />
              </li>
              <li class="formControlRow">
                <label class="unselectable">Animated</label>
                <div>
                  <button class="checkboxButton unselectable" :class="{ toggled: animated }" type="button" @click="animated = !animated"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable">BP</label>
                <select v-model="bp">
                  <option :key="i" v-for="i in 11">{{(i - 1) * 5}}</option>
                </select>
              </li>
              <li class="formControlRow fullWidth">
                <label class="unselectable">Requirement Type</label>
                <select id="badgeGroup" v-model="reqType">
                  <option value="">None (Mod Granted)</option>
                  <option value="tag">Tag</option>
                  <option value="tags">Multiple Tags</option>
                  <option value="tagArrays">Multiple Tags with Alternatives</option>
                  <option value="timeTrial">Time Trial</option>
                </select>
              </li>
              <li class="formControlRow" v-if="reqType === 'timeTrial'">
                <label class="unselectable">Required Int</label>
                <input v-model="reqInt" type="number" min="0" max="99999" autocomplete="off" />
              </li>
              <li class="formControlRow fullWidth" v-if="reqType === 'tags' || reqType === 'tagArrays'">
                <label class="unselectable">Tag Requirement Count</label>
                <input v-model="reqCount" v-if="reqType === 'tags'" type="number" min="0" :max="reqStrings.length" autocomplete="off" />
                <input v-model="reqCount" v-if="reqType === 'tagArrays'" type="number" min="0" :max="reqStringArrays.length" autocomplete="off" />
              </li>
              <li class="formControlRow fullWidth">
                <label class="unselectable">Map ID</label>
                <input v-model="map" type="number" min="0" max="9999" autocomplete="off" />
              </li>
              <li class="formControlRow">
                <label class="unselectable">Secret</label>
                <div>
                  <button class="checkboxButton unselectable" :class="{ toggled: secret }" type="button" @click="secret = !secret"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable">Secret Map</label>
                <div>
                  <button class="checkboxButton unselectable" :class="{ toggled: secretMap }" type="button" @click="secretMap = !secretMap"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable">Secret Condition</label>
                <div>
                  <button class="checkboxButton unselectable" :class="{ toggled: secretCondition }" type="button" @click="secretCondition = !secretCondition"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable">Hidden</label>
                <div>
                  <button class="checkboxButton unselectable" :class="{ toggled: hidden }" type="button" @click="hidden = !hidden"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <label class="unselectable">Parent Badge ID</label><input v-model="parent" type="text" autocomplete="off" />
              </li>
              <li class="formControlRow fullWidth">
                <label class="unselectable">Overlay</label>
                <div>
                  <button class="checkboxButton unselectable" :class="{ toggled: overlay }" type="button" @click="overlay = !overlay"><span></span></button>
                </div>
              </li>
              <template v-if="overlay">
                <li class="formControlRow">
                  <label class="unselectable">Gradient</label>
                  <div>
                    <button class="checkboxButton unselectable" :class="{ toggled: overlayTypeGradient }" type="button" @click="overlayTypeGradient = !overlayTypeGradient"><span></span></button>
                  </div>
                </li>
                <li class="formControlRow">
                  <label class="unselectable">Multiply</label>
                  <div>
                    <button class="checkboxButton unselectable" :class="{ toggled: overlayTypeMultiply }" type="button" @click="overlayTypeMultiply = !overlayTypeMultiply"><span></span></button>
                  </div>
                </li>
                <li class="formControlRow">
                  <label class="unselectable">Mask</label>
                  <div>
                    <button class="checkboxButton unselectable" :class="{ toggled: overlayTypeMask }" type="button" @click="overlayTypeMask = !overlayTypeMask"><span></span></button>
                  </div>
                </li>
                <li class="formControlRow">
                  <label class="unselectable">Dual</label>
                  <div>
                    <button class="checkboxButton unselectable" :class="{ toggled: overlayTypeDual }" type="button" @click="overlayTypeDual = !overlayTypeDual"><span></span></button>
                  </div>
                </li>
                <li class="formControlRow">
                  <label class="unselectable">Location</label>
                  <div>
                    <button class="checkboxButton unselectable" :class="{ toggled: overlayTypeLocation }" type="button" @click="overlayTypeLocation = !overlayTypeLocation"><span></span></button>
                  </div>
                </li>
              </template>
              <li class="formControlRow">
                <label class="unselectable">Batch</label><input v-model="batch" type="number" min="0" autocomplete="off" />
              </li>
              <li class="formControlRow">
                <label class="unselectable">Dev</label>
                <div>
                  <button class="checkboxButton unselectable" :class="{ toggled: dev }" type="button" @click="dev = !dev"><span></span></button>
                </div>
              </li>
              <li class="formControlRow">
                <button type="button" @click="deleteBadge()">Delete</button>
              </li>
            </ul>
            <h3>Tag</h3>
            <div class="modalTabsContainer" v-if="reqType === 'tags' || reqType === 'tagArrays'">
              <template :key="t" v-for="(tag, t) in tags">
                <div class="modalTab" v-if="!tag.deleted && tag.siblingIndex < 0" :class="{ active: t === tagIndex }" @click="tagIndex = t">
                  <label class="modalTabLabel">{{displayTag(tag)}}</label>
                </div>
              </template>
              <div class="modalTab" @click="addTag();"><label class="modalTabLabel">+</label></div>
            </div>
            <div class="subTabs badgeTagTabs" v-if="reqType === 'tagArrays' && currentTag">
              <div v-show="currentTag.siblings?.length" class="subTab" :class="{ active: currentTag.index === tagIndex }" @click="tagIndex = currentTag.index">
                <small class="subTabLabel infoLabel unselectable">{{currentTag.tagId}}</small>
                <div class="subTabBg"></div>
              </div>
              <template :key="`subtab-${t}`" v-for="(sibling, t) in tags">
                <div v-if="!sibling.deleted && sibling.siblingIndex === currentTag.index" class="subTab" :class="{ active: t === tagIndex }" @click="tagIndex = t">
                  <small class="subTabLabel infoLabel unselectable">{{sibling.tagId || '&lt;unnamed>'}}</small>
                  <div class="subTabBg"></div>
                </div>
              </template>
              <div class="subTab" @click="addTag(currentTag.index);">
                <small class="subTabLabel unselectable">+</small>
                <div class="subTabBg"></div>
              </div>
            </div>
            <template v-for="(tag, t) in tags" :key="t">
              <tag v-if="!tag?.deleted" v-show="t === tagIndex" :index="t"></tag>
            </template>
          </div>
        </template>
        <template id="tagTemplate">
          <ul class="formControls flexFormControls">
            <li class="formControlRow fullWidth">
              <label class="unselectable">Tag ID</label><input v-model="tagId" type="text" autocomplete="off" />
            </li>
            <li class="formControlRow fullWidth" v-if="$parent.reqType === 'tags' || $parent.reqType === 'tagArrays'">
              <div class="textareaContainer">
                <label class="unselectable">Subcondition (for multi-tag badges)</label>
                <textarea v-model="description" class="autoExpand" :placeholder="$parent.currentTag.description"></textarea>
              </div>

            </li>
            <li class="formControlRow">
              <label class="unselectable">Map ID</label>
              <input v-model="map" type="number" min="0" max="9999" autocomplete="off" />
            </li>
            <template v-if="trigger !== 'teleport' && trigger !== 'coords'">
              <li class="formControlRow" :class="{ fullWidth: mapCoords }">
                <label class="unselectable">Map Coords</label>
                <div>
                  <button class="checkboxButton unselectable" :class="{ toggled: mapCoords }" type="button" @click="mapCoords = !mapCoords"><span></span></button>
                </div>
              </li>
              <template v-if="mapCoords">
                <li class="formControlRow">
                  <label class="unselectable">Map X1</label>
                  <input v-model="mapX1" type="number" min="0" max="9999" autocomplete="off" />
                </li>
                <li class="formControlRow">
                  <label class="unselectable">Map Y1</label>
                  <input v-model="mapY1" type="number" min="0" max="9999" autocomplete="off" />
                </li>
                <li class="formControlRow">
                  <label class="unselectable">Map X2</label>
                  <input v-model="mapX2" type="number" min="0" max="9999" autocomplete="off" />
                </li>
                <li class="formControlRow">
                  <label class="unselectable">Map Y2</label>
                  <input v-model="mapY2" type="number" min="0" max="9999" autocomplete="off" />
                </li>
              </template>
            </template>
            <li class="formControlRow fullWidth">
              <label class="unselectable">Switch Condition</label>
              <select v-model="switchMode">
                <option :key="switchModeOption.key" :value="switchModeOption.key" v-for="switchModeOption in switchModeOptions">{{switchModeOption.label}}</option>
              </select>
            </li>
            <template v-if="switchMode">
              <li class="formControlRow" v-if="switchMode === 'switch'">
                <label class="unselectable">Switch</label>
                <div>
                  <label class="unselectable">ID</label>
                  <input v-model="switchId" type="number" min="0" max="99999" autocomplete="off" />
                </div>
                <label class="unselectable">Value</label>
                <div>
                  <button class="checkboxButton unselectable" :class="{ toggled: switchValue }" type="button" @click="switchValue = !switchValue"><span></span></button>
                </div>
              </li>
              <template v-else-if="switchMode === 'switches'">
                <li class="formControlRow fullWidth" v-for="(switchId, s) in switchIds">
                  <label class="unselectable">Switch {{s + 1}}</label>
                  <div>
                    <label class="unselectable">ID</label>
                    <input v-model="switchIds[s]" type="text" autocomplete="off" />
                  </div>
                  <label class="unselectable">Value</label>
                  <div>
                    <button class="checkboxButton unselectable" :class="{ toggled: switchValues[s] }" type="button" @click="switchValues[s] = !switchValues[s]"><span></span></button>
                  </div>
                </li>
                <li class="formControlRow fullWidth">
                  <span></span>
                  <button type="button" @click="addSwitch()">+</button>
                </li>
              </template>
              <li class="formControlRow">
                <label class="unselectable">Switch Delay</label>
                <div>
                  <button class="checkboxButton unselectable" :class="{ toggled: switchDelay }" type="button" @click="switchDelay = !switchDelay"><span></span></button>
                </div>
              </li>
            </template>
            <li class="formControlRow fullWidth">
              <label class="unselectable">Variable Condition</label>
              <select v-model="varMode">
                <option :key="varModeOption.key" :value="varModeOption.key" v-for="varModeOption in varModeOptions">{{varModeOption.label}}</option>
              </select>
            </li>
            <template v-if="varMode">
              <li class="formControlRow" v-if="varMode === 'var'">
                <label class="unselectable">Variable</label>
                <div>
                  <label class="unselectable">ID</label>
                  <input v-model="varId" type="number" min="0" max="99999" autocomplete="off" />
                </div>
                <div>
                  <label class="unselectable">Op</label>
                  <select v-model="varOp">
                    <option :key="varOp" v-for="varOp in varOpOptions">{{varOp}}</option>
                  </select>
                </div>
                <div>
                  <label class="unselectable">Value</label>
                  <input v-model="varValue" type="number" min="0" max="99999" autocomplete="off" />
                </div>
                <div v-if="varOp === '>=<'">
                  <label class="unselectable">Value 2</label>
                  <input v-model="varValue2" type="number" min="0" max="99999" autocomplete="off" />
                </div>
              </li>
              <template v-else-if="varMode === 'vars'">
                <li class="formControlRow fullWidth" v-for="(varId, v) in varIds">
                  <label class="unselectable">Variable {{v + 1}}</label>
                  <div>
                    <label class="unselectable">ID</label>
                    <input v-model="varIds[v]" type="number" min="0" max="99999" autocomplete="off" />
                  </div>
                  <div>
                    <label class="unselectable">Op</label>
                    <select v-model="varOps[v]">
                      <option :key="v" v-for="varOp in varOpOptions">{{varOp}}</option>
                    </select>
                  </div>
                  <div>
                    <label class="unselectable">Value</label>
                    <input v-model="varValues[v]" type="number" min="0" max="99999" autocomplete="off" />
                  </div>
                </li>
                <li class="formControlRow fullWidth">
                  <span></span>
                  <button type="button" @click="addVar()">+</button>
                </li>
              </template>
              <li class="formControlRow">
                <label class="unselectable">Variable Delay</label>
                <div>
                  <button class="checkboxButton unselectable" :class="{ toggled: varDelay }" type="button" @click="varDelay = !varDelay"><span></span></button>
                </div>
              </li>
              <li class="formControlRow" v-if="switchMode">
                <label class="unselectable">Variable Trigger</label>
                <div>
                  <button class="checkboxButton unselectable" :class="{ toggled: varTrigger }" type="button" @click="varTrigger = !varTrigger"><span></span></button>
                </div>
              </li>
            </template>
            <li class="formControlRow" :class="{ fullWidth: trigger === 'teleport' || trigger === 'coords' }">
              <label class="unselectable">Trigger</label>
              <select v-model="trigger">
                <option :key="triggerOption.key" :value="triggerOption.key" v-for="triggerOption in triggerOptions">{{triggerOption.label}}</option>
              </select>
            </li>
            <li class="formControlRow" v-if="hasTriggerValue">
              <label class="unselectable">{{triggerValueName}}</label>
              <input v-model="value" type="text" autocomplete="off" />
            </li>
            <template v-else-if="hasTriggerValueList">
              <li class="formControlRow fullWidth" v-for="(value, v) in values">
                <label class="unselectable">{{triggerValueName}} #{{v + 1}}</label>
                <input v-model="values[v]" type="text" autocomplete="off">
              </li>
              <li class="formControlRow fullWidth">
                <span></span>
                <button type="button" @click="addValue()">+</button>
              </li>
            </template>

            <template v-if="trigger === 'teleport' || trigger === 'coords'">
              <li class="formControlRow">
                <label class="unselectable">Map X1</label>
                <input v-model="mapX1" type="number" min="0" max="9999" autocomplete="off" />
              </li>
              <li class="formControlRow">
                <label class="unselectable">Map Y1</label>
                <input v-model="mapY1" type="number" min="0" max="9999" autocomplete="off" />
              </li>
              <li class="formControlRow">
                <label class="unselectable">Map X2</label>
                <input v-model="mapX2" type="number" min="0" max="9999" autocomplete="off" />
              </li>
              <li class="formControlRow">
                <label class="unselectable">Map Y2</label>
                <input v-model="mapY2" type="number" min="0" max="9999" autocomplete="off" />
              </li>
            </template>
            <li class="formControlRow">
              <label class="unselectable">Time Trial</label>
              <div>
                <button class="checkboxButton unselectable" :class="{ toggled: timeTrial }" type="button" @click="timeTrial = !timeTrial"><span></span></button>
              </div>
            </li>
            <li class="formControlRow">
              <button type="button" @click="deleteTag()">Delete</button>
            </li>
          </ul>
        </template>
        <?php endif ?>
        <div class="modalOverlay"></div>
      </div>
      <div id="modalFadeOutContainer" class="modalContainer"></div>
      <div id="confirmModalContainer" class="confirmModalContainer modalContainer hidden">
        <div id="confirmModal" class="confirmModal modal hidden">
          <a href="javascript:void(0);" class="modalClose">✖</a>
          <div class="modalContent">
            <div>
              <label class="confirmMessage infoLabel"></label>
            </div>
          </div>
          <div class="modalFooter">
            <button class="confirmOkButton unselectable" type="button" data-i18n="[html]modal.confirm.ok">Ok</button>
            <button class="confirmCancelButton unselectable" type="button" data-i18n="[html]modal.confirm.cancel">Cancel</button>
          </div>
        </div>
        <div class="modalOverlay"></div>
      </div>
      <div id="toastContainer"></div>
    </div>
    <div id="layoutEnd"></div>
    <div>
      <?php $gameIdsWithDisclaimer = [ "flow", "someday", "deepdreams", "prayers", "amillusion", "unevendream", "braingirl",
      "muma", "genie", "mikan", "ultraviolet", "sheawaits", "oversomnia", "tsushin", "nostalgic", "oneshot", "if", "unaccomplished", "fog" ]; ?>
      <?php if ($gameId == "2kki"): ?>
      <br>
      <div class="notice version">Yume 2kki Version <span id="2kkiVersion"></span></div>
      <div class="notice" data-i18n="[html]2kki.hostedWithPermission">Hosted with permission from the Yume 2kki developers</div>
      <?php endif ?>
      <?php if (in_array($gameId, $gameIdsWithDisclaimer)): ?>
      <br>
      <div class="notice" data-i18n="[html]disclaimer.hostedWithPermission">Hosted with permission from the developer(s)</div>
      <?php endif ?>
      <?php if ($gameId == "unconscious"): ?>
      <br>
      <div class="notice" data-i18n="[html]disclaimer.originalCreation">Original creation by the YNOproject community</div>
      <?php endif ?>
      <?php if ($gameId == "yume"): ?>
      <br>
      <div class="notice" data-i18n="[html]disclaimer.pendingApproval">Pending approval from developer/publisher</div>
      <?php endif ?>
      <br>
      <a href="javascript:void(0);" class="notice" onclick="openModal('rulesModal')" data-i18n="[html]reviewRules">Review Rules</a>
    </div>
    <div id="footerIconContainer">
      <a href="https://ynoproject.net/discord" target="_blank" class="icon fillIcon" title="Discord">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
          <path d="M19.229,6.012c-0.903-0.73-2.015-1.246-2.872-1.572c-0.307-0.117-0.653-0.076-0.923,0.111C15.162,4.737,15,5.045,15,5.374	C15,5.72,14.72,6,14.374,6c-1.573,0-3.176,0-4.749,0C9.28,6,9,5.72,9,5.375c0-0.329-0.162-0.638-0.433-0.824	C8.296,4.364,7.95,4.323,7.643,4.441c-0.86,0.329-1.978,0.85-2.894,1.59C3.831,6.882,2,11.861,2,16.165	c0,0.076,0.019,0.15,0.057,0.216c1.265,2.233,4.714,2.817,5.499,2.842c0.005,0.001,0.009,0.001,0.014,0.001	c0.139,0,0.286-0.056,0.351-0.18l0.783-1.485c-0.646-0.164-1.313-0.359-2.04-0.617c-0.521-0.185-0.792-0.757-0.607-1.277	s0.759-0.791,1.277-0.607c3.527,1.254,5.624,1.253,9.345-0.005c0.523-0.175,1.091,0.104,1.268,0.627s-0.104,1.091-0.627,1.268	c-0.728,0.246-1.392,0.434-2.035,0.594l0.793,1.503c0.065,0.124,0.213,0.18,0.351,0.18c0.005,0,0.009,0,0.014-0.001	c0.786-0.025,4.235-0.61,5.499-2.843C21.981,16.315,22,16.241,22,16.164C22,11.861,20.169,6.882,19.229,6.012z M9.04,13.988	c-0.829,0-1.5-0.893-1.5-1.996c0-1.102,0.671-1.996,1.5-1.996c0.832-0.11,1.482,0.893,1.5,1.996	C10.54,13.095,9.869,13.988,9.04,13.988z M14.996,14.012c-0.829,0-1.5-0.895-1.5-2s0.671-2,1.5-2s1.5,0.895,1.5,2	S15.825,14.012,14.996,14.012z"/>
        </svg>
      </a>
      <a href="https://tumblr.com/ynoproject" target="_blank" class="icon fillIcon" title="Tumblr">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 180" width="32" height="32">
          <path d="M63.6,159.3c-24,0-41.8-12.3-41.8-41.8V70.3H0V44.7C24,38.5,34,17.9,35.1,0H60v40.6h29v29.7H60v41.1  c0,12.3,6.2,16.6,16.1,16.6h14.1v31.3H63.6z"/>
        </svg>
      </a>
      <a href="https://twitter.com/ynoproject" target="_blank" class="icon fillIcon" title="Twitter">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 209" width="32" height="32">
          <path d="M256,25.4500259 C246.580841,29.6272672 236.458451,32.4504868 225.834156,33.7202333 C236.678503,27.2198053 245.00583,16.9269929 248.927437,4.66307685 C238.779765,10.6812633 227.539325,15.0523376 215.57599,17.408298 C205.994835,7.2006971 192.34506,0.822 177.239197,0.822 C148.232605,0.822 124.716076,24.3375931 124.716076,53.3423116 C124.716076,57.4586875 125.181462,61.4673784 126.076652,65.3112644 C82.4258385,63.1210453 43.7257252,42.211429 17.821398,10.4359288 C13.3005011,18.1929938 10.710443,27.2151234 10.710443,36.8402889 C10.710443,55.061526 19.9835254,71.1374907 34.0762135,80.5557137 C25.4660961,80.2832239 17.3681846,77.9207088 10.2862577,73.9869292 C10.2825122,74.2060448 10.2825122,74.4260967 10.2825122,74.647085 C10.2825122,100.094453 28.3867003,121.322443 52.413563,126.14673 C48.0059695,127.347184 43.3661509,127.988612 38.5755734,127.988612 C35.1914554,127.988612 31.9009766,127.659938 28.694773,127.046602 C35.3777973,147.913145 54.7742053,163.097665 77.7569918,163.52185 C59.7820257,177.607983 37.1354036,186.004604 12.5289147,186.004604 C8.28987161,186.004604 4.10888474,185.75646 0,185.271409 C23.2431033,200.173139 50.8507261,208.867532 80.5109185,208.867532 C177.116529,208.867532 229.943977,128.836982 229.943977,59.4326002 C229.943977,57.1552968 229.893412,54.8901664 229.792282,52.6381454 C240.053257,45.2331635 248.958338,35.9825545 256,25.4500259" fill="#55acee"/>
        </svg>
      </a>
      <a href="https://github.com/ynoproject" target="_blank" class="icon fillIcon" title="GitHub">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
          <path d="M10.9,2.1c-4.6,0.5-8.3,4.2-8.8,8.7c-0.5,4.7,2.2,8.9,6.3,10.5C8.7,21.4,9,21.2,9,20.8v-1.6c0,0-0.4,0.1-0.9,0.1 c-1.4,0-2-1.2-2.1-1.9c-0.1-0.4-0.3-0.7-0.6-1C5.1,16.3,5,16.3,5,16.2C5,16,5.3,16,5.4,16c0.6,0,1.1,0.7,1.3,1c0.5,0.8,1.1,1,1.4,1 c0.4,0,0.7-0.1,0.9-0.2c0.1-0.7,0.4-1.4,1-1.8c-2.3-0.5-4-1.8-4-4c0-1.1,0.5-2.2,1.2-3C7.1,8.8,7,8.3,7,7.6c0-0.4,0-0.9,0.2-1.3 C7.2,6.1,7.4,6,7.5,6c0,0,0.1,0,0.1,0C8.1,6.1,9.1,6.4,10,7.3C10.6,7.1,11.3,7,12,7s1.4,0.1,2,0.3c0.9-0.9,2-1.2,2.5-1.3 c0,0,0.1,0,0.1,0c0.2,0,0.3,0.1,0.4,0.3C17,6.7,17,7.2,17,7.6c0,0.8-0.1,1.2-0.2,1.4c0.7,0.8,1.2,1.8,1.2,3c0,2.2-1.7,3.5-4,4 c0.6,0.5,1,1.4,1,2.3v2.6c0,0.3,0.3,0.6,0.7,0.5c3.7-1.5,6.3-5.1,6.3-9.3C22,6.1,16.9,1.4,10.9,2.1z"/>
        </svg>
      </a>
    </div>
    <div id="backgroundTransition"></div>
    <div id="bottom"></div>
    <div id="loadingOverlay">
      <?php if ($gameId == "2kki"): ?>
      <div class="versionDisplay unselectable" class="hidden transparent"></div>
      <?php endif ?>
    </div>
  </div>
  <script type="text/javascript" src="vendor/fastdom.js"></script>
  <script type="text/javascript" src="vendor/fastdom-promised.js"></script>
  <script type="text/javascript" src="icons.js"></script>
  <script type="text/javascript" src="toast.js"></script>
  <script type="text/javascript" src="savedata.js"></script>
  <script type="text/javascript" src="init.js"></script>
  <script type="text/javascript" src="session.js"></script>
  <script type="text/javascript" src="loader.js"></script>
  <script type="text/javascript" src="screenshots.js"></script>
  <script type="text/javascript" src="events.js"></script>
  <script type="text/javascript" src="rankings.js"></script>
  <script type="text/javascript" src="badges.js"></script>
  <script type="text/javascript" src="account.js"></script>
  <script type="text/javascript" src="vendor/DragDropTouch.js"></script>

  <?php if ($enableBadgeTools): ?>
  <script type="text/javascript" src="https://unpkg.com/vue@3"></script>
  <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
  <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.9.1/jszip.min.js"></script>
  <script type="text/javascript" src="badgetools.js"></script>
  <?php endif ?>
</body>
</html>
