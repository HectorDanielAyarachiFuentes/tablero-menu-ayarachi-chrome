// --- START OF FILE pre-loader.js ---

/**
 * Este script se ejecuta de forma síncrona en el <head> ANTES que bg-loader.
 * Su única misión es rellenar el saludo, la fecha y la hora lo más rápido posible
 * para evitar el "parpadeo" de los placeholders y la animación de carga en esos elementos.
 */
(async () => {
  // Esta lista es una copia simplificada para el pre-loader. La lista completa está en utils/greetings-list.js
  const PREDEFINED_GREETINGS_LITE = [
    { id: 'morning_1', text: 'Buenos días, ¡a por el día! 💪', period: 'morning' }, { id: 'morning_2', text: '¡Café en mano, día en marcha! ☕', period: 'morning' }, { id: 'morning_3', text: '¡Que tengas una mañana productiva! ☀️', period: 'morning' }, { id: 'morning_4', text: '¡A brillar se ha dicho! ✨', period: 'morning' }, { id: 'morning_5', text: '¡Buenos días! El mundo te espera. 🌍', period: 'morning' }, { id: 'morning_6', text: '¡Arriba ese ánimo! Es un nuevo día. 😊', period: 'morning' },
    { id: 'afternoon_1', text: 'Buenas tardes, ¿cómo va la jornada? ✨', period: 'afternoon' }, { id: 'afternoon_2', text: '¡Sigue así, crack! 😎', period: 'afternoon' }, { id: 'afternoon_3', text: 'Un pequeño descanso y a continuar. 🛋️', period: 'afternoon' }, { id: 'afternoon_4', text: '¡La tarde es joven! Aprovéchala. 🚀', period: 'afternoon' }, { id: 'afternoon_5', text: '¡Que la fuerza te acompañe esta tarde! ⭐', period: 'afternoon' }, { id: 'afternoon_6', text: '¡Ánimo, ya queda menos! 🎯', period: 'afternoon' }, { id: 'afternoon_7', text: '¡Espero que tu día vaya genial! 👍', period: 'afternoon' },
    { id: 'night_1', text: 'Buenas noches, ¡a descansar! 😴', period: 'night' }, { id: 'night_2', text: 'Dulces sueños ✨', period: 'night' }, { id: 'night_3', text: '¡Hasta mañana! 👋', period: 'night' }, { id: 'night_4', text: 'Misión cumplida por hoy. ¡A relajarse! 🧘', period: 'night' }, { id: 'night_5', text: 'Que la luna ilumine tus sueños. 🌙', period: 'night' }, { id: 'night_6', text: '¡Hora de recargar baterías! 🔋', period: 'night' }, { id: 'night_7', text: 'Gracias por otro día increíble. 🙏', period: 'night' }
  ];

  try {
    // CAMBIO: Se usa chrome.storage.local explícitamente por ser más rápido.
    const keys = [
      'userName', 'use12HourFormat', 'showSeconds', 'greetingPreference', 'customGreetings',
      'greetingColor', 'nameColor', 'clockColor', 'dateColor',
      'panelBg', 'activePremiumTheme', 'premiumThemeData'
    ];
    const settings = await new Promise(resolve => chrome.storage.local.get(keys, resolve));

    // --- MIGRACIÓN DE COLOR AZUL (Limpieza de configuración vieja) ---
    if (settings.panelBg === '#0e193a') {
      const neutralBg = 'rgba(0, 0, 0, 0.2)';
      chrome.storage.local.set({ panelBg: neutralBg });
      settings.panelBg = neutralBg;
    }

    function getRandomGreeting(period, greetingsList) {
        const options = greetingsList.filter(g => g.period === period);
        return options[Math.floor(Math.random() * options.length)];
    }

    // --- Renderizar Saludo ---
    const hour = new Date().getHours();
    let period;
    if (hour >= 5 && hour < 12) period = 'morning';
    else if (hour >= 12 && hour < 20) period = 'afternoon';
    else period = 'night';

    let greetingText;
    const preference = settings.greetingPreference || 'random';

    if (preference === 'custom' && settings.customGreetings && settings.customGreetings.trim().length > 0) {
        const customList = settings.customGreetings.split('\n').filter(line => line.trim() !== '');
        greetingText = customList[Math.floor(Math.random() * customList.length)];
    } else if (preference === 'random') {
        greetingText = getRandomGreeting(period, PREDEFINED_GREETINGS_LITE).text;
    } else {
        const selectedGreeting = PREDEFINED_GREETINGS_LITE.find(g => g.id === preference);
        greetingText = selectedGreeting ? selectedGreeting.text : getRandomGreeting(period, PREDEFINED_GREETINGS_LITE).text;
    }

    const namePart = settings.userName ? `, <strong>${settings.userName}</strong>` : '';
    const greetingEl = document.getElementById('header-greeting');
    if (greetingEl) {
      greetingEl.innerHTML = `${greetingText}${namePart}`;
    }

    // --- Aplicar Colores de Texto (Prioridad: Tema Premium > Manual) ---
    const rootStyle = document.documentElement.style;
    const isPremium = !!(settings.activePremiumTheme && settings.premiumThemeData);
    const premiumColors = isPremium ? settings.premiumThemeData.colors : null;

    if (isPremium && premiumColors) {
      rootStyle.setProperty('--greeting-color', premiumColors.greeting);
      rootStyle.setProperty('--name-color', premiumColors.name);
      rootStyle.setProperty('--clock-color', premiumColors.clock);
      rootStyle.setProperty('--date-color', premiumColors.date);
      // Colores de panel si están disponibles
      rootStyle.setProperty('--panel-text-color', premiumColors.text);
      rootStyle.setProperty('--panel-text-secondary-color', premiumColors.textSecondary);
      rootStyle.setProperty('--accent-color', premiumColors.accent);
      
      // Aplicar fondo de panel premium
      const pt = settings.premiumThemeData.panel;
      rootStyle.setProperty('--panel-bg', pt.bg);
      rootStyle.setProperty('--panel-opacity', pt.opacity);
      rootStyle.setProperty('--panel-blur', `${pt.blur}px`);
      rootStyle.setProperty('--panel-radius', `${pt.radius}px`);
      
      // Extraer RGB para el soporte de skeletons
      const rgb = pt.bg.match(/\w\w/g).map(x => parseInt(x, 16));
      rootStyle.setProperty('--panel-bg-rgb', rgb.join(', '));
    } else {
      rootStyle.setProperty('--greeting-color', settings.greetingColor || '#FFFFFF');
      rootStyle.setProperty('--name-color', settings.nameColor || '#FFFFFF');
      rootStyle.setProperty('--clock-color', settings.clockColor || '#FFFFFF');
      rootStyle.setProperty('--date-color', settings.dateColor || '#FFFFFF');

      // Defaults para paneles si no hay premium
      const pBg = settings.panelBg || 'rgba(0, 0, 0, 0.2)';
      rootStyle.setProperty('--panel-bg', pBg);
      // Intentar extraer RGB del hex si es posible, sino default a negro
      try {
        const rgb = pBg.match(/\w\w/g).map(x => parseInt(x, 16));
        rootStyle.setProperty('--panel-bg-rgb', rgb.join(', '));
      } catch(e) {
        rootStyle.setProperty('--panel-bg-rgb', '0, 0, 0');
      }
    }

    // --- Renderizar Reloj y Fecha (con formato) ---
    const now = new Date();
    const clockEl = document.getElementById('header-clock');
    if (clockEl) {
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const secondsValue = String(now.getSeconds()).padStart(2, '0');
        let ampm = '';

        if (settings.use12HourFormat) {
            ampm = hours >= 12 ? ' PM' : ' AM';
            hours = hours % 12;
            hours = hours || 12; // La hora 0 debe ser 12
        }

        let timeString = settings.use12HourFormat ? `${hours}:${minutes}` : `${String(hours).padStart(2, '0')}:${minutes}`;
        if (settings.showSeconds) {
            timeString += `:${secondsValue}`;
        }
        timeString += ampm;
        clockEl.textContent = timeString;
    }

    const dateEl = document.getElementById('date');
    if (dateEl) {
      const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = new Intl.DateTimeFormat('es-ES', dateOptions).format(now);
      dateEl.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    }

    // --- Cargar Placeholder del buscador para evitar salto visual ---
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      const engine = settings.engine || 'google';
      const placeholders = {
        'google': 'Buscar en Google...',
        'bing': 'Buscar en Bing...',
        'duckduckgo': 'Buscar en DuckDuckGo...',
        'yahoo': 'Buscar en Yahoo!'
      };
      searchInput.placeholder = placeholders[engine] || 'Buscar en la web...';
    }

  } catch (error) {
    console.error('Error in pre-loader:', error);
    // Si falla, la app principal lo cargará de todas formas.
  }
})();