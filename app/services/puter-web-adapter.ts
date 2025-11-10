/**
 * This adapter ensures Puter.js works properly in React Native Web environment
 * by providing a bridge between the web-based Puter.js API and React Native.
 */

import { Platform } from 'react-native';

// Check if we're running in a web environment
export const isPuterSupported = () => Platform.OS === 'web';

// Helper to safely access window object in React Native Web
export const getWindow = (): (Window & typeof globalThis) | null => {
  if (isPuterSupported()) {
    return window;
  }
  return null;
};

// Helper to safely inject scripts in web environment
export const injectPuterScript = (): Promise<void> => {
  if (!isPuterSupported()) {
    return Promise.reject(new Error('Puter.js is only supported in web environments'));
  }
  
  return new Promise((resolve, reject) => {
    const win = getWindow();
    if (!win) {
      reject(new Error('Window object not available'));
      return;
    }
    
    // If already present, resolve immediately
    if ((win as any).puter) {
      resolve();
      return;
    }

    const load = () => {
      // Prevent duplicate tags
      const existing = document.querySelector('script[src="https://js.puter.com/v2/"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Puter.js')));
        // If puter becomes available shortly after
        const checkReady = () => {
          if ((win as any).puter) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Puter.js'));
      // Safari/WebKit sometimes errors if appended before body ready; ensure body exists
      const target = document.body || document.head || document.documentElement;
      target.appendChild(script);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', load, { once: true });
    } else {
      load();
    }
  });
};

// Helper to safely access Puter.js API
export const getPuter = () => {
  const win = getWindow();
  return (win as any)?.puter;
};