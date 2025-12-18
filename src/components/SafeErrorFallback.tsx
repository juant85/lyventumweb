import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

const SafeErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
                <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-red-900 mb-2">Something went wrong</h2>
                    <p className="text-red-700 text-sm">
                        We encountered an unexpected error efficiently.
                    </p>
                </div>

                <div className="p-6">
                    <div className="bg-slate-900 rounded-lg p-4 mb-6 overflow-auto max-h-48">
                        <code className="text-red-400 font-mono text-xs block whitespace-pre-wrap break-words">
                            {error.message}
                        </code>
                    </div>

                    <button
                        onClick={resetErrorBoundary}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Try Again
                    </button>

                    <div className="mt-4 text-center">
                        <a href="/" className="text-sm text-slate-500 hover:text-slate-700 underline">
                            Return to Home
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SafeErrorFallback;
