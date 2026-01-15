/**
 * Widget Pomodoro
 */
import { storageSet, storageGet } from '../core/utils.js';

export class PomodoroWidget {
    constructor(container) {
        this.container = container;

        // Configuración por defecto
        this.config = {
            focusTime: 25,
            breakTime: 5
        };

        this.timeLeft = this.config.focusTime * 60;
        this.timerId = null;
        this.isRunning = false;
        this.mode = 'focus'; // focus | short-break
        this.STORAGE_KEY = 'widget_pomodoro_config';

        this.init();
    }

    async init() {
        const stored = await storageGet([this.STORAGE_KEY]);
        if (stored[this.STORAGE_KEY]) {
            this.config = stored[this.STORAGE_KEY];
            // Actualizar tiempo inicial si no está corriendo
            if (!this.isRunning) {
                this.timeLeft = this.config.focusTime * 60;
            }
        }
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="widget-title">
                <div style="display:flex; align-items:center; gap:8px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    Pomodoro
                </div>
                <div class="pomodoro-header-actions">
                    <button class="pomodoro-settings-btn" id="pomo-settings-toggle" title="Configuración">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    </button>
                </div>
            </div>

            <!-- Panel de Configuración -->
            <div class="pomodoro-settings" id="pomo-settings-panel">
                <div class="pomodoro-setting-row">
                    <span>Focus (min):</span>
                    <input type="number" class="pomodoro-input" id="pomo-focus-input" value="${this.config.focusTime}" min="1" max="60">
                </div>
                <div class="pomodoro-setting-row">
                    <span>Descanso (min):</span>
                    <input type="number" class="pomodoro-input" id="pomo-break-input" value="${this.config.breakTime}" min="1" max="30">
                </div>
            </div>

            <div class="pomodoro-mode-switch">
                <button class="pomodoro-mode-btn active" data-mode="focus">Focus</button>
                <button class="pomodoro-mode-btn" data-mode="short-break">Descanso</button>
            </div>
            <div class="pomodoro-display">
                <div class="pomodoro-time">${this.formatTime(this.timeLeft)}</div>
            </div>
            <div class="pomodoro-controls">
                <button class="pomodoro-btn" id="pomo-toggle" title="Iniciar/Pausar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
                <button class="pomodoro-btn" id="pomo-reset" title="Reiniciar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"></path><path d="M3 5v7h7"></path></svg>
                </button>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const toggleBtn = this.container.querySelector('#pomo-toggle');
        const resetBtn = this.container.querySelector('#pomo-reset');
        const modeBtns = this.container.querySelectorAll('.pomodoro-mode-btn');
        const settingsBtn = this.container.querySelector('#pomo-settings-toggle');
        const settingsPanel = this.container.querySelector('#pomo-settings-panel');
        const focusInput = this.container.querySelector('#pomo-focus-input');
        const breakInput = this.container.querySelector('#pomo-break-input');

        toggleBtn.addEventListener('click', () => this.toggleTimer());
        resetBtn.addEventListener('click', () => this.resetTimer());

        modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setMode(e.target.dataset.mode));
        });

        // Configuración
        settingsBtn.addEventListener('click', () => {
            settingsPanel.classList.toggle('show');
        });

        // Guardar configuración al cambiar inputs
        const saveConfig = () => {
            const fTime = parseInt(focusInput.value) || 25;
            const bTime = parseInt(breakInput.value) || 5;

            this.config.focusTime = Math.max(1, Math.min(60, fTime));
            this.config.breakTime = Math.max(1, Math.min(30, bTime));

            this.save();

            // Si no está corriendo, actualizar tiempo inmediatamente
            if (!this.isRunning) {
                this.resetTimer();
            }
        };

        focusInput.addEventListener('change', saveConfig);
        breakInput.addEventListener('change', saveConfig);
    }

    async save() {
        await storageSet({ [this.STORAGE_KEY]: this.config });
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.updateToggleButton(true);

        this.timerId = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                this.updateDisplay();
            } else {
                this.pause();
                this.notifyComplete();
            }
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.timerId);
        this.updateToggleButton(false);
    }

    resetTimer() {
        this.pause();
        this.timeLeft = (this.mode === 'focus' ? this.config.focusTime : this.config.breakTime) * 60;
        this.updateDisplay();
    }

    setMode(newMode) {
        this.mode = newMode;
        this.container.querySelectorAll('.pomodoro-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === newMode);
        });
        this.resetTimer();
    }

    updateDisplay() {
        this.container.querySelector('.pomodoro-time').textContent = this.formatTime(this.timeLeft);
    }

    updateToggleButton(running) {
        const btn = this.container.querySelector('#pomo-toggle');
        if (running) {
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
        } else {
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        }
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    notifyComplete() {
        const display = this.container.querySelector('.pomodoro-time');
        const widgetCard = this.container.closest('.widget-card');

        // 1. Cambio visual de color
        display.style.color = '#4caf50';
        setTimeout(() => {
            display.style.color = '';
        }, 5000);

        // 2. Vibración visual (Shake)
        if (widgetCard) {
            widgetCard.classList.add('widget-shake');
            setTimeout(() => {
                widgetCard.classList.remove('widget-shake');
            }, 1500); // 3 iteraciones de 0.5s
        }

        // 3. Vibración de dispositivo (si es soportado)
        if (navigator.vibrate) {
            // Patrón: vibrar-pausa-vibrar...
            navigator.vibrate([200, 100, 200, 100, 200]);
        }

        // 4. Sonido (Bip-Bip usando AudioContext)
        this.playNotificationSound();

        // 5. Notificación de Escritorio
        this.showDesktopNotification();
    }

    playNotificationSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();

            const playNote = (freq, time, duration) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

                gain.gain.setValueAtTime(0.1, ctx.currentTime + time);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime + time);
                osc.stop(ctx.currentTime + time + duration);
            };

            // Secuencia agradable de notas
            playNote(880, 0, 0.1);    // A5
            playNote(1108.73, 0.15, 0.1); // C#6
            playNote(1318.51, 0.3, 0.4);  // E6

        } catch (e) {
            console.warn("Audio play failed", e);
        }
    }

    showDesktopNotification() {
        const title = this.mode === 'focus' ? '¡Tiempo de Foco Terminado!' : '¡Descanso Terminado!';
        const body = this.mode === 'focus' ? 'Hora de tomar un descanso. ☕' : 'Hora de volver a enfocarse. 💪';

        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification(title, { body, icon: 'icons/icon128.png' });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification(title, { body, icon: 'icons/icon128.png' });
                }
            });
        }
    }
}
