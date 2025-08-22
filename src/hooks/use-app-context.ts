import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface SharedData {
  text: string;
  source: 'editor' | 'history' | 'notes' | 'suno';
  timestamp: Date;
  metadata?: {
    title?: string;
    language?: 'ru' | 'en';
    tags?: string[];
    category?: string;
  };
}

interface AppContextType {
  sharedData: SharedData | null;
  setSharedData: (data: SharedData) => void;
  clearSharedData: () => void;
  transferToEditor: (text: string, metadata?: SharedData['metadata']) => void;
  transferToNotes: (text: string, metadata?: SharedData['metadata']) => void;
  transferToSuno: (text: string, metadata?: SharedData['metadata']) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [sharedData, setSharedDataState] = useState<SharedData | null>(null);
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('tw.activeTab');
      return saved || 'editor';
    }
    return 'editor';
  });

  const setSharedData = useCallback((data: SharedData) => {
    setSharedDataState(data);
  }, []);

  const clearSharedData = useCallback(() => {
    setSharedDataState(null);
  }, []);

  const transferToEditor = useCallback((text: string, metadata?: SharedData['metadata']) => {
    setSharedData({
      text,
      source: 'editor',
      timestamp: new Date(),
      metadata
    });
    setActiveTab('editor');
  }, [setSharedData]);

  const transferToNotes = useCallback((text: string, metadata?: SharedData['metadata']) => {
    setSharedData({
      text,
      source: 'notes',
      timestamp: new Date(),
      metadata
    });
    setActiveTab('notes');
  }, [setSharedData]);

  const transferToSuno = useCallback((text: string, metadata?: SharedData['metadata']) => {
    setSharedData({
      text,
      source: 'suno',
      timestamp: new Date(),
      metadata
    });
    setActiveTab('suno');
  }, [setSharedData]);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('tw.activeTab', tab);
      }
    } catch {}
  }, []);

  return React.createElement(
    AppContext.Provider,
    {
      value: {
        sharedData,
        setSharedData,
        clearSharedData,
        transferToEditor,
        transferToNotes,
        transferToSuno,
        activeTab,
        setActiveTab,
      }
    },
    children
  );
};
