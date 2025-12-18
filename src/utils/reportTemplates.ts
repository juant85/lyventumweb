// src/utils/reportTemplates.ts
import { FileText, FileBarChart, Award } from 'lucide-react';

export enum ReportSection {
    OVERVIEW = 'overview',
    ATTENDANCE = 'attendance',
    BOOTH_PERFORMANCE = 'booth_performance',
    SESSION_BREAKDOWN = 'session_breakdown',
    ENGAGEMENT = 'engagement',
    LEAD_GENERATION = 'lead_generation',
    CHARTS = 'charts',
}

export interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    icon: any; // Lucide icon component
    sections: ReportSection[];
    estimatedPages: number;
    targetAudience: string;
    color: string;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
    {
        id: 'executive',
        name: 'Executive Summary',
        description: 'High-level overview with key metrics and insights. Perfect for stakeholders and leadership.',
        icon: FileText,
        sections: [
            ReportSection.OVERVIEW,
            ReportSection.ATTENDANCE,
            ReportSection.CHARTS,
        ],
        estimatedPages: 2,
        targetAudience: 'Executives, Leadership',
        color: 'blue',
    },
    {
        id: 'detailed',
        name: 'Detailed Report',
        description: 'Comprehensive analysis with all metrics, booth-by-booth breakdown, and charts.',
        icon: FileBarChart,
        sections: [
            ReportSection.OVERVIEW,
            ReportSection.ATTENDANCE,
            ReportSection.BOOTH_PERFORMANCE,
            ReportSection.SESSION_BREAKDOWN,
            ReportSection.ENGAGEMENT,
            ReportSection.CHARTS,
        ],
        estimatedPages: 6,
        targetAudience: 'Event Managers, Analysts',
        color: 'purple',
    },
    {
        id: 'sponsor',
        name: 'Sponsor Report',
        description: 'Focused on booth performance, lead generation, and ROI metrics for sponsors.',
        icon: Award,
        sections: [
            ReportSection.BOOTH_PERFORMANCE,
            ReportSection.LEAD_GENERATION,
            ReportSection.ENGAGEMENT,
            ReportSection.CHARTS,
        ],
        estimatedPages: 4,
        targetAudience: 'Sponsors, Exhibitors',
        color: 'green',
    },
];

export interface ReportSectionConfig {
    section: ReportSection;
    title: string;
    description: string;
    includeChart: boolean;
}

export const SECTION_CONFIGS: Record<ReportSection, ReportSectionConfig> = {
    [ReportSection.OVERVIEW]: {
        section: ReportSection.OVERVIEW,
        title: 'Event Overview',
        description: 'Summary of event attendance and key statistics',
        includeChart: false,
    },
    [ReportSection.ATTENDANCE]: {
        section: ReportSection.ATTENDANCE,
        title: 'Attendance Analysis',
        description: 'Check-in rates, session participation, and trends',
        includeChart: true,
    },
    [ReportSection.BOOTH_PERFORMANCE]: {
        section: ReportSection.BOOTH_PERFORMANCE,
        title: 'Booth Performance',
        description: 'Booth traffic, engagement metrics, and rankings',
        includeChart: true,
    },
    [ReportSection.SESSION_BREAKDOWN]: {
        section: ReportSection.SESSION_BREAKDOWN,
        title: 'Session Breakdown',
        description: 'Per-session attendance and completion rates',
        includeChart: true,
    },
    [ReportSection.ENGAGEMENT]: {
        section: ReportSection.ENGAGEMENT,
        title: 'Attendee Engagement',
        description: 'Scan patterns, time spent, and interaction levels',
        includeChart: true,
    },
    [ReportSection.LEAD_GENERATION]: {
        section: ReportSection.LEAD_GENERATION,
        title: 'Lead Generation',
        description: 'Scan counts per booth, unique visitors, and lead quality',
        includeChart: true,
    },
    [ReportSection.CHARTS]: {
        section: ReportSection.CHARTS,
        title: 'Visual Analytics',
        description: 'Charts and graphs for key metrics',
        includeChart: true,
    },
};

export function getTemplateById(id: string): ReportTemplate | undefined {
    return REPORT_TEMPLATES.find(t => t.id === id);
}

export function getSectionsForTemplate(templateId: string): ReportSectionConfig[] {
    const template = getTemplateById(templateId);
    if (!template) return [];

    return template.sections.map(section => SECTION_CONFIGS[section]);
}
