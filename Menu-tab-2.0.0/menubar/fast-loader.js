(function() {
    // 1. Aplicar fondo oscuro inmediato al documentElement (el HTML), que siempre existe
    const root = document.documentElement;
    root.style.backgroundColor = '#050505';
    root.style.color = 'white';
    
    // 2. Intentar restaurar el último degradado guardado
    const lastGradient = localStorage.getItem('lastPremiumGradient');
    if (lastGradient) {
        root.style.background = lastGradient;
        root.style.backgroundAttachment = 'fixed';
        root.style.minHeight = '100vh';
    }
    
    // 3. Para el body, esperamos a que exista de forma segura
    const observer = new MutationObserver((mutations, obs) => {
        if (document.body) {
            document.body.style.backgroundColor = '#050505';
            document.body.classList.add('loading');
            obs.disconnect(); // Dejamos de observar una vez aplicado
        }
    });
    
    observer.observe(root, { childList: true });
})();
