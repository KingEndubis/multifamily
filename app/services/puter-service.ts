import { useEffect, useState } from 'react';
import { isPuterSupported, injectPuterScript, getPuter } from './puter-web-adapter';

// Define types for Puter.js API
interface PuterFS {
  write: (path: string, content: string | Blob) => Promise<any>;
  read: (path: string) => Promise<any>;
  list: (path: string) => Promise<any[]>;
  delete: (path: string) => Promise<void>;
  mkdir: (path: string) => Promise<any>;
}

interface PuterAI {
  chat: (prompt: string, options?: any) => Promise<any>;
  txt2img: (prompt: string, testMode?: boolean) => Promise<any>;
}

interface Puter {
  fs: PuterFS;
  ai: PuterAI;
  auth: {
    signIn: () => Promise<any>;
    signOut: () => Promise<void>;
    getUser: () => Promise<any>;
  };
}

declare global {
  interface Window {
    puter?: Puter;
  }
}

// Initialize Puter.js
export const initPuter = (): Promise<void> => {
  // Check if we're in a web environment
  if (!isPuterSupported()) {
    return Promise.reject(new Error('Puter.js is only supported in web environments'));
  }
  
  return injectPuterScript();
};

// Hook to use Puter.js in React components
export const usePuter = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only attempt to load Puter.js in web environments
    if (!isPuterSupported()) {
      setError('Puter.js is only supported in web environments');
      return;
    }
    
    const loadPuter = async () => {
      try {
        await initPuter();
        setIsLoaded(true);
        
        // Check if user is already authenticated
        const puter = getPuter();
        if (puter?.auth) {
          try {
            const userData = await puter.auth.getUser();
            if (userData) {
              setUser(userData);
              setIsAuthenticated(true);
            }
          } catch (e) {
            // User not authenticated
          }
        }
      } catch (e) {
        setError('Failed to initialize Puter.js');
      }
    };
    
    loadPuter();
  }, []);

  const signIn = async () => {
    if (!isLoaded || !isPuterSupported()) {
      setError('Puter.js not loaded or not supported');
      return;
    }
    
    const puter = getPuter();
    if (!puter?.auth) {
      setError('Puter.js auth not available');
      return;
    }
    
    try {
      const userData = await puter.auth.signIn();
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (e: any) {
      setError(e.message || 'Failed to sign in');
      throw e;
    }
  };

  const signOut = async () => {
    if (!isLoaded || !isPuterSupported()) {
      setError('Puter.js not loaded or not supported');
      return;
    }
    
    const puter = getPuter();
    if (!puter?.auth) {
      setError('Puter.js auth not available');
      return;
    }
    
    try {
      await puter.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (e: any) {
      setError(e.message || 'Failed to sign out');
      throw e;
    }
  };

  // File storage operations
  const saveFile = async (path: string, content: string | Blob) => {
    if (!isLoaded || !isPuterSupported()) {
      setError('Puter.js not loaded or not supported');
      return null;
    }
    
    const puter = getPuter();
    if (!puter?.fs) {
      setError('Puter.js file system not available');
      return null;
    }
    
    try {
      return await puter.fs.write(path, content);
    } catch (e: any) {
      setError(e.message || 'Failed to save file');
      throw e;
    }
  };

  const readFile = async (path: string) => {
    if (!isLoaded || !isPuterSupported()) {
      setError('Puter.js not loaded or not supported');
      return null;
    }
    
    const puter = getPuter();
    if (!puter?.fs) {
      setError('Puter.js file system not available');
      return null;
    }
    
    try {
      return await puter.fs.read(path);
    } catch (e: any) {
      setError(e.message || 'Failed to read file');
      throw e;
    }
  };

  const listFiles = async (path: string) => {
    if (!isLoaded || !isPuterSupported()) {
      setError('Puter.js not loaded or not supported');
      return [];
    }
    
    const puter = getPuter();
    if (!puter?.fs) {
      setError('Puter.js file system not available');
      return [];
    }
    
    try {
      return await puter.fs.list(path);
    } catch (e: any) {
      setError(e.message || 'Failed to list files');
      throw e;
    }
  };

  const deleteFile = async (path: string) => {
    if (!isLoaded || !isPuterSupported()) {
      setError('Puter.js not loaded or not supported');
      return;
    }
    
    const puter = getPuter();
    if (!puter?.fs) {
      setError('Puter.js file system not available');
      return;
    }
    
    try {
      await puter.fs.delete(path);
    } catch (e: any) {
      setError(e.message || 'Failed to delete file');
      throw e;
    }
  };

  const createDirectory = async (path: string) => {
    if (!isLoaded || !isPuterSupported()) {
      setError('Puter.js not loaded or not supported');
      return null;
    }
    
    const puter = getPuter();
    if (!puter?.fs) {
      setError('Puter.js file system not available');
      return null;
    }
    
    try {
      return await puter.fs.mkdir(path);
    } catch (e: any) {
      setError(e.message || 'Failed to create directory');
      throw e;
    }
  };

  // AI operations
  const chatWithAI = async (prompt: string, options?: any) => {
    if (!isLoaded || !isPuterSupported()) {
      setError('Puter.js not loaded or not supported');
      return null;
    }
    
    const puter = getPuter();
    if (!puter?.ai) {
      setError('Puter.js AI not available');
      return null;
    }
    
    try {
      return await puter.ai.chat(prompt, options);
    } catch (e: any) {
      setError(e.message || 'Failed to chat with AI');
      throw e;
    }
  };

  const generateImage = async (prompt: string, testMode: boolean = true) => {
    if (!isLoaded || !isPuterSupported()) {
      setError('Puter.js not loaded or not supported');
      return null;
    }
    
    const puter = getPuter();
    if (!puter?.ai) {
      setError('Puter.js AI not available');
      return null;
    }
    
    try {
      return await puter.ai.txt2img(prompt, testMode);
    } catch (e: any) {
      setError(e.message || 'Failed to generate image');
      throw e;
    }
  };

  return {
    isLoaded,
    isAuthenticated,
    user,
    error,
    signIn,
    signOut,
    saveFile,
    readFile,
    listFiles,
    deleteFile,
    createDirectory,
    chatWithAI,
    generateImage
  };
};