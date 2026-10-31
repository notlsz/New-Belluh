import { useI18n, useUi } from '../i18n';
import shell from '../i18n/ui/shell';
import DragonflyMark from './DragonflyMark';
import React from 'react';
import { BookHeart, Sparkles, User, Plus, Infinity, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface TabBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onCompose: () => void;
  badges?: Record<string, boolean>;
  /** With a partner connected, the Belluh tab is "Us": the two of you and Belluh. */
  usTab?: boolean;
  /** Laptops: the side panel folded down to its icons. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const TabBar: React.FC<TabBarProps> = ({ currentTab, onTabChange, onCompose, badges = {}, usTab = false, collapsed = false, onToggleCollapse }) => {
  const tb = useI18n().d.app.tabs;
  const T = useUi(shell).tabs;
  const tabs = [
    { id: 'timeline', icon: BookHeart, label: tb.story }, // Main Home
    { id: 'compose', icon: Plus, label: tb.capture, isAction: true },
    usTab ? { id: 'ai-coach', icon: Infinity, label: tb.us } : { id: 'ai-coach', icon: Sparkles, label: tb.bella },
    { id: 'profile', icon: User, label: tb.me },
  ];

  // One nav for every screen size: a floating bar at the bottom on phones, a quiet sidebar on laptops
  return (
    <div className="fixed bottom-6 left-0 right-0 px-6 z-50 flex justify-center pointer-events-none lg:top-0 lg:bottom-0 lg:right-auto lg:w-[var(--sidebar-w,16rem)] lg:transition-[width] lg:duration-300 lg:px-0 lg:justify-start">
      <nav className={`pointer-events-auto rounded-[2.5rem] shadow-2xl shadow-slate-900/10 flex items-center justify-between px-3 py-3 max-w-[320px] w-full bg-white/90 backdrop-blur-xl border border-white shadow-[0_24px_50px_-20px_rgba(196,88,159,0.35)] lg:max-w-none lg:h-full lg:flex-col lg:items-stretch lg:justify-start lg:gap-1 lg:rounded-none lg:shadow-none lg:border-0 lg:border-r lg:border-belluh-100 lg:bg-belluh-50 lg:backdrop-blur-none ${collapsed ? 'lg:px-3' : 'lg:px-4'} lg:pt-7 lg:pb-6`}>
        <div className={`hidden lg:flex items-center gap-2 mb-7 order-first ${collapsed ? 'justify-center px-0' : 'px-3'}`}>
          <DragonflyMark size={28} />
          {!collapsed && <span className="font-serif text-[22px] font-bold tracking-tight text-[#9bbecb]" aria-hidden="true">Belluh</span>}
        </div>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                aria-label={tab.label}
                onClick={onCompose}
                className="mx-2 bg-gradient-to-br from-[#ee8fcc] via-[#c99bd6] to-[#7fb4c6] text-white w-14 h-14 rounded-full shadow-[0_14px_28px_-10px_rgba(196,88,159,0.7)] ring-4 ring-white flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 hover:scale-105 hover:bg-black group relative overflow-hidden lg:order-1 lg:mx-0 lg:mb-5 lg:w-full lg:h-11 lg:shadow-none lg:ring-0 lg:rounded-xl lg:hover:scale-100"
              >
                <Icon size={26} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-500 relative z-10 lg:w-[18px] lg:h-[18px]" />
                {!collapsed && <span className="hidden lg:inline text-sm font-bold relative z-10">{tb.write}</span>}
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? tab.label : undefined}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300 lg:order-2 lg:w-full lg:h-11 lg:flex-row ${collapsed ? 'lg:justify-center lg:px-0' : 'lg:justify-start lg:gap-3 lg:px-3'} lg:rounded-xl ${
                isActive ? `${tab.id === 'timeline' ? 'text-[#d65fa8]' : tab.id === 'ai-coach' ? 'text-[#3f8aa3]' : 'text-[#8b6fd0]'} lg:text-slate-900 lg:bg-white lg:shadow-[0_6px_20px_-12px_rgba(15,23,42,0.3)]` : 'text-slate-300 hover:text-slate-500 lg:text-slate-500 lg:hover:text-slate-900 lg:hover:bg-belluh-100'
              }`}
            >
              <Icon key={isActive ? 'on' : 'off'} size={25} strokeWidth={isActive ? 2.4 : 2} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.18 : 0} className={`lg:w-5 lg:h-5 ${isActive ? 'belluh-bounce-in lg:animate-none' : ''}`} />
              {!collapsed && <span className="hidden lg:inline text-[15px] font-medium">{tab.label}</span>}
              {badges[tab.id] && !isActive && (
                <span aria-label={T.newNote} className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#f0addd] rounded-full ring-2 ring-white lg:static lg:ml-auto lg:ring-0" />
              )}
            </button>
          );
        })}
        {onToggleCollapse && (
          <button onClick={onToggleCollapse} aria-label={collapsed ? T.expandPanel : T.collapsePanel} title={collapsed ? T.expand : T.collapse}
            className={`hidden lg:flex order-3 mt-auto h-10 items-center gap-3 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-belluh-100 transition-colors ${collapsed ? 'justify-center' : 'px-3'}`}>
            {collapsed ? <PanelLeftOpen size={19} /> : <><PanelLeftClose size={19} /><span className="text-sm font-medium">{tb.collapse}</span></>}
          </button>
        )}
      </nav>
    </div>
  );
};

export default TabBar;
