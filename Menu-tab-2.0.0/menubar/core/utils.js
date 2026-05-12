// --- START OF FILE utils.js ---

/**
 * Proporciona funciones de utilidad reutilizables en toda la aplicación.
 * Incluye selectores de DOM, helpers para el almacenamiento y una función de guardado con debounce.
 */
import { FileSystem } from '../system/file-system.js';
import { showSaveStatus } from '../components/ui.js';

export const $ = s => document.querySelector(s);
export const $$ = s => Array.from(document.querySelectorAll(s));

let saveDebounceTimer;

// storage helpers supporting chrome.storage.sync or fallback to localStorage
export const storageGet = (keys, useCache = false) => new Promise(resolve => {
  if (window.chrome && chrome.storage?.local) {
    // Siempre leemos de local, que es nuestra "fuente de verdad" en el navegador para la carga inicial.
    chrome.storage.local.get(keys, resolve);
  } else { // Fallback para cuando no es una extensión
    const out = {};
    keys.forEach(k => { out[k] = JSON.parse(localStorage.getItem(k)); });
    resolve(out);
  }
});

// CAMBIO: La función de guardado ahora escribe en `local` (para velocidad) y `sync` (para sincronización)
// Se añade un filtro de tamaño para evitar el error "kQuotaBytesPerItem quota exceeded"
export const storageSet = (obj) => {
  return new Promise(async (resolve) => {
    if (window.chrome && chrome.storage) {
      // 1. Guardamos SIEMPRE en local para acceso rápido e inmediato.
      // Local no tiene los límites tan estrictos de sync.
      await new Promise(res => chrome.storage.local.set(obj, res));

      // 2. Intentamos guardar en sync para la sincronización entre dispositivos.
      if (chrome.storage.sync) {
        const syncObj = {};
        let hasLargeItems = false;

        for (const key in obj) {
          // Calculamos el tamaño aproximado en bytes
          const size = JSON.stringify(obj[key]).length;
          
          // El límite de Chrome Sync es ~8KB (8192 bytes) por item.
          // Si el item es más pequeño que 7KB, lo incluimos en la sincronización.
          if (size < 7000) {
            syncObj[key] = obj[key];
          } else {
            hasLargeItems = true;
            // Silenciamos la advertencia de tamaño para no molestar al usuario, 
            // ya que el guardado local funciona correctamente.
          }
        }

        if (Object.keys(syncObj).length > 0) {
          chrome.storage.sync.set(syncObj, () => {
            if (chrome.runtime.lastError) {
              console.error("Error en chrome.storage.sync:", chrome.runtime.lastError.message);
            }
          });
        }
      }
      resolve();
    } else {
      // Fallback para cuando no es una extensión (localStorage)
      Object.keys(obj).forEach(k => localStorage.setItem(k, JSON.stringify(obj[k])));
      resolve();
    }
  });
};


/**
 * Función de guardado en archivo con "debounce".
 * Agrupa múltiples llamadas a guardar en un corto período de tiempo en una sola.
 * @param {object} dataToSave - Datos a fusionar y guardar.
 * @param {boolean} forceAll - Si es true, fuerza a guardar todos los datos, no solo los del parámetro.
 */
const debouncedSaveToFile = (dataToSave, forceAll = false) => {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(async () => {
        // Pasamos el objeto de configuración directamente para que se guarde en el archivo.
        // No es necesario pasar `dataToSave` aquí, ya que `saveDataToFile` obtiene el estado más reciente del storage.
        try {
            // Al pasar un objeto vacío, forzamos a saveDataToFile a recolectar todos los datos.
            await FileSystem.saveDataToFile({}); 
            showSaveStatus();
        } catch (error) {
            // El error ya se muestra en la UI desde file-system.js, aquí solo lo capturamos.
            console.error("Fallo el guardado automático después de varios intentos.", error);
        }
    }, 300); // Espera 300ms antes de guardar
};

/**
 * Guarda una configuración, la almacena en el navegador y sincroniza con el archivo si autoSync está activado.
 * @param {object} setting - Un objeto con la clave y valor a guardar. Ej: { userName: 'Test' }
 * @param {function(object):void} [applyCallback] - Una función opcional para aplicar los cambios en la UI.
 */
export async function saveAndSyncSetting(setting, applyCallback) {
    // 1. Guardar el cambio específico en el almacenamiento del navegador.
    await storageSet(setting);
    // 2. Aplicar el cambio en la UI si se proporciona un callback.
    if (applyCallback) {
        applyCallback(setting);
    }
    // 3. Comprobar si la sincronización con archivo está activa.
    const { autoSync } = await storageGet(['autoSync']);
    if (autoSync) {
        // 4. Disparar el guardado en archivo. Pasamos un objeto vacío para forzar
        //    a que se guarde el estado COMPLETO, no solo este cambio.
        debouncedSaveToFile({});
    } else {
        showSaveStatus();
    }
}