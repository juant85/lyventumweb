// src/components/landing/SegmentTabs.tsx
import React from 'react';
import { motion } from 'framer-motion';

export type EventSegment = 'corporate' | 'expo';

interface SegmentTabsProps {
    activeSegment: EventSegment;
    onSegmentChange: (segment: EventSegment) => void;
    tabCorporateLabel: string;
    tabExpoLabel: string;
}

export const SegmentTabs: React.FC<SegmentTabsProps> = ({
    activeSegment,
    onSegmentChange,
    tabCorporateLabel,
    tabExpoLabel
}) => {
    return (
        <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-slate-800/60 backdrop-blur-md border border-slate-700/50 shadow-xl">
            <button
                onClick={() => onSegmentChange('corporate')}
                className={`
          relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
          ${activeSegment === 'corporate'
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }
        `}
            >
                {activeSegment === 'corporate' && (
                    <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full shadow-lg"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <span className="relative z-10">{tabCorporateLabel}</span>
            </button>

            <button
                onClick={() => onSegmentChange('expo')}
                className={`
          relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
          ${activeSegment === 'expo'
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }
        `}
            >
                {activeSegment === 'expo' && (
                    <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full shadow-lg"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <span className="relative z-10">{tabExpoLabel}</span>
            </button>
        </div>
    );
};
