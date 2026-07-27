import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Camera, CheckCircle2, Award, Gift, Sparkles, Coins, Flame, AlertCircle, ShoppingBag, Trash, Trees, Coffee, Check, ArrowRight, History } from 'lucide-react';
import { Badge, RewardItem, UserProfile, VerificationLog } from '../types';
import { INITIAL_BADGES, INITIAL_REWARDS } from '../data/constants';

interface VerificationAndRewardsTabProps {
  user: UserProfile;
  prefilledItemName?: string;
  onUpdateUser: (updater: (prev: UserProfile) => UserProfile) => void;
  logs: VerificationLog[];
  onAddLog: (log: VerificationLog) => void;
}

export const VerificationAndRewardsTab: React.FC<VerificationAndRewardsTabProps> = ({
  user,
  prefilledItemName = '',
  onUpdateUser,
  logs,
  onAddLog,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'verify' | 'rewards' | 'badges'>('verify');

  // Verification Form states
  const [itemName, setItemName] = useState(prefilledItemName || '');
  const [verificationImage, setVerificationImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reward modal states
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);

  // Handle Verification Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVerificationImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit to Gemini Verification API
  const handleVerifySubmit = async () => {
    if (!verificationImage) {
      setErrorMessage('인증할 사진을 등록해주세요.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    setVerificationResult(null);

    try {
      const response = await fetch('/api/gemini/verify-disposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: verificationImage,
          expectedItem: itemName || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success || !data.result) {
        throw new Error(data.error || '인증 평가 응답을 가져오지 못했습니다.');
      }

      const res = data.result;
      setVerificationResult(res);

      if (res.isPassed) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Award points and EXP
        const earned = res.earnedPoints || 100;
        onUpdateUser((prev) => {
          const newExp = prev.exp + 50;
          const newLevel = Math.floor(newExp / 100) + 1;
          return {
            ...prev,
            points: prev.points + earned,
            exp: newExp,
            level: newLevel,
            totalVerified: prev.totalVerified + 1,
            streakDays: prev.streakDays + 1,
          };
        });

        // Save log
        onAddLog({
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          itemName: res.itemName || itemName || '분리배출 인증 물품',
          category: 'PET',
          categoryNameKor: '분리배출 완료',
          points: earned,
          score: res.score || 90,
          passed: true,
          feedback: res.feedback || '올바른 분리배출이 확인되었습니다.',
        });
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMessage(err.message || '인증 중 오류가 발생했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Redeem Reward
  const handleRedeemReward = (reward: RewardItem) => {
    if (user.points < reward.pointsRequired) {
      alert(`포인트가 부족합니다. (필요: ${reward.pointsRequired}P, 보유: ${user.points}P)`);
      return;
    }

    const code = `ECO-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    onUpdateUser((prev) => ({
      ...prev,
      points: prev.points - reward.pointsRequired,
      redeemedRewards: [
        ...prev.redeemedRewards,
        {
          id: Date.now().toString(),
          rewardId: reward.id,
          rewardTitle: reward.title,
          pointsUsed: reward.pointsRequired,
          redeemedAt: new Date().toLocaleDateString('ko-KR'),
          couponCode: code,
        },
      ],
    }));

    setRedeemedCode(code);
    setSelectedReward(reward);

    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
    });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Sub-navigation selector */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('verify')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'verify' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-emerald-600" />
          분리수거 인증하기
        </button>
        <button
          onClick={() => setActiveSubTab('rewards')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'rewards' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-amber-500" />
          보상 숍 ({user.points.toLocaleString()}P)
        </button>
        <button
          onClick={() => setActiveSubTab('badges')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'badges' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-violet-600" />
          배지 & 기록 ({logs.length})
        </button>
      </div>

      {/* SUB TAB 1: Verification Form */}
      {activeSubTab === 'verify' && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-amber-500 to-emerald-600 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="bg-white/20 text-white font-bold text-xs px-2.5 py-0.5 rounded-full mb-1 inline-block">
                  매일 참여하는 에코 루틴
                </span>
                <h2 className="text-xl font-bold">분리배출 세척/라벨 제거 인증</h2>
                <p className="text-xs text-amber-50 mt-1">
                  깨끗이 헹구고 라벨을 뗀 재활용품을 촬영하면 AI가 검증 후 에코 포인트를 증정합니다!
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-black">+100 P</div>
                <div className="text-[10px] text-amber-100">1회 인증 당 기본 보상</div>
              </div>
            </div>
          </div>

          {/* Verification Form Box */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">인증할 물품 명칭 (선택)</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="예: 라벨 떼고 세척한 투명 페트병"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Photo Uploader */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">배출 준비 완료 사진 첨부</label>
              {verificationImage ? (
                <div className="relative rounded-2xl overflow-hidden aspect-16/9 border border-slate-200 bg-slate-900">
                  <img src={verificationImage} alt="Verification" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setVerificationImage(null)}
                    className="absolute top-2 right-2 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm"
                  >
                    사진 변경
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-50/80 rounded-2xl p-6 text-center block cursor-pointer transition-colors">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl mx-auto flex items-center justify-center mb-2">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">인증 사진 촬영 또는 업로드</span>
                  <p className="text-[11px] text-slate-500 mt-1">라벨 제거 및 세척 상태가 잘 보이는 사진을 올려주세요</p>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleVerifySubmit}
              disabled={isVerifying || !verificationImage}
              className="w-full bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 disabled:opacity-50 text-white font-bold text-sm py-3 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI 인증 심사 진행 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>AI 인증 제출하고 보상받기</span>
                </>
              )}
            </button>
          </div>

          {/* Verification Result Feedback */}
          {verificationResult && (
            <div className={`p-5 rounded-3xl border shadow-sm space-y-3 animate-in fade-in duration-300 ${
              verificationResult.isPassed ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {verificationResult.isPassed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  )}
                  <span className="font-extrabold text-sm text-slate-900">
                    {verificationResult.isPassed ? '🎉 분리배출 인증 성공!' : '⚠️ 사전 준비 미흡'}
                  </span>
                </div>
                <span className="font-bold text-xs bg-white px-3 py-1 rounded-full shadow-xs">
                  평가 점수: {verificationResult.score}점
                </span>
              </div>

              <p className="text-xs text-slate-800 leading-relaxed font-medium">{verificationResult.feedback}</p>

              {verificationResult.isPassed && (
                <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>획득한 보상</span>
                  <span className="text-amber-600 text-sm font-black">+{verificationResult.earnedPoints || 100} Eco Points!</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: Reward Shop */}
      {activeSubTab === 'rewards' && (
        <div className="space-y-5">
          {/* Points Balance Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-800 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-300 font-medium">사용 가능한 에코 포인트</span>
              <div className="text-2xl font-black text-amber-300 flex items-center gap-2 mt-0.5">
                <Coins className="w-6 h-6 text-amber-300" />
                <span>{user.points.toLocaleString()} P</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] bg-emerald-700/60 text-emerald-200 px-3 py-1 rounded-full border border-emerald-600">
                누적 인증: {user.totalVerified}회
              </span>
            </div>
          </div>

          {/* Reward Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INITIAL_REWARDS.map((reward) => {
              const canAfford = user.points >= reward.pointsRequired;

              return (
                <div
                  key={reward.id}
                  className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      {reward.iconName === 'Trash' && <Trash className="w-5 h-5" />}
                      {reward.iconName === 'ShoppingBag' && <ShoppingBag className="w-5 h-5" />}
                      {reward.iconName === 'Trees' && <Trees className="w-5 h-5 text-emerald-600" />}
                      {reward.iconName === 'Coffee' && <Coffee className="w-5 h-5" />}
                      {reward.iconName === 'Gift' && <Gift className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                      {reward.badgeTag}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold">{reward.brand}</span>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{reward.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{reward.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-black text-amber-600 text-sm">{reward.pointsRequired.toLocaleString()} P</span>
                    <button
                      onClick={() => handleRedeemReward(reward)}
                      disabled={!canAfford}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-transform active:scale-95 ${
                        canAfford
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? '교환하기' : '포인트 부족'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB TAB 3: Badges & Log History */}
      {activeSubTab === 'badges' && (
        <div className="space-y-6">
          {/* Badges Grid */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              나의 그린 실천 배지
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {INITIAL_BADGES.map((badge) => {
                const isUnlocked = badge.unlocked || user.unlockedBadges.includes(badge.id);

                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-2xl border text-center space-y-1 ${
                      isUnlocked ? 'bg-amber-50/60 border-amber-200 text-slate-900' : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-white mx-auto flex items-center justify-center shadow-xs">
                      {isUnlocked ? <Sparkles className="w-4 h-4 text-amber-500" /> : <Award className="w-4 h-4 text-slate-300" />}
                    </div>
                    <p className="font-bold text-xs truncate">{badge.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{badge.requirement}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification Logs Feed */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600" />
              분리수거 실천 기록 ({logs.length}건)
            </h3>

            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">아직 분리수거 인증 기록이 없습니다. 사진을 찍고 첫 보상을 받으세요!</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{log.itemName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{log.date} · 심사 점수 {log.score}점</p>
                    </div>
                    <span className="font-black text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
                      +{log.points}P
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Redemption Success Modal */}
      {selectedReward && redeemedCode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <Gift className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-600">교환 완료!</span>
              <h3 className="text-base font-extrabold text-slate-900 mt-1">{selectedReward.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{selectedReward.description}</p>
            </div>

            {/* Generated Coupon Barcode / Code */}
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">모바일 바코드 쿠폰 번호</span>
              <span className="font-mono font-black text-slate-800 text-sm tracking-wider">{redeemedCode}</span>
            </div>

            <button
              onClick={() => {
                setSelectedReward(null);
                setRedeemedCode(null);
              }}
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow-xs"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
