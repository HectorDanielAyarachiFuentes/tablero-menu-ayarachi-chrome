(function() {
  // 1. Obtener toda la configuración de un solo golpe
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

    root.setProperty('background', theme.background.gradient, 'important');
    root.setProperty('background-attachment', 'fixed', 'important');
    root.setProperty('background-size', 'cover', 'important');
  } else if (settings.gradient) {
    root.setProperty('background', settings.gradient, 'important');
    root.setProperty('background-attachment', 'fixed', 'important');
    root.setProperty('background-size', 'cover', 'important');
  } else if (settings.bgData || settings.bgUrl) {
    const url = settings.bgData || settings.bgUrl;
    root.setProperty('background-image', 'url(' + url + ')', 'important');
    root.setProperty('background-size', 'cover', 'important');
    root.setProperty('background-position', 'center', 'important');
    root.setProperty('background-attachment', 'fixed', 'important');
  } else if (settings.doodleColor) {
    // Si hay un doodle, usar su color de fondo para evitar la máscara negra
    root.setProperty('background', settings.doodleColor, 'important');
  } else {
    root.setProperty('background', '#050505', 'important');
  }

  // 3. Renderizado instantáneo del Doodle (si ya cargó la librería en el head)
  if (settings.doodle && settings.doodle !== 'none' && settings.doodleTemplate) {
    // Forzar transparencia para que el doodle se vea
    root.setProperty('background', 'transparent', 'important');
    
    // Inyectar el doodle inmediatamente en el contenedor si ya existe en el DOM
    // Si no existe aún (el body no se ha parseado), esperamos un microsegundo
    const injectDoodle = () => {
      const container = document.getElementById('doodle-background');
      if (container && window.customElements && customElements.get('css-doodle')) {
        // CORRECCIÓN: El template debe ir DENTRO de la etiqueta <css-doodle>
        container.innerHTML = `
          <css-doodle>
            ${settings.doodleTemplate}
            @keyframes reveal-stagger { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            &, :after, :before { animation: reveal-stagger 0.6s ease forwards !important; animation-delay: @calc(@i * 0.02)s !important; opacity: 0; }
          </css-doodle>
        `;
        container.classList.add('ready');
      } else {
        setTimeout(injectDoodle, 10);
      }
    };
    injectDoodle();
  }

  // 4. Bloquear transiciones iniciales
  const style = document.createElement('style');
  style.id = 'zero-flash-no-trans';
  style.innerHTML = '* { transition: none !important; }';
  document.documentElement.appendChild(style);

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const s = document.getElementById('zero-flash-no-trans');
      if (s) s.remove();
    }, 500);
  });
})();
