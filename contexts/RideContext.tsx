import React, { createContext, useContext, useState } from 'react';

interface RideContextType {
  isRiding: boolean;
  currentRide: any | null;
  startRide: () => Promise<void>;
  stopRide: () => Promise<void>;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRiding, setIsRiding] = useState(false);
  const [currentRide, setCurrentRide] = useState<any | null>(null);

  const startRide = async () => {
    setIsRiding(true);
    setCurrentRide({
      startTime: new Date(),
      route: [],
    });
  };

  const stopRide = async () => {
    setIsRiding(false);
    setCurrentRide(null);
  };

  return (
    <RideContext.Provider value={{ isRiding, currentRide, startRide, stopRide }}>
      {children}
    </RideContext.Provider>
  );
};

export const useRide = () => {
  const context = useContext(RideContext);
  if (context === undefined) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
}; 