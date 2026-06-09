import React, { createContext, useContext, useState } from 'react';

interface AIContextType {
  activePostId: string | null;
  setActivePostId: (id: string | null) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePostId, setActivePostId] = useState<string | null>(null);

  return (
    <AIContext.Provider value={{ activePostId, setActivePostId }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) throw new Error('useAI must be used within an AIProvider');
  return context;
};
