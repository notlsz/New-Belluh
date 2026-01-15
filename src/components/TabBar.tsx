import React from 'react';
import { BookHeart, Sparkles, User, Plus, Infinity } from 'lucide-react';

interface TabBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onCompose: () => void;
}

const TabBar: React.FC<TabBarProps> = ({ currentTab, onTabChange, onCompose }) => {
  const tabs = [
    { id: 'timeline', icon: BookHeart, label: 'Story' }, // Main Home
    { id: 'compose', icon: Plus, label: 'Capture', isAction: true },
    { id: 'ai-coach', icon: Sparkles, label: 'Belluh' },
    { id: 'profile', icon: User, label: 'Me' },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 px-6 z-50 flex justify-center pointer-events-none">
      <nav className="glass pointer-events-auto rounded-[2.5rem] shadow-2xl shadow-slate-900/10 flex items-center justify-between px-3 py-3 max-w-[320px] w-full bg-white/90 backdrop-blur-xl border border-white/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                onClick={onCompose}
                className="mx-2 bg-slate-900 text-white w-14 h-14 rounded-full shadow-lg shadow-slate-900/30 flex items-center justify-center transition-all duration-300 active:scale-95 hover:scale-105 hover:bg-black group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-belluh-400 to-transparent opacity-0 group-hover:opacity-30 transition-opacity"></div>
                <Icon size={26} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-500 relative z-10" />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-500 ${
                isActive ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={`transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
              {isActive && (
                <span className="absolute -bottom-2 w-1 h-1 bg-belluh-300 rounded-full animate-scale-in" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabBar;