import React, { ReactNode } from 'react';
import Modal from './Modal';
import Button from './Button';
import { ArrowLeftIcon, ArrowRightIcon } from '../Icons';

export interface WizardStep {
    title: string;
    description?: string;
}

interface WizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    steps: WizardStep[];
    currentStep: number;
    onNext?: () => void;
    onBack?: () => void;
    onFinish?: () => void;
    children: ReactNode;
    isLoading?: boolean;
    canProceed?: boolean;
    finishLabel?: string;
}

/**
 * WizardModal - Multi-step wizard modal that extends the base Modal component.
 * Provides step indicator, navigation buttons, and content area for wizard flows.
 */
const WizardModal: React.FC<WizardModalProps> = ({
    isOpen,
    onClose,
    title,
    steps,
    currentStep,
    onNext,
    onBack,
    onFinish,
    children,
    isLoading = false,
    canProceed = true,
    finishLabel = 'Create'
}) => {
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;

    const handleNext = () => {
        if (isLastStep && onFinish) {
            onFinish();
        } else if (onNext) {
            onNext();
        }
    };

    // Step indicator component
    const StepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                    {/* Step circle */}
                    <div
                        className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                            ${index < currentStep
                                ? 'bg-green-500 text-white'
                                : index === currentStep
                                    ? 'bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-900'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }
                        `}
                    >
                        {index < currentStep ? '✓' : index + 1}
                    </div>
                    {/* Connector line */}
                    {index < steps.length - 1 && (
                        <div
                            className={`w-8 h-0.5 mx-1 ${index < currentStep
                                ? 'bg-green-500'
                                : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );

    // Current step header
    const StepHeader = () => (
        <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                {steps[currentStep]?.title}
            </h3>
            {steps[currentStep]?.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {steps[currentStep].description}
                </p>
            )}
        </div>
    );

    // Footer with navigation buttons
    const footerContent = (
        <div className="flex items-center justify-between w-full">
            <div>
                {!isFirstStep && (
                    <Button
                        variant="secondary"
                        onClick={onBack}
                        disabled={isLoading}
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-1" />
                        Back
                    </Button>
                )}
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleNext}
                    disabled={isLoading || !canProceed}
                >
                    {isLoading ? (
                        'Loading...'
                    ) : isLastStep ? (
                        finishLabel
                    ) : (
                        <>
                            Next
                            <ArrowRightIcon className="w-4 h-4 ml-1" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="lg"
            footerContent={footerContent}
        >
            <StepIndicator />
            <StepHeader />
            <div className="min-h-[200px]">
                {children}
            </div>
        </Modal>
    );
};

export default WizardModal;
