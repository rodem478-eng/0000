import React, { useState } from 'react';
import { Header } from './components/Header';
import { Navbar, TabType } from './components/Navbar';
import { CameraScanTab } from './components/CameraScanTab';
import { VerificationAndRewardsTab } from './components/VerificationAndRewardsTab';
import { MiniGameTab } from './components/MiniGameTab';
import { GuideAndQnaTab } from './components/GuideAndQnaTab';
import { UserProfile, VerificationLog } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('camera');

  // User Profile State
  const [user, setUser] = useState<UserProfile>({
    points: 1200,
    exp: 150,
    level: 2,
    streakDays: 3,
    totalVerified: 2,
    unlockedBadges: ['first_scan'],
    redeemedRewards: [],
  });

  // Verification Logs State
  const [logs, setLogs] = useState<VerificationLog[]>([
    {
      id: 'log-1',
      date: '7월 26일 14:20',
      itemName: '라벨 제거한 500ml 투명 페트병',
      category: 'PET',
      categoryNameKor: '투명 페트병',
      points: 100,
      score: 95,
      passed: true,
      feedback: '비닐 라벨을 완벽히 떼어내고 세척 후 압착 배출했습니다.',
    },
    {
      id: 'log-2',
      date: '7월 25일 19:10',
      itemName: '펼쳐서 말린 우유팩 1000ml',
      category: 'PAPER_PACK',
      categoryNameKor: '종이팩',
      points: 100,
      score: 90,
      passed: true,
      feedback: '세척 후 펼쳐서 말려 종이팩 전용함에 배출했습니다.',
    },
  ]);

  // Prefilled Item Name when jumping from Camera Tab to Verify Tab
  const [prefilledItemName, setPrefilledItemName] = useState<string>('');

  const handleGoToVerifyWithItem = (itemName: string) => {
    setPrefilledItemName(itemName);
    setActiveTab('verify');
  };

  const handleAddLog = (newLog: VerificationLog) => {
    setLogs((prev) => [newLog, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased selection:bg-emerald-200">
      {/* Sticky Header */}
      <Header user={user} onOpenRewards={() => setActiveTab('verify')} />

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-3 pt-4 pb-20">
        {activeTab === 'camera' && (
          <CameraScanTab onGoToVerifyWithItem={handleGoToVerifyWithItem} />
        )}

        {activeTab === 'verify' && (
          <VerificationAndRewardsTab
            user={user}
            prefilledItemName={prefilledItemName}
            onUpdateUser={setUser}
            logs={logs}
            onAddLog={handleAddLog}
          />
        )}

        {activeTab === 'game' && (
          <MiniGameTab user={user} onUpdateUser={setUser} />
        )}

        {activeTab === 'guide' && <GuideAndQnaTab />}
      </main>

      {/* Fixed Bottom Navigation */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
