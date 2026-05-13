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
      'panelTextColor', 'panelTextSecondaryColor', 'accentColor',
      'greetingColor', 'nameColor', 'clockColor', 'dateColor',
      'greetingFont', 'dateFont',
      'activePremiumTheme', 'premiumThemeData' // Datos del tema en caché
    ];
    
    const settings = await new Promise(resolve => chrome.storage.local.get(keys, resolve));

    // 1. Si no hay configuración, usar transparente para no parpadear
    if (!settings) {
      document.documentElement.style.background = 'transparent';
      return;
    }

    const applyThemeData = (theme) => {
      const style = document.documentElement.style;
      const bodyStyle = document.body.style;

      // Fondo
      bodyStyle.background = theme.background.gradient;
      document.body.classList.add('theme-background');

      // Paneles (Priorizando ajustes individuales/ediciones sobre el tema)
      const panel = theme.panel;
      style.setProperty('--panel-bg', settings.panelBg || panel.bg);
      style.setProperty('--panel-bg-rgb', panel.bgRgb);
      style.setProperty('--panel-opacity', settings.panelOpacity ?? panel.opacity);
      style.setProperty('--panel-blur', `${settings.panelBlur ?? panel.blur}px`);
      style.setProperty('--panel-radius', `${settings.panelRadius ?? panel.radius}px`);

      if (panel.shadowEnabled) {
        style.setProperty('--panel-shadow', `0 5px ${panel.shadowBlur}px ${panel.shadowColor}`);
      }

      // Colores y Fuentes (Priorizando ajustes individuales/ediciones sobre el tema)
      const colors = theme.colors;
      style.setProperty('--panel-text-color', settings.panelTextColor || colors.text);
      style.setProperty('--panel-text-secondary-color', settings.panelTextSecondaryColor || colors.textSecondary);
      style.setProperty('--accent-color', settings.accentColor || colors.accent);
      style.setProperty('--greeting-color', settings.greetingColor || colors.greeting);
      style.setProperty('--name-color', settings.nameColor || colors.name);
      style.setProperty('--clock-color', settings.clockColor || colors.clock);
      style.setProperty('--date-color', settings.dateColor || colors.date);

      style.setProperty('--greeting-font', settings.greetingFont || (theme.fonts ? theme.fonts.main : "'Poppins', sans-serif"));
      style.setProperty('--date-font', settings.dateFont || (theme.fonts ? theme.fonts.secondary : "'Poppins', sans-serif"));
    };

    // --- PRIORIDAD CRÍTICA ---

    // Prioridad 1: Datos del tema premium en caché (INSTANTÁNEO, sin fetch)
    if (settings.activePremiumTheme && settings.premiumThemeData) {
      applyThemeData(settings.premiumThemeData);
    } else if (settings.gradient) {
      // Prioridad 2: Degradados estándar
      const gradient = GRADIENTS.find(g => g.id === settings.gradient);
      if (gradient) {
        document.body.style.backgroundImage = gradient.gradient;
        const colors = gradient.cssVariables || DEFAULT_GRADIENT_COLORS;
        for (const [key, value] of Object.entries(colors)) {
          document.documentElement.style.setProperty(key, value);
        }
      }
    } else if (settings.bgData || settings.bgUrl) {
      // Prioridad 3: Imágenes locales/URL
      const url = settings.bgData || settings.bgUrl;
      document.body.style.backgroundImage = `url('${url}')`;
      document.body.style.backgroundSize = 'cover';
    } else {
      // Fallback neutro
      document.body.style.backgroundColor = 'transparent';
    }

    // Prioridad Absoluta: Si hay un doodle, el fondo debe ser transparente para que se vea
    if (settings.doodle && settings.doodle !== 'none') {
       document.documentElement.style.setProperty('background', 'transparent', 'important');
       document.body.style.setProperty('background', 'transparent', 'important');
    }

  } catch (error) {
    console.error('Error in ultra-fast bg-loader:', error);
  }
})();