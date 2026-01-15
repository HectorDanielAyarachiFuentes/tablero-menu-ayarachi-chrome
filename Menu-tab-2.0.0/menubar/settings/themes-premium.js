/**
 * Sistema de Temas Premium
 * Gestiona temas completos que incluyen fondo, paneles y colores de texto
 * Incluye modo automático día/noche basado en la hora del sistema
 */
import { $, $$, saveAndSyncSetting, storageGet } from '../core/utils.js';
import { updatePanelRgb } from './settings-panels.js';

let premiumThemes = [];
let autoModeEnabled = false;
let autoModeInterval = null;

export async function initPremiumThemes() {
    // Cargar temas premium desde JSON
    try {
        const response = await fetch('json/themes-premium.json');
        premiumThemes = await response.json();
    } catch (error) {
        console.error('Error loading premium themes:', error);
        return;
    }

    // Renderizar temas en la UI
    renderPremiumThemes();

    // Configurar controles de modo automático
    setupAutoModeControls();

    // Cargar configuración guardada
    await loadPremiumThemeSettings();
}

function renderPremiumThemes() {
    const container = document.createElement('div');
    container.className = 'premium-themes-section';
    container.innerHTML = `
        <div class="field">
            <label>Temas Premium</label>
            <p class="field-description">Temas completos que transforman toda la interfaz</p>
        </div>
        <div id="premium-theme-list" class="premium-theme-list"></div>
        
        <div class="field field-toggle" style="margin-top: 16px;">
            <label for="autoThemeToggle">Modo Automático Día/Noche</label>
            <div class="switch-container">
                <label class="switch">
                    <input type="checkbox" id="autoThemeToggle">
                    <span class="slider round"></span>
                </label>
            </div>
        </div>
        <div id="autoThemeSettings" class="auto-theme-settings" hidden>
            <div class="field">
                <label for="dayThemeSelect">Tema de Día (6:00 - 18:00)</label>
                <select id="dayThemeSelect"></select>
            </div>
            <div class="field">
                <label for="nightThemeSelect">Tema de Noche (18:00 - 6:00)</label>
                <select id="nightThemeSelect"></select>
            </div>
            <div class="auto-mode-status">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <span id="autoModeStatusText">Modo automático activado</span>
            </div>
        </div>
    `;

    // Insertar antes de la sección de degradados en la pestaña de Fondo
    const gradientSection = $('#subtab-degradados');
    if (gradientSection) {
        gradientSection.insertBefore(container, gradientSection.firstChild);
    }

    // Renderizar botones de temas
    const themeList = $('#premium-theme-list');
    premiumThemes.forEach(theme => {
        const btn = document.createElement('button');
        btn.className = 'premium-theme-btn';
        btn.dataset.themeId = theme.id;
        btn.innerHTML = `
            <div class="premium-theme-preview" style="background: ${theme.background.gradient}">
                <div class="premium-theme-panel-preview" style="
                    background-color: rgba(${theme.panel.bgRgb}, ${theme.panel.opacity});
                    backdrop-filter: blur(${theme.panel.blur}px);
                    border-radius: ${theme.panel.radius}px;
                    padding: 8px;
                ">
                    <div class="premium-theme-text" style="color: ${theme.colors.text}">Aa</div>
                </div>
            </div>
            <div class="premium-theme-info">
                <span class="premium-theme-name">${theme.name}</span>
                <span class="premium-theme-desc">${theme.description}</span>
            </div>
        `;
        btn.addEventListener('click', () => applyPremiumTheme(theme.id));
        themeList.appendChild(btn);
    });

    // Poblar selectores de modo automático
    const daySelect = $('#dayThemeSelect');
    const nightSelect = $('#nightThemeSelect');

    premiumThemes.forEach(theme => {
        const optionDay = document.createElement('option');
        optionDay.value = theme.id;
        optionDay.textContent = theme.name;
        daySelect.appendChild(optionDay);

        const optionNight = document.createElement('option');
        optionNight.value = theme.id;
        optionNight.textContent = theme.name;
        nightSelect.appendChild(optionNight);
    });
}

function setupAutoModeControls() {
    const autoToggle = $('#autoThemeToggle');
    const autoSettings = $('#autoThemeSettings');
    const daySelect = $('#dayThemeSelect');
    const nightSelect = $('#nightThemeSelect');

    autoToggle.addEventListener('change', async (e) => {
        autoModeEnabled = e.target.checked;
        autoSettings.hidden = !autoModeEnabled;

        await saveAndSyncSetting({ autoThemeMode: autoModeEnabled });

        if (autoModeEnabled) {
            startAutoMode();
        } else {
            stopAutoMode();
        }
    });

    daySelect.addEventListener('change', async (e) => {
        await saveAndSyncSetting({ dayThemeId: e.target.value });
        if (autoModeEnabled && isDayTime()) {
            applyPremiumTheme(e.target.value);
        }
    });

    nightSelect.addEventListener('change', async (e) => {
        await saveAndSyncSetting({ nightThemeId: e.target.value });
        if (autoModeEnabled && !isDayTime()) {
            applyPremiumTheme(e.target.value);
        }
    });
}

