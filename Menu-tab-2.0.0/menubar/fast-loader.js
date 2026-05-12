(function() {
  // Aplicar fondo negro inmediato a todo el documento
  const bg = '#050505';
  document.documentElement.style.background = bg;
  if (document.body) document.body.style.background = bg;

  // Intentar recuperar el último degradado premium guardado para carga instantánea
  const lastGradient = localStorage.getItem('lastPremiumGradient');
  if (lastGradient) {
    const apply = (el) => {
        if (!el) return;
        el.style.setProperty('background', lastGradient, 'important');
        el.style.backgroundAttachment = 'fixed';
        el.style.backgroundSize = 'cover';
    };
    apply(document.documentElement);
    // Intentar aplicar al body si ya existe, si no, esperar al DOMContentLoaded
    if (document.body) apply(document.body);
    else window.addEventListener('DOMContentLoaded', () => apply(document.body));
  }
})();
