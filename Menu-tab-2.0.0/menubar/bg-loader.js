// --- START OF FILE bg-loader.js ---

/**
 * Cargador de Fondo Ultra-Rápido
 * Aplica el tema premium desde la caché de storage para evitar FOUC y destellos.
 */
import { GRADIENTS, DEFAULT_GRADIENT_COLORS } from '../utils/gradients.js';

(async () => {
  try {
    const keys = [
      'doodle', 'bgData', 'bgUrl', 'gradient', 'bgDisplayMode',
      'panelBg', 'panelOpacity', 'panelBlur', 'panelRadius',
      'panelTextColor', 'panelTextSecondaryColor',
      'activePremiumTheme', 'premiumThemeData' // Datos del tema en caché
    ];
    
    const settings = await new Promise(resolve => chrome.storage.local.get(keys, resolve));

    // 1. Si no hay configuración o está cargando, fondo negro neutro (NO AZUL)
    if (!settings) {
      document.documentElement.style.background = '#000';
      return;
    }

    const applyThemeData = (theme) => {
      const style = document.documentElement.style;
      const bodyStyle = document.body.style;

      // Fondo
      bodyStyle.background = theme.background.gradient;
      document.body.classList.add('theme-background');

      // Paneles
      const panel = theme.panel;
      style.setProperty('--panel-bg', panel.bg);
      style.setProperty('--panel-bg-rgb', panel.bgRgb);
      style.setProperty('--panel-opacity', panel.opacity);
      style.setProperty('--panel-blur', `${panel.blur}px`);
      style.setProperty('--panel-radius', `${panel.radius}px`);

      if (panel.shadowEnabled) {
        style.setProperty('--panel-shadow', `0 5px ${panel.shadowBlur}px ${panel.shadowColor}`);
      }

      // Colores y Fuentes
      const colors = theme.colors;
      style.setProperty('--panel-text-color', colors.text);
      style.setProperty('--panel-text-secondary-color', colors.textSecondary);
      style.setProperty('--accent-color', colors.accent);
      style.setProperty('--greeting-color', colors.greeting);
      style.setProperty('--name-color', colors.name);
      style.setProperty('--clock-color', colors.clock);
      style.setProperty('--date-color', colors.date);

      if (theme.fonts) {
        style.setProperty('--greeting-font', theme.fonts.main);
        style.setProperty('--date-font', theme.fonts.secondary);
      }
    };

    // --- PRIORIDAD CRÍTICA ---

    // Prioridad 1: Datos del tema premium en caché (INSTANTÁNEO, sin fetch)
    if (settings.activePremiumTheme && settings.premiumThemeData) {
      applyThemeData(settings.premiumThemeData);
      return;
    }

    // Prioridad 2: Doodle (Fondo transparente)
    if (settings.doodle && settings.doodle !== 'none') {
       document.body.style.backgroundColor = 'transparent';
       return;
    }

    // Prioridad 3: Imágenes locales/URL
    if (settings.bgData || settings.bgUrl) {
      const url = settings.bgData || settings.bgUrl;
      document.body.style.backgroundImage = `url('${url}')`;
      document.body.style.backgroundSize = 'cover';
      return;
    }

    // Prioridad 4: Degradados estándar
    if (settings.gradient) {
      const gradient = GRADIENTS.find(g => g.id === settings.gradient);
      if (gradient) {
        document.body.style.backgroundImage = gradient.gradient;
        const colors = gradient.cssVariables || DEFAULT_GRADIENT_COLORS;
        for (const [key, value] of Object.entries(colors)) {
          document.documentElement.style.setProperty(key, value);
        }
      }
    } else {
      // Fallback: Negro absoluto para evitar el azul
      document.body.style.background = '#000';
    }

  } catch (error) {
    console.error('Error in ultra-fast bg-loader:', error);
  }
})();