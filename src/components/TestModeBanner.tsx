// src/components/TestModeBanner.tsx
import React from 'react';
import { useSimulation } from '../contexts/SimulationContext';
import Alert from './ui/Alert';

const TestModeBanner: React.FC = () => {
    const { simulatedPlanId, simulatedPlanName } = useSimulation();

    if (!simulatedPlanId) return null;

    return (
        <Alert
            type="warning"
            message={
                <div className="flex items-center justify-between">
                    <div>
                        <strong>🧪 TESTING MODE ACTIVE</strong>
                        <p className="text-sm mt-1">
                            You are testing features from the <strong>{simulatedPlanName || 'Unknown'}</strong> plan.
                            Your event's actual plan and data remain unchanged.
                        </p>
                    </div>
                </div>
            }
            className="mb-4"
        />
    );
};

export default TestModeBanner;
