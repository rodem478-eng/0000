import React from 'react';
import { Camera, Gift, Gamepad2, BookOpen } from 'lucide-react';

export type TabType = 'camera' | 'verify' | 'game' | 'guide';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  verificationBadgeCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, verificationBadgeCount }) => {
  const tabs = [
    {
      id: 'camera' as TabType,
      label: 'AI 카메라',
      sublabel: '인식 & 검색',
      icon: Camera,
      color: 'emerald',
    },
    {
      id: 'verify' as TabType,
      label: '인증 & 보상',
      sublabel: '포인트 & 쿠폰',
      icon: Gift,
      color: 'amber',
      badge: verificationBadgeCount,
    },
    {
      id: 'game' as TabType,
      label: '분리수거 게임',
      sublabel: '오락실 미니게임',
      icon: Gamepad2,
      color: 'violet',
    },
    {
      id: 'guide' as TabType,
      label: '분리 사전/Q&A',
      sublabel: '질문 & 가이드',
      icon: BookOpen,
      color: 'teal',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-bold scale-105 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
              <span className="text-[9px] text-slate-400 font-normal hidden sm:block">{tab.sublabel}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
