import React, { useState } from 'react';
import { useEventData } from '../../../contexts/EventDataContext';

import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { UserPlusIcon, ArrowPathIcon } from '../../Icons';
import { showSuccess, showError } from '../../../utils/toastHelpers';

const MobileAttendeeForm: React.FC = () => {
    const { addWalkInAttendee } = useEventData();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        organization: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.firstName || !formData.lastName || !formData.organization) {
            showError('First Name, Last Name, and Organization are required.');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await addWalkInAttendee({
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                organization: formData.organization
            });

            if (result.success) {
                showSuccess('Attendee added successfully!');
                setFormData({ firstName: '', lastName: '', email: '', organization: '' });
            } else {
                showError(result.message || 'Failed to add attendee.');
            }
        } catch (error) {
            showError('An unexpected error occurred.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 pb-20">
            <div className="px-1">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Add Attendee</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Quick add for walk-ins or missing profiles.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex gap-3">
                        <Input
                            label="First Name *"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="John"
                            className="text-base"
                            required
                        />
                        <Input
                            label="Last Name *"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Doe"
                            className="text-base"
                            required
                        />
                    </div>

                    <Input
                        label="Organization *"
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        placeholder="Company Ltd."
                        className="text-base"
                        required
                    />

                    <Input
                        label="Email (Optional)"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="text-base"
                    />

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        size="lg"
                        className="w-full mt-2 font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-transform"
                        leftIcon={isSubmitting ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <UserPlusIcon className="w-5 h-5" />}
                    >
                        {isSubmitting ? 'Adding...' : 'Add Attendee'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default MobileAttendeeForm;
