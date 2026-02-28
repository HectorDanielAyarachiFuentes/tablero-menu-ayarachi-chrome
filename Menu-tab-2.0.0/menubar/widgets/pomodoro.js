/**
 * Widget Pomodoro — Pro Edition
 */
import { storageSet, storageGet } from '../core/utils.js';

export class PomodoroWidget {
    constructor(container) {
        this.container = container;

        this.config = { focusTime: 25, breakTime: 5 };
        this.timeLeft = this.config.focusTime * 60;
        this.totalTime = this.config.focusTime * 60;
        this.timerId = null;
        this.isRunning = false;
        this.mode = 'focus';
        this.STORAGE_KEY = 'widget_pomodoro_config';

        this.init();
    }

    async init() {
        const stored = await storageGet([this.STORAGE_KEY]);
        if (stored[this.STORAGE_KEY]) {
            this.config = stored[this.STORAGE_KEY];
            if (!this.isRunning) {
                this.timeLeft = this.config.focusTime * 60;
                this.totalTime = this.config.focusTime * 60;
            }
        }
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="widget-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Pomodoro
                <button class="pomo-settings-icon-btn" id="pomo-settings-toggle" title="Configuración">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
            </div>

            <!-- Config panel -->
            <div class="pomo-config-panel" id="pomo-config-panel">
                <div class="pomo-config-row">
                    <label>Focus</label>
                    <div class="pomo-config-stepper">
                        <button class="pomo-step-btn" data-field="focusTime" data-dir="-1">−</button>
                        <input type="number" class="pomodoro-input" id="pomo-focus-input" value="${this.config.focusTime}" min="1" max="60">
                        <button class="pomo-step-btn" data-field="focusTime" data-dir="1">+</button>
                    </div>
                    <span class="pomo-config-unit">min</span>
                </div>
                <div class="pomo-config-row">
                    <label>Descanso</label>
                    <div class="pomo-config-stepper">
                        <button class="pomo-step-btn" data-field="breakTime" data-dir="-1">−</button>
                        <input type="number" class="pomodoro-input" id="pomo-break-input" value="${this.config.breakTime}" min="1" max="30">
                        <button class="pomo-step-btn" data-field="breakTime" data-dir="1">+</button>
                    </div>
                    <span class="pomo-config-unit">min</span>
                </div>
            </div>

            <!-- Mode switch -->
            <div class="pomodoro-mode-switch">
                <button class="pomodoro-mode-btn active" data-mode="focus">Focus</button>
                <button class="pomodoro-mode-btn" data-mode="short-break">Descanso</button>
            </div>

            <!-- Ring display -->
            <div class="pomo-ring-container" id="pomo-ring-container">
                <svg class="pomo-ring-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                    <circle class="pomo-ring-bg" cx="60" cy="60" r="52"/>
                    <circle class="pomo-ring-progress" id="pomo-ring-progress" cx="60" cy="60" r="52"/>
                </svg>
                <div class="pomo-ring-inner">
                    <div class="pomodoro-time" id="pomo-time">${this.formatTime(this.timeLeft)}</div>
                    <div class="pomo-mode-label" id="pomo-mode-label">${this.mode === 'focus' ? 'FOCO' : 'DESCANSO'}</div>
                </div>
            </div>

            <!-- Controls -->
            <div class="pomodoro-controls">
                <button class="pomodoro-btn" id="pomo-toggle" title="Iniciar/Pausar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
                <button class="pomodoro-btn pomodoro-btn-reset" id="pomo-reset" title="Reiniciar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"></path><path d="M3 5v7h7"></path></svg>
                </button>
            </div>
        `;

        this.updateRing();
        this.bindEvents();
    }

    bindEvents() {
        const toggleBtn = this.container.querySelector('#pomo-toggle');
        const resetBtn = this.container.querySelector('#pomo-reset');
        const modeBtns = this.container.querySelectorAll('.pomodoro-mode-btn');
        const settingsBtn = this.container.querySelector('#pomo-settings-toggle');
        const configPanel = this.container.querySelector('#pomo-config-panel');
        const focusInput = this.container.querySelector('#pomo-focus-input');
        const breakInput = this.container.querySelector('#pomo-break-input');
        const stepBtns = this.container.querySelectorAll('.pomo-step-btn');

        toggleBtn.addEventListener('click', e => { e.stopPropagation(); this.toggleTimer(); });
        resetBtn.addEventListener('click', e => { e.stopPropagation(); this.resetTimer(); });

        modeBtns.forEach(btn =>
            btn.addEventListener('click', e => { e.stopPropagation(); this.setMode(e.target.dataset.mode); })
        );

        settingsBtn.addEventListener('click', e => {
            e.stopPropagation();
            configPanel.classList.toggle('show');
        });

        // Steppers
        stepBtns.forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const field = btn.dataset.field;
                const dir = parseInt(btn.dataset.dir);
                this.config[field] = Math.max(1, Math.min(field === 'focusTime' ? 60 : 30, this.config[field] + dir));
                this.save();
                // Update input display
                const inp = this.container.querySelector(field === 'focusTime' ? '#pomo-focus-input' : '#pomo-break-input');
                if (inp) inp.value = this.config[field];
                if (!this.isRunning) this.resetTimer();
            });
        });

        const saveConfig = () => {
            const fTime = parseInt(focusInput.value) || 25;
            const bTime = parseInt(breakInput.value) || 5;
            this.config.focusTime = Math.max(1, Math.min(60, fTime));
            this.config.breakTime = Math.max(1, Math.min(30, bTime));
            this.save();
            if (!this.isRunning) this.resetTimer();
        };

        focusInput.addEventListener('change', saveConfig);
        breakInput.addEventListener('change', saveConfig);
        [focusInput, breakInput].forEach(inp => inp.addEventListener('click', e => e.stopPropagation()));
        configPanel.addEventListener('click', e => e.stopPropagation());
    }

    async save() {
        await storageSet({ [this.STORAGE_KEY]: this.config });
    }

    toggleTimer() {
        this.isRunning ? this.pause() : this.start();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.updateToggleButton(true);
        this.container.querySelector('#pomo-ring-container')?.classList.add('running');

        this.timerId = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                this.updateDisplay();
                this.updateRing();
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
        this.container.querySelector('#pomo-ring-container')?.classList.remove('running');
    }

    resetTimer() {
        this.pause();
        this.timeLeft = (this.mode === 'focus' ? this.config.focusTime : this.config.breakTime) * 60;
        this.totalTime = this.timeLeft;
        this.updateDisplay();
        this.updateRing();
    }

    setMode(newMode) {
        this.mode = newMode;
        this.container.querySelectorAll('.pomodoro-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === newMode);
        });
        const container = this.container.querySelector('#pomo-ring-container');
        if (container) {
            container.dataset.mode = newMode;
        }
        const label = this.container.querySelector('#pomo-mode-label');
        if (label) label.textContent = newMode === 'focus' ? 'FOCO' : 'DESCANSO';
        this.resetTimer();
    }

    updateDisplay() {
        const el = this.container.querySelector('#pomo-time');
        if (el) el.textContent = this.formatTime(this.timeLeft);
    }

    updateRing() {
        const ring = this.container.querySelector('#pomo-ring-progress');
        if (!ring) return;
        const r = 52;
        const circumference = 2 * Math.PI * r;
        const progress = this.totalTime > 0 ? this.timeLeft / this.totalTime : 1;
        const offset = circumference * (1 - progress);
        ring.style.strokeDasharray = `${circumference}`;
        ring.style.strokeDashoffset = `${offset}`;
    }

    updateToggleButton(running) {
        const btn = this.container.querySelector('#pomo-toggle');
        if (!btn) return;
        btn.innerHTML = running
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    notifyComplete() {
        const ring = this.container.querySelector('#pomo-ring-container');
        if (ring) {
            ring.classList.add('pomo-complete');
            setTimeout(() => ring.classList.remove('pomo-complete'), 3000);
        }
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
        this.playNotificationSound();
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
            playNote(880, 0, 0.1);
            playNote(1108.73, 0.15, 0.1);
            playNote(1318.51, 0.3, 0.4);
        } catch (e) { console.warn('Audio failed', e); }
    }

    showDesktopNotification() {
        const title = this.mode === 'focus' ? '¡Tiempo de Foco Terminado!' : '¡Descanso Terminado!';
        const body = this.mode === 'focus' ? 'Hora de tomar un descanso. ☕' : 'Hora de volver a enfocarse. 💪';
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: 'icons/icon128.png' });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(p => {
                if (p === 'granted') new Notification(title, { body, icon: 'icons/icon128.png' });
            });
        }
    }
}
