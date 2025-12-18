import React from 'react';
import { Booth } from '../../../types';
import { Building2, Lock, CheckCircle, Star } from 'lucide-react';

interface BoothCardProps {
    booth: Booth;
    isVisited: boolean;
    isFeatured?: boolean;
    onClick?: () => void;
}

export default function BoothCard({
    booth,
    isVisited,
    isFeatured = false,
    onClick
}: BoothCardProps) {
    const cardClasses = `
    relative rounded-xl p-3 transition-all duration-300 cursor-pointer
    flex flex-col items-center justify-center min-h-[140px]
    ${isVisited
            ? 'border-2 border-success-500 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg'
            : 'border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800/50 opacity-70 hover:opacity-90'
        }
    ${isFeatured
            ? 'ring-2 ring-warning-400 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
            : ''
        }
    hover:-translate-y-1 hover:scale-105
    active:scale-100
  `;

    return (
        <div className={cardClasses} onClick={onClick}>
            {/* Featured Badge */}
            {isFeatured && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Star className="w-3 h-3 fill-current" />
                    <span>VIP</span>
                </div>
            )}

            {/* Visited / Lock Icon */}
            <div className="absolute top-2 right-2">
                {isVisited ? (
                    <CheckCircle className="w-6 h-6 text-success-500 drop-shadow-md" />
                ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                )}
            </div>

            {/* Booth Icon/Logo Placeholder */}
            <div className={`
        w-16 h-16 rounded-lg mb-2 flex items-center justify-center
        ${isVisited
                    ? 'bg-primary-100 dark:bg-primary-900/30'
                    : 'bg-gray-200 dark:bg-gray-700'
                }
        ${!isVisited ? 'grayscale' : ''}
      `}>
                {/* TODO: Replace with actual company logo */}
                <Building2 className={`
          w-8 h-8 
          ${isVisited
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400'
                    }
        `} />
            </div>

            {/* Company Name */}
            <h3 className={`
        text-xs font-semibold text-center line-clamp-2 mb-1
        ${isVisited
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400'
                }
      `}>
                {booth.companyName}
            </h3>

            {/* Booth ID */}
            <span className={`
        text-xs font-medium
        ${isVisited
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-gray-500 dark:text-gray-500'
                }
      `}>
                {isVisited ? '✓ ' : ''}{booth.physicalId}
            </span>

            {/* Featured Shimmer Effect */}
            {isFeatured && !isVisited && (
                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent shimmer" />
                </div>
            )}
        </div>
    );
}
