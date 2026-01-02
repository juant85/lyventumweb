// src/types/dashboard.ts
import { AppRoute } from '../types';

export type CardCategory = 'manage' | 'configure' | 'analyze' | 'tools';

export interface QuickActionCard {
    id: string;
    label: string;
    icon: string; // lucide icon name or Icon component name
    route: AppRoute;
    category: CardCategory;
    color?: string;
    order: number;
    enabled: boolean;
}

export interface DashboardPreferences {
    userId?: string;
    cards: QuickActionCard[];
    lastModified: string;
    version: number;
}
