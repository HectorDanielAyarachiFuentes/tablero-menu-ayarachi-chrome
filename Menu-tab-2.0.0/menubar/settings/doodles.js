/**
 * Gestiona la selección y renderizado de los Doodles en la configuración.
 */
import { $, $$ } from '../core/utils.js';
import { saveAndSyncSetting } from '../core/utils.js';
import { DOODLES_LIST } from './doodles-list.js';

export const DOODLES = DOODLES_LIST;

export function loadDoodles() {
  return DOODLES_LIST;
}

export function initDoodleSettings(activeDoodleId) {
  const doodleList = $('#doodle-list');
  if (!doodleList) return;
  doodleList.innerHTML = '';

  DOODLES_LIST.forEach(doodle => {
    const button = document.createElement('button');
    button.className = 'doodle-item';
    button.dataset.doodleId = doodle.id;

    button.innerHTML = `
      <div class="doodle-item-preview ${doodle.id}">
        <css-doodle>${doodle.template || ''}</css-doodle>
      </div>
      <span class="doodle-item-name">${doodle.name}</span>
    `;

    if (doodle.id === 'none') {
      button.querySelector('.doodle-item-preview').classList.add('none');
    }
    
    button.addEventListener('click', async () => {
        await saveAndSyncSetting({
          doodle: doodle.id,
          activePremiumTheme: null,
          bgUrl: null,
          bgData: null,
          gradient: null
        });
        // Notificamos al sistema que el fondo ha cambiado (usamos un evento para evitar import circular)
        window.dispatchEvent(new CustomEvent('background-changed'));
    });

    const doodleElement = button.querySelector('css-doodle');
    if (doodleElement) {
        setTimeout(() => { if(doodleElement.pause) doodleElement.pause(); }, 100);
    }

    button.addEventListener('mouseenter', () => {
      const doodleElement = button.querySelector('css-doodle');
      if (doodleElement && doodleElement.resume) doodleElement.resume();
    });
    button.addEventListener('mouseleave', () => {
      const doodleElement = button.querySelector('css-doodle');
      if (doodleElement && doodleElement.pause) doodleElement.pause();
    });

    doodleList.appendChild(button);
  });

  updateDoodleSelectionUI(activeDoodleId);
}

export function updateDoodleSelectionUI(doodleId) {
  const doodlePreviewContainer = $('#doodle-preview');
  if (!doodlePreviewContainer) return;
  
  $$('#doodle-list .doodle-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.doodleId === doodleId);
  });

  const doodle = DOODLES_LIST.find(d => d.id === doodleId);
  if (doodle && doodle.id !== 'none' && doodle.template) {
    doodlePreviewContainer.innerHTML = `<css-doodle>${doodle.template}</css-doodle>`;
  } else {
    doodlePreviewContainer.innerHTML = '<span class="placeholder-text">Selecciona un doodle para verlo aquí</span>';
  }
}