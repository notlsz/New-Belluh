import { useI18n, useUi } from '../i18n';
import shell from '../i18n/ui/shell';
import map from '../i18n/ui/map';
import DragonflyMark from './DragonflyMark';
import { Emoji } from '../lib/emoji3d';
import React from 'react';

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

const BLUE = 'bg-[#5e9db3] hover:bg-[#4f8ea4]';

// A floating pill on phones, a quiet sidebar on laptops. 3D emoji tabs: grey until chosen, then in color with a bounce.
// The write button is a plain blue.
const TabBar: React.FC<TabBarProps> = ({ currentTab, onTabChange, onCompose, badges = {}, usTab = false, collapsed = false, onToggleCollapse }) => {
  const tb = useI18n().d.app.tabs;
  const T = useUi(shell).tabs;
  const M = useUi(map);
  const tabs = [
    { id: 'timeline', emoji: '📖', label: tb.story },
    { id: 'map', emoji: '🗺️', label: M.tab },
    { id: 'compose', emoji: '', label: tb.capture },
    { id: 'ai-coach', emoji: usTab ? '💞' : '✨', label: usTab ? tb.us : tb.bella },
    { id: 'profile', emoji: '🙂', label: tb.me },
  ];

  return (
    <div className="fixed bottom-5 left-0 right-0 px-5 z-50 flex justify-center pointer-events-none lg:top-0 lg:bottom-0 lg:right-auto lg:w-[var(--sidebar-w,16rem)] lg:transition-[width] lg:duration-300 lg:px-0 lg:justify-start">
      <nav className={`pointer-events-auto rounded-[2.5rem] flex items-center justify-between px-2.5 py-2.5 max-w-[380px] w-full bg-white/90 backdrop-blur-xl border border-white shadow-[0_24px_50px_-20px_rgba(15,23,42,0.22)] lg:max-w-none lg:h-full lg:flex-col lg:items-stretch lg:justify-start lg:gap-1 lg:rounded-none lg:shadow-none lg:border-0 lg:border-r lg:border-belluh-100 lg:bg-belluh-50 lg:backdrop-blur-none ${collapsed ? 'lg:px-3' : 'lg:px-4'} lg:pt-7 lg:pb-6`}>
        <div className={`hidden lg:flex items-center gap-2 mb-7 order-first ${collapsed ? 'justify-center px-0' : 'px-3'}`}>
          <DragonflyMark size={28} />
          {!collapsed && <span className="font-serif text-[22px] font-bold tracking-tight text-[#9bbecb]" aria-hidden="true">Belluh</span>}
        </div>
        {tabs.map((tab) => {
          if (tab.id === 'compose') {
            return (
              <button key={tab.id} aria-label={tab.label} onClick={onCompose}
                className={`mx-1 ${BLUE} text-white w-14 h-14 rounded-full shadow-[0_12px_24px_-12px_rgba(63,116,134,0.7)] flex items-center justify-center gap-2 group lg:order-1 lg:mx-0 lg:mb-5 lg:w-full lg:h-11 lg:rounded-xl lg:shadow-none`}>
                <span aria-hidden className="text-[30px] lg:text-[22px] font-bold leading-none -mt-0.5 group-hover:rotate-90 transition-transform duration-500">+&#xFE0E;</span>
                {!collapsed && <span className="hidden lg:inline text-sm font-bold">{tb.write}</span>}
              </button>
            );
          }
          const isActive = currentTab === tab.id;
          return (
            <button key={tab.id} aria-label={tab.label} aria-current={isActive ? 'page' : undefined} title={tab.label} onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-full lg:order-2 lg:w-full lg:h-11 lg:flex-row lg:rounded-xl ${collapsed ? 'lg:justify-center lg:px-0' : 'lg:justify-start lg:gap-3 lg:px-3'} ${isActive ? 'lg:bg-white lg:shadow-[0_6px_20px_-12px_rgba(15,23,42,0.3)]' : 'lg:hover:bg-belluh-100'}`}>
              <span key={isActive ? 'on' : 'off'} aria-hidden className={`leading-none transition-[filter,opacity] duration-300 ${isActive ? 'belluh-bounce-in' : 'grayscale opacity-50 hover:opacity-80'}`}>
                <Emoji e={tab.emoji} size={27} className="lg:!w-[22px] lg:!h-[22px]" />
              </span>
              <span className={`mt-1 text-[10.5px] font-bold leading-none lg:mt-0 lg:text-[15px] lg:font-medium ${collapsed ? 'lg:hidden' : ''} ${isActive ? 'text-slate-800 lg:text-slate-900' : 'text-slate-400 lg:text-slate-500'}`}>{tab.label}</span>
              {badges[tab.id] && !isActive && (
                <span aria-label={T.newNote} className="absolute top-1.5 right-2.5 w-2.5 h-2.5 bg-[#f0addd] rounded-full ring-2 ring-white lg:static lg:ml-auto lg:ring-0" />
              )}
            </button>
          );
        })}
        {onToggleCollapse && (
          <button onClick={onToggleCollapse} aria-label={collapsed ? T.expandPanel : T.collapsePanel} title={collapsed ? T.expand : T.collapse}
            className={`hidden lg:flex order-3 mt-auto h-10 items-center gap-3 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-belluh-100 transition-colors ${collapsed ? 'justify-center' : 'px-3'}`}>
            <span aria-hidden className="text-lg font-bold leading-none">{collapsed ? '›' : '‹'}</span>
            {!collapsed && <span className="text-sm font-medium">{tb.collapse}</span>}
          </button>
        )}
      </nav>
    </div>
  );
};

export default TabBar;
