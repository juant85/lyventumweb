import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ContactFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({ isOpen, onClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const response = await fetch('https://formspree.io/f/xrezgzpg', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                setIsSuccess(true);
                form.reset();
                setTimeout(() => {
                    onClose();
                    setIsSuccess(false);
                }, 3000);
            }
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-lg w-full relative overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Header - Mobile optimized */}
                            <div className="relative bg-gradient-to-br from-primary-600 to-indigo-600 px-4 sm:px-6 py-5 sm:py-6 text-center flex-shrink-0">
                                <button
                                    onClick={onClose}
                                    className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 rounded-full hover:bg-white/20 transition-colors touch-manipulation"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Get in Touch</h2>
                                <p className="text-sm sm:text-base text-primary-100">Let's discuss how LyVentum can transform your events</p>
                            </div>

                            {/* Form - Mobile optimized with scroll */}
                            <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
                                {isSuccess ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-8"
                                    >
                                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                                        <p className="text-slate-400">We'll get back to you shortly.</p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                                        {/* Name */}
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-slate-200 mb-1.5">
                                                Your Name *
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                required
                                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all touch-manipulation"
                                                placeholder="John Doe"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-1.5">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                required
                                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all touch-manipulation"
                                                placeholder="john@company.com"
                                            />
                                        </div>

                                        {/* Organization */}
                                        <div>
                                            <label htmlFor="organization" className="block text-sm font-medium text-slate-200 mb-1.5">
                                                Company / Organization
                                            </label>
                                            <input
                                                type="text"
                                                id="organization"
                                                name="organization"
                                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all touch-manipulation"
                                                placeholder="Acme Corp"
                                            />
                                        </div>

                                        {/* Plan Interest */}
                                        <div>
                                            <label htmlFor="interest" className="block text-sm font-medium text-slate-200 mb-1.5">
                                                Interested In
                                            </label>
                                            <select
                                                id="interest"
                                                name="interest"
                                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all touch-manipulation"
                                            >
                                                <option value="">Select a plan...</option>
                                                <option value="essentials">Essentials Plan</option>
                                                <option value="professional">Professional Plan</option>
                                                <option value="enterprise">Enterprise Plan</option>
                                                <option value="demo">Just want a demo</option>
                                            </select>
                                        </div>

                                        {/* Message */}
                                        <div>
                                            <label htmlFor="message" className="block text-sm font-medium text-slate-200 mb-1.5">
                                                Tell us about your event
                                            </label>
                                            <textarea
                                                id="message"
                                                name="message"
                                                rows={3}
                                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none touch-manipulation sm:rows-4"
                                                placeholder="Number of attendees, event type, specific needs..."
                                            />
                                        </div>

                                        {/* Submit Button - Mobile optimized */}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold py-3 sm:py-3.5 px-6 rounded-lg hover:from-primary-500 hover:to-indigo-500 transition-all shadow-lg shadow-primary-500/50 hover:shadow-primary-500/70 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
                                        >
                                            {isSubmitting ? 'Sending...' : 'Send Request'}
                                        </button>

                                        <p className="text-xs text-slate-500 text-center mt-4">
                                            We respect your privacy. Your information will never be shared.
                                        </p>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
