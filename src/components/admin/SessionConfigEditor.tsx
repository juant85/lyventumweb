// src/components/admin/SessionConfigEditor.tsx
// Component for editing session scanning configuration

import React, { useState, useEffect } from 'react';
import { SessionConfig, ScanningContext, SESSION_CONFIG_PRESETS, getScanningContextLabel, getScanningContextDescription, validateSessionConfig } from '../../types/sessionConfig';
import Select from '../ui/Select';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import { useBooths } from '../../contexts/booths';

interface SessionConfigEditorProps {
    config: Partial<SessionConfig>;
    onChange: (config: Partial<SessionConfig>) => void;
    disabled?: boolean;
}

const SessionConfigEditor: React.FC<SessionConfigEditorProps> = ({
    config,
    onChange,
    disabled = false,
}) => {
    const { booths } = useBooths();
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Validate on config change
    useEffect(() => {
        if (config.scanningContext) {
            const validation = validateSessionConfig(config);
            setValidationErrors(validation.errors);
        }
    }, [config]);

    const handleContextChange = (context: ScanningContext) => {
        // Apply preset when context changes
        const preset = SESSION_CONFIG_PRESETS[context];
        onChange({
            ...preset,
            scanningContext: context,
        });
    };

    const handleFieldChange = (field: keyof SessionConfig, value: any) => {
        onChange({
            ...config,
            [field]: value,
        });
    };

    const boothOptions = booths.map(b => ({
        value: b.id,
        label: `${b.physicalId} - ${b.companyName}`,
    }));

    return (
        <div className="space-y-6">
            {/* Scanning Context Selector */}
            <div>
                <Select
                    label="Session Type & Scanning Context"
                    value={config.scanningContext || 'booth_meeting'}
                    onChange={(e) => handleContextChange(e.target.value as ScanningContext)}
                    disabled={disabled}
                    options={[
                        { value: 'booth_meeting', label: getScanningContextLabel('booth_meeting') },
                        { value: 'presentation', label: getScanningContextLabel('presentation') },
                        { value: 'lead_capture', label: getScanningContextLabel('lead_capture') },
                        { value: 'open_attendance', label: getScanningContextLabel('open_attendance') },
                        { value: 'networking', label: getScanningContextLabel('networking') },
                        { value: 'custom', label: getScanningContextLabel('custom') },
                    ]}
                />
                {config.scanningContext && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        {getScanningContextDescription(config.scanningContext)}
                    </p>
                )}
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <Alert type="error" message={
                    <div>
                        <strong>Configuration Errors:</strong>
                        <ul className="list-disc list-inside mt-2">
                            {validationErrors.map((err, idx) => (
                                <li key={idx}>{err}</li>
                            ))}
                        </ul>
                    </div>
                } />
            )}

            {/* Context-Specific Configuration */}
            {config.scanningContext === 'booth_meeting' && (
                <Card title="Booth Meeting Configuration" className="bg-blue-50 dark:bg-blue-900/10">
                    <div className="space-y-4">
                        {/* Booth Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Select Booths for this Session
                            </label>
                            <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                                {booths.map(booth => (
                                    <label key={booth.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded">
                                        <input
                                            type="checkbox"
                                            checked={config.boothIds?.includes(booth.id) || false}
                                            onChange={(e) => {
                                                const current = config.boothIds || [];
                                                const updated = e.target.checked
                                                    ? [...current, booth.id]
                                                    : current.filter(id => id !== booth.id);
                                                handleFieldChange('boothIds', updated);
                                            }}
                                            disabled={disabled}
                                            className="h-4 w-4 text-primary-600 rounded"
                                        />
                                        <span className="text-sm font-medium">{booth.physicalId}</span>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">- {booth.companyName}</span>
                                    </label>
                                ))}
                            </div>
                            {(config.boothIds?.length || 0) > 0 && (
                                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                                    ✓ {config.boothIds?.length} booth(s) selected
                                </p>
                            )}
                        </div>

                        {/* Pre-assignment Required */}
                        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <input
                                type="checkbox"
                                id="requires-pre-assignment"
                                checked={config.requiresPreAssignment !== false}
                                onChange={(e) => handleFieldChange('requiresPreAssignment', e.target.checked)}
                                disabled={disabled}
                                className="h-5 w-5 text-primary-600 rounded"
                            />
                            <label htmlFor="requires-pre-assignment" className="text-sm font-medium cursor-pointer">
                                Require pre-assignment (recommended for booth meetings)
                            </label>
                        </div>

                        <Alert type="info" message="Attendees will only be able to scan at their assigned booth. The system will show 'WRONG_BOOTH' if they scan elsewhere." />
                    </div>
                </Card>
            )}

            {config.scanningContext === 'presentation' && (
                <Card title="Presentation Configuration" className="bg-purple-50 dark:bg-purple-900/10">
                    <div className="space-y-4">
                        {/* Location */}
                        <Input
                            label="Location/Room"
                            value={config.location || ''}
                            onChange={(e) => handleFieldChange('location', e.target.value)}
                            placeholder="e.g., Main Hall, Room A"
                            disabled={disabled}
                        />

                        {/* Speaker */}
                        <Input
                            label="Speaker (optional)"
                            value={config.speaker || ''}
                            onChange={(e) => handleFieldChange('speaker', e.target.value)}
                            placeholder="e.g., Jane Smith, CEO"
                            disabled={disabled}
                        />

                        {/* Capacity */}
                        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <input
                                type="checkbox"
                                id="has-capacity"
                                checked={config.hasCapacity || false}
                                onChange={(e) => handleFieldChange('hasCapacity', e.target.checked)}
                                disabled={disabled}
                                className="h-5 w-5 text-primary-600 rounded"
                            />
                            <label htmlFor="has-capacity" className="text-sm font-medium cursor-pointer">
                                Enable capacity limit
                            </label>
                        </div>

                        {config.hasCapacity && (
                            <Input
                                type="number"
                                label="Maximum Capacity"
                                value={config.maxCapacity || ''}
                                onChange={(e) => handleFieldChange('maxCapacity', parseInt(e.target.value) || undefined)}
                                placeholder="e.g., 500"
                                disabled={disabled}
                                min={1}
                            />
                        )}

                        <Alert type="info" message="Attendees can check-in freely. Capacity is tracked but not enforced by the scanner." />
                    </div>
                </Card>
            )}

            {config.scanningContext === 'lead_capture' && (
                <Card title="Lead Capture Configuration" className="bg-green-50 dark:bg-green-900/10">
                    <div className="space-y-4">
                        {/* Station Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Select Lead Capture Stations
                            </label>
                            <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                                {booths.map(booth => (
                                    <label key={booth.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded">
                                        <input
                                            type="checkbox"
                                            checked={config.boothIds?.includes(booth.id) || false}
                                            onChange={(e) => {
                                                const current = config.boothIds || [];
                                                const updated = e.target.checked
                                                    ? [...current, booth.id]
                                                    : current.filter(id => id !== booth.id);
                                                handleFieldChange('boothIds', updated);
                                            }}
                                            disabled={disabled}
                                            className="h-4 w-4 text-primary-600 rounded"
                                        />
                                        <span className="text-sm font-medium">{booth.physicalId}</span>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">- {booth.companyName}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Lead Form Settings */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
                            <h4 className="text-sm font-semibold mb-3">Lead Form Fields</h4>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.leadForm?.collectEmail !== false}
                                        onChange={(e) => handleFieldChange('leadForm', {
                                            ...config.leadForm,
                                            collectEmail: e.target.checked
                                        })}
                                        disabled={disabled}
                                        className="h-4 w-4 text-primary-600 rounded"
                                    />
                                    <span className="text-sm">Collect Email</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.leadForm?.collectPhone || false}
                                        onChange={(e) => handleFieldChange('leadForm', {
                                            ...config.leadForm,
                                            collectPhone: e.target.checked
                                        })}
                                        disabled={disabled}
                                        className="h-4 w-4 text-primary-600 rounded"
                                    />
                                    <span className="text-sm">Collect Phone</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.leadForm?.collectNotes || false}
                                        onChange={(e) => handleFieldChange('leadForm', {
                                            ...config.leadForm,
                                            collectNotes: e.target.checked
                                        })}
                                        disabled={disabled}
                                        className="h-4 w-4 text-primary-600 rounded"
                                    />
                                    <span className="text-sm">Collect Notes</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.leadForm?.collectCompany || false}
                                        onChange={(e) => handleFieldChange('leadForm', {
                                            ...config.leadForm,
                                            collectCompany: e.target.checked
                                        })}
                                        disabled={disabled}
                                        className="h-4 w-4 text-primary-600 rounded"
                                    />
                                    <span className="text-sm">Collect Company</span>
                                </label>
                            </div>
                        </div>

                        <Alert type="info" message="Walk-ins are allowed. Exhibitors can capture leads by scanning QR codes and filling the form." />
                    </div>
                </Card>
            )}

            {(config.scanningContext === 'open_attendance' || config.scanningContext === 'networking') && (
                <Card title="Attendance Configuration" className="bg-slate-50 dark:bg-slate-800">
                    <Alert
                        type="success"
                        message={
                            <div>
                                <strong>Simple Attendance Tracking</strong>
                                <p className="mt-1 text-sm">This session uses open attendance. Anyone can scan to check-in - no validations or restrictions.</p>
                            </div>
                        }
                    />
                </Card>
            )}

            {/* Reminder Settings (for all types) */}
            {config.scanningContext !== 'open_attendance' && (
                <Card title="Reminder Settings" className="bg-slate-50 dark:bg-slate-800">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="send-reminders"
                                checked={config.sendReminders || false}
                                onChange={(e) => handleFieldChange('sendReminders', e.target.checked)}
                                disabled={disabled}
                                className="h-5 w-5 text-primary-600 rounded"
                            />
                            <label htmlFor="send-reminders" className="text-sm font-medium cursor-pointer">
                                Send reminder notifications before session
                            </label>
                        </div>

                        {config.sendReminders && (
                            <div className="ml-8 text-sm text-slate-600 dark:text-slate-400">
                                <p>Reminders will be sent at:</p>
                                <ul className="list-disc list-inside mt-1">
                                    <li>60 minutes before session</li>
                                    <li>15 minutes before session</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default SessionConfigEditor;
