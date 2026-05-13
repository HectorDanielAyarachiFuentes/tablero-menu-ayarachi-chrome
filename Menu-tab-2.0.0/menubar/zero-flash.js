(function() {
  // 1. Obtener toda la configuración de un solo golpe (Mucho más rápido)
  let settings = {};
  try {
    const cache = localStorage.getItem('zero_flash_cache');
    if (cache) settings = JSON.parse(cache);
  } catch(e) { return; }

  const root = document.documentElement.style;

  // 2. Aplicar Tema Premium si existe
  if (settings.activePremiumTheme && settings.premiumThemeData) {
    const theme = settings.premiumThemeData;
    const panel = theme.panel;
    const colors = theme.colors;
    
    // Aplicar variables CSS al root inmediatamente
    root.setProperty('--panel-bg', settings.panelBg || panel.bg);
    root.setProperty('--panel-opacity', settings.panelOpacity ?? panel.opacity);
    root.setProperty('--panel-blur', (settings.panelBlur ?? panel.blur) + 'px');
    root.setProperty('--panel-radius', (settings.panelRadius ?? panel.radius) + 'px');
    
    root.setProperty('--panel-text-color', settings.panelTextColor || colors.text);
    root.setProperty('--panel-text-secondary-color', settings.panelTextSecondaryColor || colors.textSecondary);
    root.setProperty('--accent-color', settings.accentColor || colors.accent);
    
    root.setProperty('--greeting-color', settings.greetingColor || colors.greeting);
    root.setProperty('--name-color', settings.nameColor || colors.name);
    root.setProperty('--clock-color', settings.clockColor || colors.clock);
    root.setProperty('--date-color', settings.dateColor || colors.date);

    root.setProperty('--greeting-font', settings.greetingFont || (theme.fonts ? theme.fonts.main : "'Poppins', sans-serif"));
    root.setProperty('--date-font', settings.dateFont || (theme.fonts ? theme.fonts.secondary : "'Poppins', sans-serif"));

    // Fondo del tema
    root.setProperty('background', theme.background.gradient, 'important');
    root.setProperty('background-attachment', 'fixed', 'important');
    root.setProperty('background-size', 'cover', 'important');
  } else if (settings.gradient) {
    // Degradado simple
    root.setProperty('background', settings.gradient, 'important');
    root.setProperty('background-attachment', 'fixed', 'important');
    root.setProperty('background-size', 'cover', 'important');
  } else if (settings.bgData || settings.bgUrl) {
    // Imagen de fondo
    const url = settings.bgData || settings.bgUrl;
    root.setProperty('background-image', 'url(' + url + ')', 'important');
    root.setProperty('background-size', 'cover', 'important');
    root.setProperty('background-position', 'center', 'important');
    root.setProperty('background-attachment', 'fixed', 'important');
  } else {
    // Fallback absoluto: Negro sólido
    root.setProperty('background', '#050505', 'important');
  }

  // 3. Si hay doodle, forzar fondo negro sólido primero
  if (settings.doodle && settings.doodle !== 'none') {
    root.setProperty('background-color', '#050505', 'important');
  }

  // 4. Bloquear transiciones iniciales
  const style = document.createElement('style');
  style.id = 'zero-flash-no-trans';
  style.innerHTML = '* { transition: none !important; }';
  document.documentElement.appendChild(style);

  // Restaurar transiciones tras la carga
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const s = document.getElementById('zero-flash-no-trans');
      if (s) s.remove();
    }, 500);
  });
})();
