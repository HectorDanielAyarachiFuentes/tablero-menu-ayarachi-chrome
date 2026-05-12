/**
 * Punto de entrada principal de la aplicación.
 * Se encarga de inicializar todos los módulos, cargar la configuración inicial,
 * y coordinar la renderización de los componentes principales.
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
import { DOODLES, loadDoodles, initDoodleSettings, updateDoodleSelectionUI } from './settings/doodles.js';
import { FileSystem } from './system/file-system.js';
import { widgetsManager } from './widgets/widget-manager.js';
import { initPremiumThemes } from './settings/themes-premium.js';


let currentBackgroundValue = '';

/**
 * Escucha mensajes desde otras partes de la extensión (como el service worker).
 * Si recibe un mensaje de que se añadió un marcador, recarga los datos y
 * vuelve a renderizar los accesos para mostrar el nuevo.
 */
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'BOOKMARK_ADDED') {
    console.log('Mensaje de nuevo marcador recibido. Actualizando tablero...');
    const { tiles: updatedTiles } = await storageGet(['tiles']);
    setTiles(updatedTiles);
    renderTiles();
  }
});

async function init() {
  // 1. Carga inicial desde la caché local (muy rápido)
  // Primero, intenta cargar desde el archivo local (OPFS es automático ahora).
  let settings = await FileSystem.loadDataFromFile();
  let loadedFromFile = !!settings;

  if (!settings) {
    // Si no se pudo cargar del archivo, usa el almacenamiento del navegador
    settings = await storageGet(STORAGE_KEYS);
  }
  await applySettings(settings, false);

  // 2. Espera a que las fuentes estén cargadas para evitar FOUC
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  } else {
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  // 3. Muestra la UI inmediatamente con los datos de la caché
  document.body.classList.remove('loading');

  // 4. En segundo plano, si no cargamos del archivo, busca actualizaciones desde chrome.storage.sync
  if (!loadedFromFile) {
    const syncedSettings = await storageGet(STORAGE_KEYS, false);
    await applySettings(syncedSettings, true);
  }
}

async function applySettings(settings, isUpdate = false) {
  let initialTiles = settings.tiles;

  // Si no hay accesos guardados, intenta importar desde los marcadores del navegador.
  if (!initialTiles || initialTiles.length === 0) {
    console.log('No hay accesos guardados. Importando desde los marcadores del navegador...');
    const bookmarks = await getBookmarks();
    if (bookmarks.length > 0) {
      initialTiles = bookmarks;
      console.log(`${bookmarks.length} marcadores importados como accesos.`);
      // Guardamos los marcadores importados para que no se vuelvan a importar la próxima vez.
      await storageSet({ tiles: initialTiles });
    } else {
      // Si no se encuentran marcadores, usar la lista por defecto.
      initialTiles = [
        { type: 'link', name: 'YouTube', url: 'https://www.youtube.com/' },
        { type: 'link', name: 'Google', url: 'https://www.google.com/', favorite: true },
        { type: 'link', name: 'Wikipedia', url: 'https://es.wikipedia.org/' },
        { type: 'link', name: 'GitHub', url: 'https://github.com/' }
      ];
      console.log('No se encontraron marcadores, usando la lista de accesos por defecto.');
    }
  }

  const processedTiles = initialTiles.map(t => {
    if (!t.type && t.url) return { ...t, type: 'link' };
    if (!t.type) t.type = 'link';
    if (t.type === 'folder' && !t.children) t.children = [];
    return t;
  });
  setTiles(processedTiles);

  const initialTrash = settings.trash || [];
  setTrash(initialTrash);

  $('#userName').value = settings.userName || '';
  $('#weatherCity').value = settings.weatherCity || '';
  renderGreeting(settings.userName);
  renderFavoritesInSelect();

  // Aplicar colores de texto
  applyTextColors(settings);

  // Aplicar fuentes de texto
  applyTextFonts(settings);

  // Cargar y aplicar configuraciones de visibilidad de la UI
  const showSearch = settings.showSearch ?? true;
  const showWeather = settings.showWeather ?? true;
  const showDate = settings.showDate ?? true;
  $('.search-section').hidden = !showSearch;
  $('#weather').hidden = !showWeather;
  $('#date').hidden = !showDate;

  // Cargar y aplicar configuración de animaciones de carga
  const enableLoadAnimations = settings.enableLoadAnimations ?? false; // Por defecto desactivado (carga rápida)
  if (enableLoadAnimations) {
    document.body.classList.add('with-load-animations');
  }


  // --- LÓGICA DE PANELES (Prioridad: Tema Premium > Manual) ---
  let panelBg, panelOpacity, panelBlur, panelRadius;

  if (settings.activePremiumTheme && settings.premiumThemeData) {
    const pt = settings.premiumThemeData.panel;
    panelBg = pt.bg;
    panelOpacity = pt.opacity;
    panelBlur = pt.blur;
    panelRadius = pt.radius;
  } else {
    panelBg = settings.panelBg || 'rgba(0, 0, 0, 0.2)';
    panelOpacity = settings.panelOpacity ?? 0.1;
    panelBlur = settings.panelBlur ?? 10;
    panelRadius = settings.panelRadius ?? 12;
  }

  document.documentElement.style.setProperty('--panel-bg', panelBg);
  document.documentElement.style.setProperty('--panel-opacity', panelOpacity);
  document.documentElement.style.setProperty('--panel-blur', `${panelBlur}px`);
  document.documentElement.style.setProperty('--panel-radius', `${panelRadius}px`);
  updatePanelRgb(panelBg);
  
  $('#panelColor').value = panelBg;
  $('#panelOpacity').value = panelOpacity;
  $('#panelBlur').value = panelBlur;
  $('#panelRadius').value = panelRadius;
  updateSliderValueSpans();

  await storageSet({ engine: settings.engine || 'google' });
  loadGradients(settings.gradient);
  renderTiles();
  renderEditor();
  renderNotes();
  renderTrash();

  if (!isUpdate) {
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
    await initDoodleSettings(settings.doodle || 'none');

    // Inicializar Temas Premium (Restaurado)
    await initPremiumThemes();

    // Movemos la actualización del fondo aquí para asegurar que los doodles ya estén inicializados.
    await updateBackground();

    // Inicializar Widgets
    widgetsManager.init();

    WeatherManager.init();
    setInterval(WeatherManager.fetchAndRender, 1800000); // Actualiza el clima cada 30 minutos
    loadNonCriticalCSS();
  }
}

