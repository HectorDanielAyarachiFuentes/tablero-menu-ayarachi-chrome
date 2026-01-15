// --- START OF FILE bg-loader.js ---

/**
 * Este script se ejecuta de forma síncrona en el <head> para prevenir el FOUC (Flash of Unstyled Content).
 * Lee la configuración de fondo guardada (tema, gradiente, URL o datos de imagen) y la aplica
 * al body ANTES de que la página se renderice por completo.
 */
// Usamos una IIFE asíncrona para poder usar await
import { GRADIENTS, DEFAULT_GRADIENT_COLORS } from '../utils/gradients.js';

(async () => {
  try {
    const applyBackgroundStyles = (mode) => {
      const style = document.body.style;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center center';
      style.backgroundRepeat = 'no-repeat';

      if (mode === 'contain') {
        style.backgroundSize = 'contain';
      } else if (mode === 'stretch') {
        style.backgroundSize = '100% 100%';
        style.backgroundPosition = 'center center';
        style.backgroundRepeat = 'no-repeat';
      } else if (mode === 'center') {
        style.backgroundSize = 'auto';
        style.backgroundPosition = 'center center'; // Asegurar que esté centrado
      }
      // 'cover' is the default
    };

    const applyGradient = (gradientId, settings) => {
      const gradient = GRADIENTS.find(g => g.id === gradientId);
      if (!gradient) return;

      const colors = gradient.cssVariables || DEFAULT_GRADIENT_COLORS;

      // Aplicar todas las variables CSS del degradado (o las por defecto)
      for (const [key, value] of Object.entries(colors)) {
        // No sobreescribir los colores de panel si ya están personalizados por el usuario
        if (key.startsWith('--panel') && settings[key.substring(2)]) {
          continue;
        }
        document.documentElement.style.setProperty(key, value);
      }

      // Aplicar el fondo de degradado
      document.body.style.backgroundImage = gradient.gradient;
    };

    const applyBackground = async (settings) => {
      // Si no hay configuraciones, aplicamos el primer gradiente como fallback para evitar el flash.
      if (!settings) {
        applyGradient(GRADIENTS[0].id, {});
        return;
      }

      // Prioridad 1: Doodle. Si hay un doodle, el fondo se pone transparente para que se vea.
      if (settings.doodle && settings.doodle !== 'none') {
        // Si hay tema premium activo, aplicarlo primero (quedará debajo del doodle)
        if (settings.activePremiumTheme) {
          await applyPremiumThemeBackground(settings.activePremiumTheme);
        } else {
          document.body.style.backgroundImage = 'none';
          document.body.style.backgroundColor = 'transparent';
        }
        return;
      }

      // Prioridad 2: Tema Premium (si está activo y no hay doodle)
      if (settings.activePremiumTheme) {
        await applyPremiumThemeBackground(settings.activePremiumTheme);
        return;
      }

      // Prioridad 3: Imagen de fondo (local o URL)
      if (settings.bgData) {
        document.body.style.backgroundImage = `url('${settings.bgData}')`;
        applyBackgroundStyles(settings.bgDisplayMode);
      } else if (settings.bgUrl) {
        document.body.style.backgroundImage = `url('${settings.bgUrl}')`;
        applyBackgroundStyles(settings.bgDisplayMode);
      } else if (settings.gradient) {
        // Prioridad 4: Degradado guardado.
        applyGradient(settings.gradient, settings);
      } else if (settings.randomBg) {
        // Prioridad 5: Degradado aleatorio.
        const randomGradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
        applyGradient(randomGradient.id, settings);
      } else {
        // Fallback final: si ninguna otra opción está configurada, usar el primer gradiente.
        applyGradient(GRADIENTS[0].id, settings);
      }
    };

    const applyPremiumThemeBackground = async (themeId) => {
      try {
        // Cargamos los temas premium desde el JSON
        const response = await fetch('json/themes-premium.json');
        const premiumThemes = await response.json();
        const theme = premiumThemes.find(t => t.id === themeId);

        if (!theme) {
          console.warn(`Premium theme ${themeId} not found`);
          return;
        }

        // Aplicar el fondo del tema
        document.body.style.background = theme.background.gradient;
        document.body.classList.add('theme-background');

        // Aplicar estilos de panel del tema
        const panel = theme.panel;
        document.documentElement.style.setProperty('--panel-bg', panel.bg);
        document.documentElement.style.setProperty('--panel-bg-rgb', panel.bgRgb);
        document.documentElement.style.setProperty('--panel-opacity', panel.opacity);
        document.documentElement.style.setProperty('--panel-blur', `${panel.blur}px`);
        document.documentElement.style.setProperty('--panel-radius', `${panel.radius}px`);

        if (panel.shadowEnabled) {
          document.documentElement.style.setProperty('--panel-shadow', `0 5px ${panel.shadowBlur}px ${panel.shadowColor}`);
        } else {
          document.documentElement.style.setProperty('--panel-shadow', 'none');
        }

        // Aplicar colores de texto del tema
        const colors = theme.colors;
        document.documentElement.style.setProperty('--panel-text-color', colors.text);
        document.documentElement.style.setProperty('--panel-text-secondary-color', colors.textSecondary);
        document.documentElement.style.setProperty('--accent-color', colors.accent);
        document.documentElement.style.setProperty('--greeting-color', colors.greeting);
        document.documentElement.style.setProperty('--name-color', colors.name);
        document.documentElement.style.setProperty('--clock-color', colors.clock);
        document.documentElement.style.setProperty('--date-color', colors.date);
      } catch (error) {
        console.error('Error applying premium theme in bg-loader:', error);
      }
    };

    // Leemos la configuración desde chrome.storage.local para máxima velocidad
    const keys = [
      'doodle', 'bgData', 'bgUrl', 'gradient', 'randomBg', 'bgDisplayMode',
      'panelBg', 'panelOpacity', 'panelBlur', 'panelRadius',
      'panelTextColor', 'panelTextSecondaryColor',
      'activePremiumTheme' // Añadido para soportar temas premium
    ];
    // CAMBIO: Se usa chrome.storage.local explícitamente por ser más rápido y consistente.
    const settings = await new Promise(resolve => chrome.storage.local.get(keys, resolve));

    // Aplicar estilos de panel de forma temprana para evitar FOUC
    if (settings) {
      const style = document.documentElement.style;
      style.setProperty('--panel-bg', settings.panelBg || '#0e193a');
      style.setProperty('--panel-opacity', settings.panelOpacity ?? 0.05);
      style.setProperty('--panel-blur', `${settings.panelBlur ?? 6}px`);
      style.setProperty('--panel-radius', `${settings.panelRadius ?? 12}px`);
      style.setProperty('--panel-text-color', settings.panelTextColor || '#dbe7ff');
      style.setProperty('--panel-text-secondary-color', settings.panelTextSecondaryColor || '#dbe7ff');

      // Aplicar fondo de la página
      await applyBackground(settings);
    }

  } catch (error) {
    console.error('Error in bg-loader:', error);
  }
})();