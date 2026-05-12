/**
 * Punto de entrada principal de la aplicación.
 * Optimizada para carga progresiva (Layered Loading)
 */
import { $, storageGet, storageSet } from './core/utils.js';
import { STORAGE_KEYS } from './core/config.js';

import { initUI, renderGreeting, updateActiveThemeButton, updateActiveGradientButton, updateDataTabUI, toggleSettings, switchToTab } from './components/ui.js';
import { updateSliderValueSpans, updatePanelRgb } from './settings/settings-panels.js';
import { initTiles, renderTiles, tiles, setTiles, setTrash } from './core/tiles.js';
import { renderNotes } from './components/notes.js';
import { renderEditor } from './settings/editor.js';
import { renderTrash } from './components/trash.js';
import { initSearch, renderFavoritesInSelect } from '../utils/search.js';
import { initSettings, loadGradients, applyGradient, applyBackgroundStyles, applyTextColors, applyTextFonts } from './settings/settings.js';
import { GRADIENTS } from '../utils/gradients.js';
import { WeatherManager } from '../utils/tiempo.js';
import { loadDoodles, initDoodleSettings, updateDoodleSelectionUI } from './settings/doodles.js';
import { DOODLES_LIST } from './settings/doodles-list.js';
import { FileSystem } from './system/file-system.js';
import { widgetsManager } from './widgets/widget-manager.js';
import { initPremiumThemes } from './settings/themes-premium.js';

let currentBackgroundValue = '';

async function init() {
  // 1. CARGA CRÍTICA
  const settings = await storageGet(STORAGE_KEYS);
  
  await applyCriticalVisuals(settings);
  document.body.classList.remove('loading');

  // Escuchar cambios de fondo desde la configuración (evita dependencias circulares)
  window.addEventListener('background-changed', () => updateBackground());

  // Fase 2: Lógica de interacción
  setTimeout(() => {
      initInteractionLogic(settings);
  }, 100);

  // Fase 3: Sistemas Pesados
  setTimeout(() => {
      initHeavySystems(settings);
      loadNonCriticalCSS();
  }, 500);

  // Fase 4: Sincronización
  setTimeout(async () => {
      try {
          const fileSettings = await FileSystem.loadDataFromFile();
          if (fileSettings) await applyCriticalVisuals(fileSettings);
      } catch (e) { console.warn("FS Sync postponed:", e); }
  }, 2000);
}

async function applyCriticalVisuals(settings) {
  let initialTiles = settings.tiles || [];
  if (initialTiles.length === 0) {
      initialTiles = [
        { type: 'link', name: 'YouTube', url: 'https://www.youtube.com/' },
        { type: 'link', name: 'Google', url: 'https://www.google.com/', favorite: true },
        { type: 'link', name: 'Wikipedia', url: 'https://es.wikipedia.org/' },
        { type: 'link', name: 'GitHub', url: 'https://github.com/' }
      ];
  }
  setTiles(initialTiles);
  setTrash(settings.trash || []);

  renderGreeting(settings.userName);
  applyTextColors(settings);
  applyTextFonts(settings);
  
  $('.search-section').hidden = !(settings.showSearch ?? true);
  $('#weather').hidden = !(settings.showWeather ?? true);
  $('#date').hidden = !(settings.showDate ?? true);

  const pt = (settings.activePremiumTheme && settings.premiumThemeData) ? settings.premiumThemeData.panel : null;
  const panelBg = pt ? pt.bg : (settings.panelBg || 'rgba(0, 0, 0, 0.2)');
  const panelOpacity = pt ? pt.opacity : (settings.panelOpacity ?? 0.1);
  const panelBlur = pt ? pt.blur : (settings.panelBlur ?? 10);
  const panelRadius = pt ? pt.radius : (settings.panelRadius ?? 12);

  const root = document.documentElement.style;
  root.setProperty('--panel-bg', panelBg);
  root.setProperty('--panel-opacity', panelOpacity);
  root.setProperty('--panel-blur', `${panelBlur}px`);
  root.setProperty('--panel-radius', `${panelRadius}px`);
  updatePanelRgb(panelBg);

  renderTiles();
  await updateBackground();
}

function initInteractionLogic(settings) {
    initUI();
    initTiles();
    initSearch();
    initSettings({
      currentGradient: settings.gradient,
      currentBackgroundValue,
      randomBg: settings.randomBg,
      autoSync: settings.autoSync,
      bgDisplayMode: settings.bgDisplayMode,
      isCustomBg: !!(settings.bgData || settings.bgUrl)
    });
}

async function initHeavySystems(settings) {
    await initPremiumThemes();
    widgetsManager.init();
    WeatherManager.init();
    
    renderEditor();
    renderNotes();
    renderTrash();
    renderFavoritesInSelect();
    
    updateSliderValueSpans();
    $('#panelColor').value = document.documentElement.style.getPropertyValue('--panel-bg').trim();
}

export async function updateBackground() {
  const settings = await storageGet(['doodle', 'bgData', 'bgUrl', 'gradient', 'bgDisplayMode', 'activePremiumTheme']);
  const doodleId = settings.doodle || 'none';
  const doodle = DOODLES_LIST.find(d => d.id === doodleId);

  const doodleBgContainer = $('#doodle-background');
  doodleBgContainer.innerHTML = '';

  if (doodle && doodle.id !== 'none' && doodle.template) {
    $('.wrap').style.backgroundColor = 'transparent';
    document.body.style.backgroundImage = 'none';
    const backgroundDoodle = document.createElement('css-doodle');
    backgroundDoodle.innerHTML = doodle.template;
    doodleBgContainer.appendChild(backgroundDoodle);
  } else if (!settings.activePremiumTheme) {
    $('.wrap').style.backgroundColor = '';
    if (settings.bgData || settings.bgUrl) {
      applyBackgroundStyles(settings.bgDisplayMode);
      document.body.style.backgroundImage = `url('${settings.bgData || settings.bgUrl}')`;
    } else {
      applyGradient(settings.gradient || GRADIENTS[0].id);
    }
  }
}

function loadNonCriticalCSS() {
  ['css/widgets.css', 'css/themes-premium.css', 'css/drag-drop-safe.css'].forEach(file => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = file;
    document.head.appendChild(link);
  });
}

init();
