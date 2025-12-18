// src/components/reports/TemplateSelector.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { REPORT_TEMPLATES, ReportTemplate } from '../../utils/reportTemplates';
import Card from '../ui/Card';

interface TemplateSelectorProps {
    selectedTemplateId?: string;
    onSelectTemplate: (templateId: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    selectedTemplateId,
    onSelectTemplate,
}) => {
    const getColorClasses = (color: string, isSelected: boolean) => {
        const colors = {
            blue: {
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                border: 'border-blue-300 dark:border-blue-700',
                text: 'text-blue-700 dark:text-blue-300',
                icon: 'text-blue-600 dark:text-blue-400',
                button: 'bg-blue-600 hover:bg-blue-700',
            },
            purple: {
                bg: 'bg-purple-50 dark:bg-purple-900/20',
                border: 'border-purple-300 dark:border-purple-700',
                text: 'text-purple-700 dark:text-purple-300',
                icon: 'text-purple-600 dark:text-purple-400',
                button: 'bg-purple-600 hover:bg-purple-700',
            },
            green: {
                bg: 'bg-green-50 dark:bg-green-900/20',
                border: 'border-green-300 dark:border-green-700',
                text: 'text-green-700 dark:text-green-300',
                icon: 'text-green-600 dark:text-green-400',
                button: 'bg-green-600 hover:bg-green-700',
            },
        };

        return colors[color as keyof typeof colors] || colors.blue;
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-montserrat">
                    Select Report Template
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Choose a template based on your audience and reporting needs
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {REPORT_TEMPLATES.map((template, index) => {
                    const isSelected = selectedTemplateId === template.id;
                    const colorClasses = getColorClasses(template.color, isSelected);
                    const Icon = template.icon;

                    return (
                        <motion.div
                            key={template.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <Card
                                className={`relative cursor-pointer transition-all ${isSelected
                                        ? `${colorClasses.bg} ${colorClasses.border} border-2`
                                        : 'hover:border-slate-400 dark:hover:border-slate-600'
                                    }`}
                                onClick={() => onSelectTemplate(template.id)}
                            >
                                {isSelected && (
                                    <div className="absolute top-3 right-3">
                                        <div className={`${colorClasses.button} text-white rounded-full p-1`}>
                                            <Check className="w-4 h-4" />
                                        </div>
                                    </div>
                                )}

                                <div className="p-6">
                                    <div className={`inline-flex p-3 rounded-lg ${colorClasses.bg} mb-4`}>
                                        <Icon className={`w-8 h-8 ${colorClasses.icon}`} />
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 font-montserrat">
                                        {template.name}
                                    </h3>

                                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                        {template.description}
                                    </p>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500 dark:text-slate-400">Target:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                {template.targetAudience}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500 dark:text-slate-400">Sections:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                {template.sections.length}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500 dark:text-slate-400">Pages:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                ~{template.estimatedPages}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        className={`mt-4 w-full py-2 px-4 rounded-lg font-semibold text-white transition-colors ${isSelected
                                                ? `${colorClasses.button}`
                                                : 'bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'
                                            }`}
                                    >
                                        {isSelected ? 'Selected' : 'Select Template'}
                                    </button>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default TemplateSelector;
