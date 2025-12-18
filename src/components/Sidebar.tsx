import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAVIGATION_LINKS, APP_NAME } from '../constants';
import { User } from '../types';
import { useChat } from '../contexts/ChatContext';
import { useFeatureFlags } from '../contexts/FeatureFlagContext';
import LyVentumLogo from './Logo';
import { useLanguage } from '../contexts/LanguageContext';
import { Icon, IconName } from './ui';

const SidebarSkeleton: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <aside className={`fixed top-0 left-0 z-50 w-64 h-screen bg-slate-950 border-r border-white/5 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
    <div className="h-full flex flex-col p-4">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse"></div>
        <div className="h-4 w-24 bg-white/5 rounded animate-pulse"></div>
      </div>

      {/* Nav Skeleton */}
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-3 w-16 bg-white/5 rounded ml-3 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-10 w-full bg-white/5 rounded-lg animate-pulse"></div>
              <div className="h-10 w-full bg-white/5 rounded-lg animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </aside>
);

const Sidebar: React.FC<{ isOpen: boolean; currentUser: User | null }> = ({ isOpen, currentUser }) => {
  const location = useLocation();
  const { totalUnreadCount, openChatPanel } = useChat();
  const { isFeatureEnabled, isLoading } = useFeatureFlags();
  const { t } = useLanguage();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const visibleNavigationLinks = React.useMemo(() => {
    if (isLoading) return [];

    return NAVIGATION_LINKS
      .filter(group => {
        const categoryName = group.category;
        const isSuperAdminCategory = categoryName === 'navCategorySuperAdmin';
        if (isSuperAdminCategory) {
          return currentUser?.role === 'superadmin';
        }
        return true;
      })
      .map(group => ({
        ...group,
        links: group.links.filter(link => 'featureKey' in link ? isFeatureEnabled(link.featureKey) : true)
      }))
      .filter(group => group.links.length > 0);
  }, [isFeatureEnabled, isLoading, currentUser]);

  useEffect(() => {
    if (isLoading) return;
    const currentLink = visibleNavigationLinks.flatMap(group => group.links).find(link =>
      (link.path === '/dashboard' && location.pathname === link.path) ||
      (link.path !== '/dashboard' && location.pathname.startsWith(link.path))
    );
    if (currentLink) {
      const parentCategory = visibleNavigationLinks.find(group => group.links.includes(currentLink));
      if (parentCategory && parentCategory.links.length > 1) {
        setOpenSections(prevSections => {
          const categoryName = t(parentCategory.category);
          if (prevSections.has(categoryName)) return prevSections;
          const newSections = new Set(prevSections);
          newSections.add(categoryName);
          return newSections;
        });
      }
    }
  }, [location.pathname, visibleNavigationLinks, isLoading, t]);

  const toggleSection = (category: string) => {
    setOpenSections(prevSections => {
      const newSections = new Set(prevSections);
      if (newSections.has(category)) {
        newSections.delete(category);
      } else {
        newSections.add(category);
      }
      return newSections;
    });
  };

  if (isLoading) {
    return <SidebarSkeleton isOpen={isOpen} />;
  }

  if (!currentUser) return null;

  return (
    <aside
      className={`
        fixed top-0 left-0 z-50 h-screen w-64
        bg-[#0B1120] border-r border-white/5
        shadow-2xl shadow-black/50
        transition-all duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}
    >
      <div className="h-full flex flex-col">
        {/* Brand Header */}
        <div className="px-6 py-8 mb-2 flex justify-center">
          <Link to="/" className="group flex flex-col items-center gap-3 transition-transform hover:scale-[1.02]">
            <div className="relative flex items-center justify-center p-2 mb-0.5">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/20 to-primary-500/0 blur-2xl transition-opacity duration-700 group-hover:opacity-100 opacity-40"></div>
              <LyVentumLogo className="h-11 w-auto relative z-10 text-white drop-shadow-[0_0_15px_rgba(14,165,233,0.15)] transition-all duration-300 group-hover:drop-shadow-[0_0_20px_rgba(14,165,233,0.3)]" />
            </div>

            <div className="flex flex-col items-center text-center">
              <span className="text-xl font-bold tracking-tight text-white font-montserrat leading-none">
                {APP_NAME}
              </span>
              <span className="text-[10px] font-medium tracking-[0.3em] text-primary-400 uppercase mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                Workspace
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {visibleNavigationLinks.map(group => {
            const categoryName = t(group.category);
            const isSingleLink = group.links.length === 1;

            if (isSingleLink) {
              const link = group.links[0];
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));

              return (
                <div key={link.path}>
                  <div className="px-3 mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase font-montserrat">
                    {categoryName}
                  </div>
                  <Link
                    to={link.path}
                    title={link.title}
                    className={`
                      relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-r from-primary-600/20 to-primary-600/5 text-primary-200 shadow-inner border border-white/5'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    )}
                    <Icon
                      name={link.icon}
                      className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <span className="truncate">{t(link.labelKey)}</span>
                  </Link>
                </div>
              );
            }

            return (
              <div key={categoryName} className="space-y-1">
                <button
                  onClick={() => toggleSection(categoryName)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold tracking-wider text-left text-slate-500 uppercase font-montserrat hover:text-slate-300 transition-colors group"
                >
                  <span>{categoryName}</span>
                  <Icon
                    name={openSections.has(categoryName) ? 'chevronUp' : 'chevronDown'}
                    className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all text-slate-500"
                  />
                </button>

                <div className={`space-y-1 overflow-hidden transition-all duration-300 origin-top ${openSections.has(categoryName) ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {group.links.map(link => {
                    const isActive = (link.path === '/dashboard' ? location.pathname === link.path : location.pathname.startsWith(link.path));

                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        title={link.title}
                        className={`
                          relative group flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all duration-200
                          ${isActive
                            ? 'bg-gradient-to-r from-primary-600/20 to-primary-600/5 text-primary-200 shadow-inner border border-white/5'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }
                        `}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        )}
                        <Icon
                          name={link.icon}
                          className={`w-4 h-4 transition-colors ${isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                          strokeWidth={isActive ? 2 : 1.5}
                        />
                        <span className="truncate">{t(link.labelKey)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="p-4 border-t border-white/5 bg-slate-950/50 backdrop-blur-xl">
          <button
            onClick={() => openChatPanel()}
            className="group relative flex items-center justify-between w-full p-3 rounded-xl bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-white/5 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors"></div>

            <div className="relative flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 group-hover:scale-110 transition-all duration-300">
                  <Icon name="chat" className="w-4 h-4" />
                </div>
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-[#0B1120]">
                    {totalUnreadCount}
                  </span>
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white group-hover:text-indigo-200 transition-colors">Messages</p>
                <p className="text-[10px] text-slate-400 group-hover:text-slate-300">Team Communication</p>
              </div>
            </div>

            <Icon name="chevronDown" className="w-4 h-4 text-slate-500 -rotate-90 group-hover:text-indigo-400 transition-colors relative" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;