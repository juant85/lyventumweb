import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import Button from '../ui/Button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class MobileErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Mobile Error Boundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="close" className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>

                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Oops! Something went wrong
                        </h2>

                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 mb-4 text-left">
                                <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={this.handleReset}
                                variant="secondary"
                                className="flex-1"
                            >
                                Try Again
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                className="flex-1"
                            >
                                Refresh Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default MobileErrorBoundary;