export async function applyPremiumTheme(themeId, skipSave = false) {
    const theme = premiumThemes.find(t => t.id === themeId);
    if (!theme) return;

    // 1. Aplicar fondo
    document.body.style.background = theme.background.gradient;
    document.body.classList.add('theme-background');

    // 2. Aplicar estilos de panel
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

    // 3. Aplicar colores de texto
    const colors = theme.colors;
    document.documentElement.style.setProperty('--panel-text-color', colors.text);
    document.documentElement.style.setProperty('--panel-text-secondary-color', colors.textSecondary);
    document.documentElement.style.setProperty('--accent-color', colors.accent);
    document.documentElement.style.setProperty('--greeting-color', colors.greeting);
    document.documentElement.style.setProperty('--name-color', colors.name);
    document.documentElement.style.setProperty('--clock-color', colors.clock);
    document.documentElement.style.setProperty('--date-color', colors.date);

    // 4. Actualizar controles de la UI
    updateThemeControls(theme);

    // 5. Marcar tema activo
    updateActivePremiumTheme(themeId);

    // 6. Guardar configuración (solo si no es cambio automático)
    if (!skipSave) {
        await saveAndSyncSetting({
            activePremiumTheme: themeId,
            // Guardar también en configuración de fondo
            bgType: 'gradient',
            selectedGradient: theme.background.gradient
        });
    }
}

function updateThemeControls(theme) {
    // Actualizar controles de panel si existen
    const panelColor = $('#panelColor');
    const panelOpacity = $('#panelOpacity');
    const panelBlur = $('#panelBlur');
    const panelRadius = $('#panelRadius');
    const panelTextColor = $('#panelTextColor');
    const panelTextSecondaryColor = $('#panelTextSecondaryColor');

    if (panelColor) panelColor.value = theme.panel.bg;
    if (panelOpacity) panelOpacity.value = theme.panel.opacity;
    if (panelBlur) panelBlur.value = theme.panel.blur;
    if (panelRadius) panelRadius.value = theme.panel.radius;
    if (panelTextColor) panelTextColor.value = theme.colors.text;
    if (panelTextSecondaryColor) panelTextSecondaryColor.value = theme.colors.textSecondary;

    // Actualizar spans de valores
    const opacityValue = $('#opacityValue');
    const blurValue = $('#blurValue');
    const radiusValue = $('#radiusValue');

    if (opacityValue) opacityValue.textContent = `${Math.round(theme.panel.opacity * 100)}%`;
    if (blurValue) blurValue.textContent = `${theme.panel.blur}px`;
    if (radiusValue) radiusValue.textContent = `${theme.panel.radius}px`;

    // Actualizar controles de color de texto
    const greetingColor = $('#greetingColor');
    const nameColor = $('#nameColor');
    const clockColor = $('#clockColor');
    const dateColor = $('#dateColor');

    if (greetingColor) greetingColor.value = theme.colors.greeting;
    if (nameColor) nameColor.value = theme.colors.name;
    if (clockColor) clockColor.value = theme.colors.clock;
    if (dateColor) dateColor.value = theme.colors.date;
}

function updateActivePremiumTheme(themeId) {
    $$('.premium-theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.themeId === themeId);
    });
}

function isDayTime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
}

function startAutoMode() {
    // Aplicar tema inmediatamente según la hora
    applyAutoTheme();

    // Verificar cada minuto si cambió el período
    autoModeInterval = setInterval(() => {
        applyAutoTheme();
    }, 60000); // Cada 60 segundos

    updateAutoModeStatus();
}

function stopAutoMode() {
    if (autoModeInterval) {
        clearInterval(autoModeInterval);
        autoModeInterval = null;
    }
}

async function applyAutoTheme() {
    const settings = await storageGet(['dayThemeId', 'nightThemeId']);
    const isDay = isDayTime();
    const themeId = isDay ? settings.dayThemeId : settings.nightThemeId;

    if (themeId) {
        applyPremiumTheme(themeId, true); // true = no guardar como tema manual
    }

    updateAutoModeStatus();
}

function updateAutoModeStatus() {
    const statusText = $('#autoModeStatusText');
    if (!statusText) return;

    const isDay = isDayTime();
    const hour = new Date().getHours();
    const nextChange = isDay ? 18 : 6;
    const hoursUntilChange = isDay ?
        (nextChange - hour) :
        (nextChange + 24 - hour) % 24;

    statusText.textContent = `Modo ${isDay ? 'día' : 'noche'} activo • Cambia en ${hoursUntilChange}h`;
}

async function loadPremiumThemeSettings() {
    const settings = await storageGet([
        'activePremiumTheme',
        'autoThemeMode',
        'dayThemeId',
        'nightThemeId'
    ]);

    // Configurar modo automático
    autoModeEnabled = settings.autoThemeMode || false;
    const autoToggle = $('#autoThemeToggle');
    const autoSettings = $('#autoThemeSettings');

    if (autoToggle) autoToggle.checked = autoModeEnabled;
    if (autoSettings) autoSettings.hidden = !autoModeEnabled;

    // Configurar temas de día/noche (sin aplicar defaults)
    const daySelect = $('#dayThemeSelect');
    const nightSelect = $('#nightThemeSelect');

    if (settings.dayThemeId && daySelect) {
        daySelect.value = settings.dayThemeId;
    }

    if (settings.nightThemeId && nightSelect) {
        nightSelect.value = settings.nightThemeId;
    }

    // SOLO aplicar tema si está explícitamente configurado
    if (autoModeEnabled && (settings.dayThemeId || settings.nightThemeId)) {
        startAutoMode();
    } else if (settings.activePremiumTheme) {
        applyPremiumTheme(settings.activePremiumTheme);
    }
    // Si no hay tema configurado, NO hacer nada (dejar el fondo existente)
}

// Limpiar al descargar
window.addEventListener('beforeunload', () => {
    stopAutoMode();
});
