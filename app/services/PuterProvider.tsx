import React, { createContext, useContext, ReactNode } from 'react';
import { usePuter } from './puter-service';

// Create context for Puter services
interface PuterContextType {
  isLoaded: boolean;
  isAuthenticated: boolean;
  user: any;
  error: string | null;
  signIn: () => Promise<any>;
  signOut: () => Promise<void>;
  saveFile: (path: string, content: string | Blob) => Promise<any>;
  readFile: (path: string) => Promise<any>;
  listFiles: (path: string) => Promise<any[]>;
  deleteFile: (path: string) => Promise<void>;
  createDirectory: (path: string) => Promise<any>;
  chatWithAI: (prompt: string, options?: any) => Promise<any>;
  generateImage: (prompt: string, testMode?: boolean) => Promise<any>;
}

const PuterContext = createContext<PuterContextType | null>(null);

// Provider component
export const PuterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const puterServices = usePuter();
  
  return (
    <PuterContext.Provider value={puterServices}>
      {children}
    </PuterContext.Provider>
  );
};

// Hook to use Puter context
export const usePuterContext = () => {
  const context = useContext(PuterContext);
  if (!context) {
    throw new Error('usePuterContext must be used within a PuterProvider');
  }
  return context;
};