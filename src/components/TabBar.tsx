import { useI18n, useUi } from '../i18n';
import shell from '../i18n/ui/shell';
import map from '../i18n/ui/map';
import React from 'react';

interface TabBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onCompose: () => void;
  badges?: Record<string, boolean>;
  /** With a partner connected, the Belluh tab is "Us": the two of you and Belluh. */
  usTab?: boolean;
}

// One floating pill on every screen, phone or laptop, after Zenly: emoji tabs that wake up in color and bounce when
// chosen, and a juicy write button in the middle
const TabBar: React.FC<TabBarProps> = ({ currentTab, onTabChange, onCompose, badges = {}, usTab = false }) => {
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
    <div className="fixed bottom-5 md:bottom-7 left-0 right-0 px-5 z-50 flex justify-center pointer-events-none">
      <nav className="pointer-events-auto rounded-[2.5rem] flex items-center justify-between px-2.5 py-2.5 max-w-[380px] w-full bg-white/90 backdrop-blur-xl border border-white shadow-[0_24px_50px_-20px_rgba(196,88,159,0.4)]">
        {tabs.map((tab) => {
          if (tab.id === 'compose') {
            return (
              <button key={tab.id} aria-label={tab.label} onClick={onCompose}
                className="mx-1 bg-gradient-to-br from-[#ee8fcc] via-[#c99bd6] to-[#7fb4c6] text-white w-14 h-14 rounded-full shadow-[0_14px_28px_-10px_rgba(196,88,159,0.7)] ring-4 ring-white flex items-center justify-center hover:scale-105 group">
                <span aria-hidden className="text-[30px] font-bold leading-none -mt-0.5 group-hover:rotate-90 transition-transform duration-500">+&#xFE0E;</span>
              </button>
            );
          }
          const isActive = currentTab === tab.id;
          return (
            <button key={tab.id} aria-label={tab.label} aria-current={isActive ? 'page' : undefined} title={tab.label} onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center w-14 h-14 rounded-full">
              <span key={isActive ? 'on' : 'off'} aria-hidden
                className={`text-[26px] leading-none transition-[filter,opacity] duration-300 ${isActive ? 'belluh-bounce-in' : 'grayscale opacity-45 hover:opacity-80'}`}>{tab.emoji}</span>
              <span className={`mt-1 text-[10.5px] font-bold leading-none transition-colors ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>{tab.label}</span>
              {badges[tab.id] && !isActive && (
                <span aria-label={T.newNote} className="absolute top-1.5 right-2.5 w-2.5 h-2.5 bg-[#f0addd] rounded-full ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabBar;
