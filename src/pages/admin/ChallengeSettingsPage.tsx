import React, { useState, useEffect } from 'react';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { challengeService, ChallengeConfig } from '../../services/challengeService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { toast } from 'react-hot-toast';
import { Trophy, Download, Users } from 'lucide-react';
import LeaderboardModal from '../../components/admin/LeaderboardModal';

export default function ChallengeSettingsPage() {
    const { currentEvent } = useSelectedEvent();
    const [config, setConfig] = useState<ChallengeConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // Form state
    const [enabled, setEnabled] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        loadConfig();
    }, [currentEvent]);

    const loadConfig = async () => {
        if (!currentEvent) return;

        try {
            setLoading(true);
            const data = await challengeService.getChallengeConfig(currentEvent.id);

            if (data) {
                setConfig(data);
                setEnabled(data.challenge_enabled);
                setTitle(data.challenge_title);
                setDescription(data.challenge_description);
            }
        } catch (e) {
            console.error('[ChallengeSettings] Error loading config:', e);
            toast.error('Error loading challenge configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!currentEvent) return;

        try {
            setSaving(true);

            const updatedConfig = await challengeService.updateChallengeConfig(
                currentEvent.id,
                {
                    challenge_enabled: enabled,
                    challenge_title: title,
                    challenge_description: description
                }
            );

            if (updatedConfig) {
                setConfig(updatedConfig);
                toast.success('Challenge configuration saved successfully!');
            }
        } catch (e) {
            console.error('[ChallengeSettings] Error saving:', e);
            toast.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">Loading configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Challenge Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Configure the booth challenge for attendees
                </p>
            </div>

            {/* Basic Settings Card */}
            <Card>
                <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Basic Settings
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Enable and customize the challenge
                            </p>
                        </div>
                    </div>

                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                            <label className="text-sm font-semibold text-gray-900 dark:text-white">
                                Enable Booth Challenge
                            </label>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Turn on the challenge feature for this event
                            </p>
                        </div>
                        <button
                            onClick={() => setEnabled(!enabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled
                                    ? 'bg-primary-600'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Title Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Challenge Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Booth Challenge"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* Description Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Visit booths to collect stamps and win prizes!"
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            This will be shown to attendees in the portal
                        </p>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full sm:w-auto"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Leaderboard & Analytics Card */}
            <Card>
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-secondary-600" />
                                Leaderboard & Analytics
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                View participant rankings and export data
                            </p>
                        </div>
                    </div>

                    {enabled ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Button
                                variant="secondary"
                                onClick={() => setShowLeaderboard(true)}
                            >
                                <Users className="w-4 h-4 mr-2" />
                                View Leaderboard
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setShowLeaderboard(true)}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export to CSV
                            </Button>
                        </div>
                    ) : (
                        <Alert
                            type="info"
                            message="Enable the challenge to view leaderboard and export data"
                        />
                    )}
                </div>
            </Card>

            {/* Leaderboard Modal */}
            {currentEvent && (
                <LeaderboardModal
                    isOpen={showLeaderboard}
                    onClose={() => setShowLeaderboard(false)}
                    eventId={currentEvent.id}
                />
            )}
        </div>
    );
}
