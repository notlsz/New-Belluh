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
  const tabs = [
    { id: 'timeline', icon: BookHeart, label: 'Story' }, // Main Home
    { id: 'compose', icon: Plus, label: 'Capture', isAction: true },
    usTab ? { id: 'ai-coach', icon: Infinity, label: 'Us' } : { id: 'ai-coach', icon: Sparkles, label: 'Belluh' },
    { id: 'profile', icon: User, label: 'Me' },
  ];

  // One nav for every screen size: a floating bar at the bottom on phones, a quiet sidebar on laptops
  return (
    <div className="fixed bottom-6 left-0 right-0 px-6 z-50 flex justify-center pointer-events-none lg:top-0 lg:bottom-0 lg:right-auto lg:w-[var(--sidebar-w,16rem)] lg:transition-[width] lg:duration-300 lg:px-0 lg:justify-start">
      <nav className={`pointer-events-auto rounded-[2.5rem] shadow-2xl shadow-slate-900/10 flex items-center justify-between px-3 py-3 max-w-[320px] w-full bg-belluh-25 backdrop-blur-xl border border-belluh-100 lg:max-w-none lg:h-full lg:flex-col lg:items-stretch lg:justify-start lg:gap-1 lg:rounded-none lg:shadow-none lg:border-0 lg:border-r lg:border-belluh-100 lg:bg-belluh-50 lg:backdrop-blur-none ${collapsed ? 'lg:px-3' : 'lg:px-4'} lg:pt-7 lg:pb-6`}>
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
                className="mx-2 bg-slate-900 text-white w-14 h-14 rounded-full shadow-lg shadow-slate-900/30 flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 hover:scale-105 hover:bg-black group relative overflow-hidden lg:order-1 lg:mx-0 lg:mb-5 lg:w-full lg:h-11 lg:shadow-none lg:hover:scale-100"
              >
                <Icon size={26} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-500 relative z-10 lg:w-[18px] lg:h-[18px]" />
                {!collapsed && <span className="hidden lg:inline text-sm font-bold relative z-10">Write</span>}
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
                isActive ? 'text-slate-900 lg:bg-white lg:shadow-[0_6px_20px_-12px_rgba(15,23,42,0.3)]' : 'text-slate-300 hover:text-slate-500 lg:text-slate-500 lg:hover:text-slate-900 lg:hover:bg-belluh-100'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={`transition-all duration-300 lg:w-5 lg:h-5 ${isActive ? 'scale-110 lg:scale-100' : 'scale-100'}`} />
              {!collapsed && <span className="hidden lg:inline text-[15px] font-medium">{tab.label}</span>}
              {isActive && (
                <span className="absolute -bottom-2 w-1 h-1 bg-belluh-300 rounded-full animate-scale-in lg:hidden" />
              )}
              {badges[tab.id] && !isActive && (
                <span aria-label="New note" className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#f0addd] rounded-full ring-2 ring-white lg:static lg:ml-auto lg:ring-0" />
              )}
            </button>
          );
        })}
        {onToggleCollapse && (
          <button onClick={onToggleCollapse} aria-label={collapsed ? 'Expand side panel' : 'Collapse side panel'} title={collapsed ? 'Expand' : 'Collapse'}
            className={`hidden lg:flex order-3 mt-auto h-10 items-center gap-3 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-belluh-100 transition-colors ${collapsed ? 'justify-center' : 'px-3'}`}>
            {collapsed ? <PanelLeftOpen size={19} /> : <><PanelLeftClose size={19} /><span className="text-sm font-medium">Collapse</span></>}
          </button>
        )}
      </nav>
    </div>
  );
};

export default TabBar;
