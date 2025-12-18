// src/contexts/SimulationContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';

interface SimulationContextType {
  simulatedPlanId: string | null;
  setSimulatedPlan: (planId: string | null, planName: string | null) => void;
  simulatedPlanName: string | null;
  isSimulating: boolean;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [simulatedPlanId, setSimulatedPlanId] = useState<string | null>(null);
  const [simulatedPlanName, setSimulatedPlanName] = useState<string | null>(null);

  const setSimulatedPlan = (planId: string | null, planName: string | null) => {
    setSimulatedPlanId(planId);
    setSimulatedPlanName(planName);
  };
  
  const isSimulating = !!simulatedPlanId;

  const value = useMemo(() => ({
    simulatedPlanId,
    setSimulatedPlan,
    simulatedPlanName,
    isSimulating,
  }), [simulatedPlanId, simulatedPlanName, isSimulating]);

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = (): SimulationContextType => {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
