export type WasteCategory =
  | 'PLASTIC'
  | 'PET'
  | 'VINYL'
  | 'PAPER'
  | 'PAPER_PACK'
  | 'GLASS'
  | 'CAN_METAL'
  | 'STYROFOAM'
  | 'GENERAL'
  | 'E_WASTE'
  | 'FOOD';

export interface CategoryInfo {
  id: WasteCategory;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
  description: string;
}

export interface WasteAnalysisResult {
  itemName: string;
  category: WasteCategory;
  categoryNameKor: string;
  recyclable: boolean;
  recyclabilityScore: number;
  steps: string[];
  caution: string;
  disposalMethod: string;
  environmentalImpact: string;
  tags: string[];
}

export interface VerificationResult {
  isPassed: boolean;
  score: number;
  itemName: string;
  feedback: string;
  earnedPoints: number;
  tips: string[];
}

export interface VerificationLog {
  id: string;
  date: string;
  itemName: string;
  category: WasteCategory;
  categoryNameKor: string;
  points: number;
  score: number;
  imageUrl?: string;
  passed: boolean;
  feedback: string;
}

export interface RewardItem {
  id: string;
  title: string;
  brand: string;
  category: 'coupon' | 'voucher' | 'donation';
  pointsRequired: number;
  description: string;
  badgeTag: string;
  iconName: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  requirement: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface UserProfile {
  points: number;
  exp: number;
  level: number;
  streakDays: number;
  totalVerified: number;
  unlockedBadges: string[];
  redeemedRewards: Array<{
    id: string;
    rewardId: string;
    rewardTitle: string;
    pointsUsed: number;
    redeemedAt: string;
    couponCode: string;
  }>;
}

export interface GameItem {
  id: string;
  name: string;
  correctCategory: WasteCategory;
  icon: string;
  hasLabel?: boolean;
  isDirty?: boolean;
  trickExplanation?: string;
}

export interface QnAItem {
  id: string;
  question: string;
  category: WasteCategory;
  answer: string;
  keyRule: string;
  tags: string[];
}
