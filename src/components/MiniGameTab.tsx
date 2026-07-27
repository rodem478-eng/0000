import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Gamepad2, Timer, Flame, Trophy, RefreshCw, Heart, Sparkles, CheckCircle2, XCircle, ArrowRight, Info, ShieldAlert } from 'lucide-react';
import { GameItem, UserProfile, WasteCategory } from '../types';
import { CATEGORY_MAP, GAME_ITEMS_POOL } from '../data/constants';

interface MiniGameTabProps {
  user: UserProfile;
  onUpdateUser: (updater: (prev: UserProfile) => UserProfile) => void;
}

export const MiniGameTab: React.FC<MiniGameTabProps> = ({ user, onUpdateUser }) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [lives, setLives] = useState(3);

  const [itemsQueue, setItemsQueue] = useState<GameItem[]>([]);
  const [currentItem, setCurrentItem] = useState<GameItem | null>(null);

  // Item preparation states
  const [labelRemoved, setLabelRemoved] = useState(false);
  const [cleaned, setCleaned] = useState(false);

  // Feedback animation state
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  // Start new game
  const startGame = () => {
    // Shuffle item pool
    const shuffled = [...GAME_ITEMS_POOL, ...GAME_ITEMS_POOL].sort(() => Math.random() - 0.5);
    setItemsQueue(shuffled.slice(1));
    setCurrentItem(shuffled[0]);

    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(45);
    setLives(3);
    setLabelRemoved(false);
    setCleaned(false);
    setFeedback(null);
    setGameState('playing');
  };

  // Timer countdown hook
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Handle Game Over
  const endGame = () => {
    setGameState('gameover');

    // Convert game score to Eco Points (10% ratio)
    const earnedPoints = Math.floor(score * 0.1);

    if (earnedPoints > 0) {
      onUpdateUser((prev) => ({
        ...prev,
        points: prev.points + earnedPoints,
        unlockedBadges: score >= 800 ? [...new Set([...prev.unlockedBadges, 'game_hero'])] : prev.unlockedBadges,
      }));

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  // User submits category bin choice
  const handleSortChoice = (categoryChoice: WasteCategory) => {
    if (!currentItem || gameState !== 'playing') return;

    let targetCategory = currentItem.correctCategory;

    // Check if item trick was resolved
    let isCorrect = categoryChoice === targetCategory;

    // If item had label but user didn't remove it before PET/Plastic sorting, penalize or adjust
    if (currentItem.hasLabel && !labelRemoved && (targetCategory === 'PET' || targetCategory === 'PLASTIC' || targetCategory === 'PAPER')) {
      isCorrect = false;
    }

    if (currentItem.isDirty && !cleaned && targetCategory !== 'GENERAL') {
      isCorrect = false;
    }

    if (isCorrect) {
      const newCombo = combo + 1;
      const pointsGained = 100 + newCombo * 20;
      setScore((prev) => prev + pointsGained);
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      setFeedback({
        isCorrect: true,
        text: `+${pointsGained}점! 올바른 분리배출 성공!`,
      });
    } else {
      setCombo(0);
      const newLives = lives - 1;
      setLives(newLives);

      setFeedback({
        isCorrect: false,
        text: currentItem.trickExplanation || `오답! 올바른 분류: ${CATEGORY_MAP[targetCategory].name}`,
      });

      if (newLives <= 0) {
        endGame();
        return;
      }
    }

    // Advance to next item
    setTimeout(() => {
      setFeedback(null);
      setLabelRemoved(false);
      setCleaned(false);

      if (itemsQueue.length > 0) {
        setCurrentItem(itemsQueue[0]);
        setItemsQueue((prev) => prev.slice(1));
      } else {
        // Refill queue
        const refilled = [...GAME_ITEMS_POOL].sort(() => Math.random() - 0.5);
        setCurrentItem(refilled[0]);
        setItemsQueue(refilled.slice(1));
      }
    }, 900);
  };

  const binOptions: Array<{ id: WasteCategory; name: string; color: string; icon: string }> = [
    { id: 'PET', name: '투명 페트병', color: 'bg-emerald-600', icon: '🍾' },
    { id: 'PLASTIC', name: '플라스틱', color: 'bg-teal-600', icon: '📦' },
    { id: 'VINYL', name: '비닐류', color: 'bg-purple-600', icon: '🛍️' },
    { id: 'PAPER', name: '종이류', color: 'bg-amber-600', icon: '📄' },
    { id: 'PAPER_PACK', name: '종이팩', color: 'bg-orange-600', icon: '🥛' },
    { id: 'GLASS', name: '유리병', color: 'bg-sky-600', icon: '🍷' },
    { id: 'CAN_METAL', name: '캔/고철', color: 'bg-slate-600', icon: '🥫' },
    { id: 'GENERAL', name: '일반쓰레기', color: 'bg-rose-600', icon: '🗑️' },
    { id: 'E_WASTE', name: '폐건전지/가전', color: 'bg-violet-600', icon: '🔋' },
  ];

  return (
    <div className="space-y-5 pb-24">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-900 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-violet-400/20 text-violet-200 text-xs px-2.5 py-0.5 rounded-full font-medium mb-1 border border-violet-400/30">
            <Gamepad2 className="w-3.5 h-3.5 text-amber-300" />
            분리배출 오락실
          </div>
          <h2 className="text-xl font-bold">분리배출 마스터 미니게임</h2>
          <p className="text-xs text-violet-200 mt-0.5">헷갈리는 재활용품을 순발력 있게 올바른 수거함에 분류해보세요!</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full shadow-xs">
            게임 점수 → 에코 포인트 전환
          </span>
        </div>
      </div>

      {/* GAME STATE: IDLE */}
      {gameState === 'idle' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 bg-violet-100 text-violet-600 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
            <Gamepad2 className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-slate-900">게임 규칙</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              1. 제한 시간 45초 동안 제시되는 물품을 올바른 수거함에 넣으세요.<br />
              2. <strong>라벨이 있거나 오염된 물품</strong>은 분류 전 버튼을 눌러 먼저 세척/라벨 제거를 해야 점수를 얻습니다!<br />
              3. 연속 성공 시 콤보 멀티플라이어 추가 점수가 부여됩니다.
            </p>
          </div>

          <button
            onClick={startGame}
            className="w-full max-w-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            게임 시작하기 (45초)
          </button>
        </div>
      )}

      {/* GAME STATE: PLAYING */}
      {gameState === 'playing' && currentItem && (
        <div className="space-y-4">
          {/* Game HUD Bar */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5 text-amber-600">
              <Trophy className="w-4 h-4" />
              <span>{score.toLocaleString()} 점</span>
            </div>

            <div className="flex items-center gap-1.5 text-violet-600">
              <Flame className="w-4 h-4 fill-violet-600" />
              <span>{combo} COMBO</span>
            </div>

            <div className="flex items-center gap-1 text-rose-500">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart key={i} className={`w-4 h-4 ${i < lives ? 'fill-rose-500' : 'text-slate-300'}`} />
              ))}
            </div>

            <div className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              <Timer className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>{timeLeft}초</span>
            </div>
          </div>

          {/* Current Item Card */}
          <div className="bg-white rounded-3xl p-6 border-2 border-violet-200 shadow-md text-center space-y-4 relative overflow-hidden">
            <span className="text-6xl block">{currentItem.icon}</span>

            <div>
              <h3 className="text-lg font-black text-slate-900">{currentItem.name}</h3>
              <p className="text-xs text-slate-500 mt-1">어떤 수거함에 분류해야 할까요?</p>
            </div>

            {/* Preparation Actions (Label Removal / Cleaning) */}
            <div className="flex justify-center gap-2 pt-1">
              {currentItem.hasLabel && (
                <button
                  onClick={() => setLabelRemoved(true)}
                  disabled={labelRemoved}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    labelRemoved
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  {labelRemoved ? '✓ 라벨 제거 완료' : '🏷️ 라벨/테이프 제거하기!'}
                </button>
              )}

              {currentItem.isDirty && (
                <button
                  onClick={() => setCleaned(true)}
                  disabled={cleaned}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    cleaned
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100'
                  }`}
                >
                  {cleaned ? '✓ 세척 완료' : '🚿 물로 세척하기!'}
                </button>
              )}
            </div>

            {/* Feedback Toast */}
            {feedback && (
              <div
                className={`absolute inset-0 bg-white/95 backdrop-blur-xs flex items-center justify-center p-4 text-center font-bold text-sm ${
                  feedback.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                <div className="space-y-2">
                  {feedback.isCorrect ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
                  ) : (
                    <XCircle className="w-10 h-10 text-rose-600 mx-auto" />
                  )}
                  <p>{feedback.text}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bin Selection Grid */}
          <div className="grid grid-cols-3 gap-2">
            {binOptions.map((bin) => (
              <button
                key={bin.id}
                onClick={() => handleSortChoice(bin.id)}
                className={`${bin.color} text-white hover:opacity-90 font-bold text-xs p-3 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform`}
              >
                <span className="text-xl">{bin.icon}</span>
                <span>{bin.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GAME STATE: GAME OVER */}
      {gameState === 'gameover' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg text-center space-y-5 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl mx-auto flex items-center justify-center">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">게임 종료</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">최종 점수: {score.toLocaleString()} 점</h3>
            <p className="text-xs text-slate-500 mt-1">최대 연속 콤보: {maxCombo} COMBO</p>
          </div>

          {/* Points Conversion Display */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between">
            <span>획득한 에코 포인트</span>
            <span className="text-base font-black text-emerald-600">+{Math.floor(score * 0.1)} P</span>
          </div>

          <button
            onClick={startGame}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            다시 도전하기
          </button>
        </div>
      )}
    </div>
  );
};
