import React from 'react';
import { Leaf, Award, Flame, Coins, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
  onOpenRewards: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onOpenRewards }) => {
  return (
    <header className="sticky top-0 z-40 bg-emerald-900/95 backdrop-blur-md text-white border-b border-emerald-800 shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-emerald-950 font-bold shadow-inner">
            <Leaf className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white font-mono">eco</span>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-semibold px-1.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                AI v2.0
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 font-medium hidden sm:block">AI 카메라 & 실천 보상 플랫폼</p>
          </div>
        </div>

        {/* User Stats Summary */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Level Badge */}
          <div className="flex items-center gap-1 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-700/50 text-xs font-semibold text-emerald-200">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Lv.{user.level}</span>
          </div>

          {/* Streak Counter */}
          <div className="flex items-center gap-1 bg-orange-950/80 px-2.5 py-1 rounded-lg border border-orange-700/50 text-xs font-bold text-orange-300" title="연속 분리수거 실천 일수">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-bounce" />
            <span>{user.streakDays}일 연속</span>
          </div>

          {/* Eco Points */}
          <button
            onClick={onOpenRewards}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-emerald-950 font-extrabold text-xs sm:text-sm px-3 py-1.5 rounded-xl shadow-md transition-transform active:scale-95"
          >
            <Coins className="w-4 h-4 text-emerald-950" />
            <span>{user.points.toLocaleString()} P</span>
          </button>
        </div>
      </div>
    </header>
  );
};
