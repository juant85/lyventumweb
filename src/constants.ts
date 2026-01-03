import React from 'react';
import { AppRoute } from './types';
import { Feature } from './features';
import { localeKeys, LocaleKeys } from './i18n/locales';
import { IconName } from './components/ui';

export const APP_NAME = "LyVenTum";

export const NAVIGATION_LINKS: { category: LocaleKeys; links: { path: AppRoute; labelKey: LocaleKeys; title: string; icon: IconName; featureKey: Feature }[] }[] = [
  {
    category: localeKeys.navCategoryMyEvents,
    links: [
      { path: AppRoute.MyEvents, labelKey: localeKeys.navLinkMyEvents, title: "My Events Portal", icon: 'calendar', featureKey: Feature.MY_EVENTS },
    ]
  },
  {
    category: localeKeys.navCategoryCheckIn,
    links: [
      { path: AppRoute.CheckInDesk, labelKey: localeKeys.navLinkCheckInDesk, title: "Main Event Check-in", icon: 'registration', featureKey: Feature.CHECK_IN_DESK },
    ]
  },
  {
    category: localeKeys.navCategoryLiveOps,
    links: [
      { path: AppRoute.Dashboard, labelKey: localeKeys.navLinkDashboard, title: "Dashboard", icon: 'dashboard', featureKey: Feature.DASHBOARD },
      { path: AppRoute.DataVisualization, labelKey: localeKeys.navLinkVisualization, title: "Data Visualization", icon: 'visualize', featureKey: Feature.DATA_VISUALIZATION },
      { path: AppRoute.AttendeeLocator, labelKey: localeKeys.navLinkLocator, title: "Attendee Locator", icon: 'map', featureKey: Feature.ATTENDEE_LOCATOR },
    ]
  },
  {
    category: localeKeys.navCategoryAnalyze,
    links: [
      { path: AppRoute.Analytics, labelKey: localeKeys.navLinkAnalytics, title: "Analytics", icon: 'barChart', featureKey: Feature.ANALYTICS },
      { path: AppRoute.Reports, labelKey: localeKeys.navLinkReports, title: "Reports", icon: 'fileText', featureKey: Feature.REPORTS },
      { path: AppRoute.EmailCommunications, labelKey: localeKeys.navLinkEmailCommunications, title: "Email Communications", icon: 'mail', featureKey: Feature.EMAIL_COMMUNICATIONS },
    ]
  },
  {
    category: localeKeys.navCategoryManage,
    links: [
      { path: AppRoute.AttendeeProfiles, labelKey: localeKeys.navLinkAttendeeProfiles, title: "Attendee Profiles", icon: 'users', featureKey: Feature.ATTENDEE_PROFILES },
      { path: AppRoute.VendorProfiles, labelKey: localeKeys.navLinkVendorStaff, title: "Vendor Staff Profiles", icon: 'briefcase', featureKey: Feature.VENDOR_PROFILES },
      { path: AppRoute.DataEditor, labelKey: localeKeys.navLinkDataEditor, title: "Data Editor", icon: 'database', featureKey: Feature.DATA_EDITOR },
    ]
  },
  {
    category: localeKeys.navCategoryConfigure,
    links: [
      { path: AppRoute.SessionSettings, labelKey: localeKeys.navLinkSessions, title: "Sessions", icon: 'calendar', featureKey: Feature.SESSION_SETTINGS },
      { path: AppRoute.BoothSetup, labelKey: localeKeys.navLinkBooths, title: "Booths", icon: 'store', featureKey: Feature.BOOTH_SETUP },
      { path: AppRoute.AccessCodes, labelKey: localeKeys.navLinkAccessCodes, title: "Access Codes", icon: 'qrCode', featureKey: Feature.ACCESS_CODES },
      { path: AppRoute.EmailSettings, labelKey: localeKeys.navLinkEmailSettings, title: "Email Settings", icon: 'settings', featureKey: Feature.EMAIL_SETTINGS },
      { path: AppRoute.TracksSettings, labelKey: localeKeys.navLinkTracks, title: "Tracks", icon: 'layers', featureKey: Feature.TRACKS },
    ]
  },
  {
    category: localeKeys.navCategoryImport,
    links: [
      { path: AppRoute.MasterImport, labelKey: localeKeys.navLinkMasterImport, title: "Master Import", icon: 'upload', featureKey: Feature.MASTER_IMPORT },
      { path: AppRoute.AttendeeImport, labelKey: localeKeys.navLinkAttendeeImport, title: "Attendee Import", icon: 'userPlus', featureKey: Feature.ATTENDEE_IMPORT },
      { path: AppRoute.Scanner, labelKey: localeKeys.navLinkScanner, title: "Scanner", icon: 'scan', featureKey: Feature.SCANNER },
    ]
  },
  {
    category: localeKeys.navCategorySuperAdmin,
    links: [
      { path: AppRoute.SuperAdminEvents, labelKey: localeKeys.navLinkManageEvents, title: "Manage All Events", icon: 'admin', featureKey: Feature.SUPER_ADMIN_PLANS },
      { path: '/admin/attendees' as AppRoute, labelKey: 'navLinkManageAttendees' as LocaleKeys, title: "All Attendees", icon: 'attendees', featureKey: Feature.SUPER_ADMIN_PLANS },
      { path: AppRoute.SuperAdminPlans, labelKey: localeKeys.navLinkManagePlans, title: "Manage Subscription Plans", icon: 'admin', featureKey: Feature.SUPER_ADMIN_PLANS },
      { path: AppRoute.SuperAdminClients, labelKey: 'navLinkManageCompanies', title: "Manage Companies", icon: 'sponsor', featureKey: Feature.SUPER_ADMIN_PLANS },
    ]
  }
];

export const DEFAULT_SESSION_CAPACITY = 5;