// src/components/ui/Avatar.tsx
import React from 'react';

interface AvatarProps {
    src?: string;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
};

/**
 * Premium Avatar component
 * Shows user image or initials with gradient background
 */
export const Avatar: React.FC<AvatarProps> = ({
    src,
    name = '',
    size = 'md',
    className = ''
}) => {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const baseClasses = `inline-flex items-center justify-center rounded-full font-semibold ${sizeClasses[size]} ${className}`;

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={`${baseClasses} object-cover`}
            />
        );
    }

    // Gradient background for initials
    return (
        <div className={`${baseClasses} bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md`}>
            {initials || '?'}
        </div>
    );
};

export default Avatar;
