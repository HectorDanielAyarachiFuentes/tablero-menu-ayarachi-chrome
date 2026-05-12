(function() {
  const g = localStorage.getItem('lastPremiumGradient');
  if (g) {
    document.documentElement.style.setProperty('background', g, 'important');
    document.documentElement.style.backgroundAttachment = 'fixed';
    document.documentElement.style.height = '100%';
  } else {
    document.documentElement.style.setProperty('background', '#0a0a0a', 'important');
  }
})();
