import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { BellAlertIcon, CheckCircleIcon, XMarkIcon } from '../Icons';
import haptics from '../../utils/haptics';

const NotificationSettings: React.FC = () => {
    const {
        isSupported,
        hasPermission,
        isSubscribed,
        isLoading,
        requestPermission,
        subscribe,
        unsubscribe,
        showTestNotification
    } = useNotifications();

    if (!isSupported) {
        return (
            <Card title="Push Notifications" icon={<BellAlertIcon className="w-6 h-6" />}>
                <div className="text-center py-6">
                    <p className="text-slate-600 dark:text-slate-400">
                        Push notifications are not supported in this browser.
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                        Try using Chrome on Android or Safari on iOS (PWA mode).
                    </p>
                </div>
            </Card>
        );
    }

    const handleEnable = async () => {
        haptics.light();

        if (!hasPermission) {
            const granted = await requestPermission();
            if (!granted) {
                haptics.error();
                return;
            }
            haptics.success();
        }

        const subscribed = await subscribe();
        if (subscribed) {
            haptics.success();
        } else {
            haptics.error();
        }
    };

    const handleDisable = async () => {
        haptics.light();
        const success = await unsubscribe();
        if (success) {
            haptics.success();
        } else {
            haptics.error();
        }
    };

    const handleTest = () => {
        haptics.light();
        showTestNotification();
    };

    return (
        <Card title="Push Notifications" icon={<BellAlertIcon className="w-6 h-6 text-primary-500" />}>
            <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                        {isSubscribed ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                            <XMarkIcon className="w-5 h-5 text-slate-400" />
                        )}
                        <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {isSubscribed ? 'Enabled' : 'Disabled'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {isSubscribed
                                    ? 'You will receive real-time alerts'
                                    : 'Enable to get real-time alerts'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p className="mb-2">Get notified about:</p>
                    <ul className="space-y-1 ml-4">
                        <li className="flex items-start">
                            <span className="text-primary-500 mr-2">•</span>
                            <span>Sessions starting soon</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-primary-500 mr-2">•</span>
                            <span>VIP attendees checking in</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-primary-500 mr-2">•</span>
                            <span>Booths reaching capacity</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-primary-500 mr-2">•</span>
                            <span>Important system alerts</span>
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {isSubscribed ? (
                        <>
                            <Button
                                variant="neutral"
                                size="md"
                                onClick={handleDisable}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                Disable
                            </Button>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleTest}
                                className="flex-1"
                            >
                                Test
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={handleEnable}
                            disabled={isLoading}
                            leftIcon={<BellAlertIcon className="w-4 h-4" />}
                            className="w-full"
                        >
                            {isLoading ? 'Enabling...' : 'Enable Notifications'}
                        </Button>
                    )}
                </div>

                {/* Privacy note */}
                <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
                    Your notification preferences are stored securely. You can disable at any time.
                </p>
            </div>
        </Card>
    );
};

export default NotificationSettings;
