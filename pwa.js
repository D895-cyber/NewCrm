// PWA Service Worker Registration and Install Prompt
(function() {
  'use strict';

  // Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
  
  // Add to home screen prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Show install button or prompt
    console.log('App can be installed');
    
    // Show install button
    const installButton = document.createElement('button');
    installButton.textContent = '📱 Install App';
    installButton.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 shadow-lg';
    installButton.onclick = () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
        installButton.remove();
      });
    };
    document.body.appendChild(installButton);
  });
  
  // Handle app installed
  window.addEventListener('appinstalled', () => {
    console.log('App was installed');
  });
})();
