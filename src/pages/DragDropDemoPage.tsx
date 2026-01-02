import React from 'react';
import DraggableQuickActions from '../components/mobile/DraggableQuickActions';
import { Calendar, Users, BarChart3, Settings } from 'lucide-react';

const DragDropDemoPage: React.FC = () => {
    const demoCards = [
        {
            id: 'sessions',
            title: 'Event Sessions',
            icon: <Calendar className="w-5 h-5 text-primary-600" />,
            onClick: () => console.log('Sessions clicked')
        },
        {
            id: 'attendees',
            title: 'Attendees',
            icon: <Users className="w-5 h-5 text-primary-600" />,
            onClick: () => console.log('Attendees clicked')
        },
        {
            id: 'analytics',
            title: 'Analytics',
            icon: <BarChart3 className="w-5 h-5 text-primary-600" />,
            onClick: () => console.log('Analytics clicked')
        },
        {
            id: 'settings',
            title: 'Settings',
            icon: <Settings className="w-5 h-5 text-primary-600" />,
            onClick: () => console.log('Settings clicked')
        }
    ];

    const handleReorder = (newOrder: any[]) => {
        console.log('New order:', newOrder.map(c => c.title));
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
            <div className="max-w-md mx-auto">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    Drag & Drop Demo
                </h1>
                <DraggableQuickActions cards={demoCards} onReorder={handleReorder} />
            </div>
        </div>
    );
};

export default DragDropDemoPage;
