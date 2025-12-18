// src/components/reports/TemplatePreview.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle } from 'lucide-react';
import { ReportTemplate, getSectionsForTemplate, SECTION_CONFIGS } from '../../utils/reportTemplates';

interface TemplatePreviewProps {
    template: ReportTemplate;
    onEdit: () => void;
    onGenerate: () => void;
    isGenerating?: boolean;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
    template,
    onEdit,
    onGenerate,
    isGenerating = false,
}) => {
    const sections = getSectionsForTemplate(template.id);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-montserrat">
                        Preview: {template.name}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Review the sections that will be included in your report
                    </p>
                </div>
                <button
                    onClick={onEdit}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    Change Template
                </button>
            </div>

            {/* Template Info */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Target Audience</p>
                        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            {template.targetAudience}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sections</p>
                        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            {template.sections.length} sections
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Estimated Length</p>
                        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            {template.estimatedPages} pages
                        </p>
                    </div>
                </div>
            </div>

            {/* Sections List */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 font-montserrat">
                    Report Sections
                </h3>
                <div className="space-y-3">
                    {sections.map((sectionConfig, index) => (
                        <motion.div
                            key={sectionConfig.section}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex-shrink-0 mt-1">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                                    {sectionConfig.title}
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                    {sectionConfig.description}
                                </p>
                                {sectionConfig.includeChart && (
                                    <span className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400">
                                        <FileText className="w-3 h-3" />
                                        Includes charts and visualizations
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={onEdit}
                    className="px-6 py-2.5 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    Back to Templates
                </button>
                <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="px-6 py-2.5 font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isGenerating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <FileText className="w-4 h-4" />
                            Generate Report
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

export default TemplatePreview;
