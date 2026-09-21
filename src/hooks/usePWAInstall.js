import { useState, useEffect, useRef } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const storedInstalled = localStorage.getItem('pwaInstalled') === 'true';
    if (standalone) {
      localStorage.setItem('pwaInstalled', 'true');
    }
    return standalone || storedInstalled;
  });

  const promptTriggeredRef = useRef(false);

  useEffect(() => {
    const checkInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      const storedInstalled = localStorage.getItem('pwaInstalled') === 'true';
      if (standalone) {
        localStorage.setItem('pwaInstalled', 'true');
      }
      return standalone || storedInstalled;
    };

    if (checkInstalled()) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      localStorage.setItem('pwaInstalled', 'true');
      setIsInstalled(true);
      setShowPromptModal(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (isInstalled) return;

    // Check if dismissed in current session
    const sessionDismissed = sessionStorage.getItem('pwaDismissedSession') === 'true';
    if (sessionDismissed) return;

    if (!deferredPrompt || promptTriggeredRef.current) return;

    const timer = setTimeout(() => {
      const stillInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                             window.navigator.standalone === true || 
                             localStorage.getItem('pwaInstalled') === 'true';
      const stillSessionDismissed = sessionStorage.getItem('pwaDismissedSession') === 'true';

      if (!stillInstalled && !stillSessionDismissed) {
        setShowPromptModal(true);
        promptTriggeredRef.current = true;
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [deferredPrompt, isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowPromptModal(false);
      return;
    }
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        localStorage.setItem('pwaInstalled', 'true');
        setIsInstalled(true);
      }
    } catch (err) {
      console.error('Error triggering PWA install prompt:', err);
    } finally {
      setShowPromptModal(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwaDismissedSession', 'true');
    setShowPromptModal(false);
  };

  return {
    showPromptModal,
    isInstalled,
    handleInstallClick,
    handleDismiss
  };
}
