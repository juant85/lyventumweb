// src/components/mobile/MobileContentContainer.tsx
import React, { ReactNode } from 'react';

interface MobileContentContainerProps {
    children: ReactNode;
    className?: string;
    /** Set to true for full-width sections like headers */
    fullWidth?: boolean;
}

/**
 * Premium mobile content container
 * Provides max-width (480px) with side margins for better readability
 * Following Instagram/WhatsApp/Telegram mobile pattern
 */
export const MobileContentContainer: React.FC<MobileContentContainerProps> = ({
    children,
    className = '',
    fullWidth = false,
}) => {
    if (fullWidth) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div className={`max-w-[480px] mx-auto px-4 ${className}`}>
            {children}
        </div>
    );
};

export default MobileContentContainer;