/**
 * Obtiene los marcadores del navegador y los convierte al formato de 'tile'.
 * @returns {Promise<Array<object>>} Una promesa que resuelve a un array de tiles.
 */
export async function getBookmarks() {
  // Comprobamos que la API de marcadores esté disponible.
  if (!chrome.bookmarks) {
    return [];
  }

  return new Promise(resolve => {
    chrome.bookmarks.getTree(bookmarkTreeNodes => {
      const tiles = [];
      // Función recursiva para aplanar el árbol de marcadores.
      function flatten(nodes) {
        for (const node of nodes) {
          // Si es un marcador con URL (no una carpeta), lo añadimos.
          if (node.url) {
            tiles.push({ type: 'link', name: node.title || new URL(node.url).hostname, url: node.url, favorite: false });
          }
          // Si tiene hijos (es una carpeta), seguimos buscando dentro.
          if (node.children) {
            flatten(node.children);
          }
        }
      }
      flatten(bookmarkTreeNodes);
      resolve(tiles);
    });
  });
}

/**
 * Función centralizada para actualizar el fondo de la página.
 * Decide qué fondo mostrar según la prioridad: Doodle > Imagen > Degradado > Tema.
 */
export async function updateBackground() {
  // Ensure doodles are loaded before trying to find one
  await loadDoodles();

  const settings = await storageGet(['doodle', 'bgData', 'bgUrl', 'gradient', 'bgDisplayMode', 'activePremiumTheme']);
  const doodleId = settings.doodle || 'none';
  const doodle = DOODLES.find(d => d.id === doodleId);

  const doodleBgContainer = $('#doodle-background');
  const doodlePreviewContainer = $('#doodle-preview');

  // Limpiar siempre el contenedor del doodle antes de decidir
  doodleBgContainer.innerHTML = '';

  // Prioridad 1: Doodle activo
  if (doodle && doodle.id !== 'none' && doodle.template) {
    $('.wrap').style.backgroundColor = 'transparent';
    document.body.style.backgroundImage = 'none'; // Quitar cualquier otra imagen de fondo

    const backgroundDoodle = document.createElement('css-doodle');
    backgroundDoodle.innerHTML = doodle.template;
    doodleBgContainer.appendChild(backgroundDoodle);
    if (typeof backgroundDoodle.update === 'function') {
      setTimeout(() => backgroundDoodle.update(), 0);
    }
  } else {
    // No hay doodle, aplicar fondos normales (Imagen, Degradado o Tema)
    $('.wrap').style.backgroundColor = '';

    // Si hay un TEMA PREMIUM activo, NO aplicar fondo aquí (el tema lo maneja)
    // Solo aplicar fondo si NO hay tema premium activo
    if (!settings.activePremiumTheme) {
      if (settings.bgData) {
        applyBackgroundStyles(settings.bgDisplayMode);
        document.body.style.backgroundImage = `url('${settings.bgData}')`;
      } else if (settings.bgUrl) {
        applyBackgroundStyles(settings.bgDisplayMode);
        document.body.style.backgroundImage = `url('${settings.bgUrl}')`;
      } else if (settings.gradient) {
        applyGradient(settings.gradient);
      } else { // Por defecto, si no hay nada, aplicar un degradado
        applyGradient(GRADIENTS[0].id);
      }
    } else {
      // Asegurar que si hay tema premium, no queden residuos de estilos inline en body que puedan interferir
    }
  }

  // Actualizar siempre la UI de la configuración
  updateActiveGradientButton(settings.gradient);
  updateDoodleSelectionUI(doodleId);
}

init();

function loadNonCriticalCSS() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/non-critical.css';
  document.head.appendChild(link);
}
