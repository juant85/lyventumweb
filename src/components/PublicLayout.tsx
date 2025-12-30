import React, { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import LanguageSwitcher from './LanguageSwitcher';

interface PublicLayoutProps {
    children: ReactNode;
}

/**
 * PublicLayout - Minimal layout wrapper for public (unauthenticated) pages
 * 
 * Features:
 * - Fixed language switcher in top-right corner
 * - Toast notifications
 * - Dark theme background (consistent with public pages)
 */
const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
    return (
        <div className="bg-slate-900">
            <Toaster position="top-center" reverseOrder={false} />

            {/* Fixed Language Switcher - Top Right Corner (hidden on very small screens) */}
            <div className="fixed top-4 right-4 z-50 hidden sm:block">
                <LanguageSwitcher />
            </div>

            <main>{children}</main>
        </div>
    );
};

export default PublicLayout;
