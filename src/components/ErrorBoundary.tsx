// src/components/ErrorBoundary.tsx
import React, { Component, ReactNode, ErrorInfo } from 'react';
import Alert from './ui/Alert';
import Button from './ui/Button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);

        // Store error details
        this.setState({
            error,
            errorInfo,
        });

        // TODO: Log to error tracking service (Sentry, LogRocket, etc.)
        // logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
                    <div className="max-w-md w-full">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                                <svg
                                    className="w-6 h-6 text-red-600 dark:text-red-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>

                            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                                Something went wrong
                            </h2>

                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                                We're sorry, but something unexpected happened. Please try again.
                            </p>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="mb-4 p-4 bg-gray-100 dark:bg-slate-700 rounded text-sm">
                                    <p className="font-mono text-red-600 dark:text-red-400 mb-2">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-40">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    onClick={this.handleReset}
                                    variant="primary"
                                    className="flex-1"
                                >
                                    Try Again
                                </Button>
                                <Button
                                    onClick={() => window.location.href = '/'}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    Go Home
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
