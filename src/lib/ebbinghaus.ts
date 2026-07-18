/**
 * 单词跳跳岛 - 6阶循环记忆算法
 *
 * 六阶循环: 遗忘 → 一阶(1天) → 二阶(2天) → 三阶(4天) → 四阶(7天) → 五阶(15天) → 六阶(30天) → 掌握 ✅
 * 规则：正确前进一格，错误退回「遗忘」
 * 每天每词最多提交1次
 */

// 6阶复习间隔
export const CYCLE_STAGES = [
  { stage: 0,  label: '遗忘',   interval: 0,    color: '#FF6B6B', display: '退回' },
  { stage: 1,  label: '一阶',   interval: 1,    color: '#FF8E8E', display: '1天后' },
  { stage: 2,  label: '二阶',   interval: 2,    color: '#FDCB6E', display: '2天后' },
  { stage: 3,  label: '三阶',   interval: 4,    color: '#FFE66D', display: '4天后' },
  { stage: 4,  label: '四阶',   interval: 7,    color: '#4ECDC4', display: '7天后' },
  { stage: 5,  label: '五阶',   interval: 15,   color: '#55EFC4', display: '15天后' },
  { stage: 6,  label: '六阶',   interval: 30,   color: '#A29BFE', display: '30天后' },
  { stage: 7,  label: '掌握',   interval: 0,    color: '#00B894', display: '已掌握' },
];

// 8档复习间隔（用于展示和首页看板）
export const REVIEW_INTERVALS = CYCLE_STAGES;

// 复习周期分组说明（首页看板用）
export const REVIEW_GROUP_LABELS = [
  { key: 'forgotten', label: '遗忘',    stage: 0, color: '#FF6B6B' },
  { key: 'stage1',    label: '一阶',    stage: 1, color: '#FF8E8E' },
  { key: 'stage2',    label: '二阶',    stage: 2, color: '#FDCB6E' },
  { key: 'stage3',    label: '三阶',    stage: 3, color: '#FFE66D' },
  { key: 'stage4',    label: '四阶',    stage: 4, color: '#4ECDC4' },
  { key: 'stage5',    label: '五阶',    stage: 5, color: '#55EFC4' },
  { key: 'stage6',    label: '六阶',    stage: 6, color: '#A29BFE' },
  { key: 'mastered',  label: '掌握',    stage: 7, color: '#00B894' },
];

/**
 * 6阶循环记忆：根据正确/错误计算新的记忆阶段
 *
 * 正确：前进一格（最高7级-掌握）
 * 错误：直接退回0级（遗忘），并加入错词本
 *
 * @param currentStage 当前记忆阶段 (0-7)
 * @param isCorrect 是否答对
 * @returns 新的记忆阶段
 */
export function calculateNewStage(currentStage: number, isCorrect: boolean): number {
  if (isCorrect) {
    // 答对：前进一格，最高7级（掌握）
    return Math.min(currentStage + 1, 7);
  } else {
    // 答错：直接退回0级（遗忘）
    return 0;
  }
}

/**
 * 根据阶段计算下一次复习时间
 *
 * @param stage 当前阶段 (0-7)
 * @param fromDate 基准日期（可选，默认当前时间）
 * @returns 下次复习的Date对象
 */
export function calculateNextReview(stage: number, fromDate: Date = new Date()): Date {
  if (stage <= 0 || stage >= 7) {
    // 0级（遗忘）：需要立即复习
    // 7级（掌握）：不需要复习了，但返回当前时间作为标记
    return fromDate;
  }
  const stageConfig = CYCLE_STAGES[stage];
  const intervalMs = stageConfig.interval * 24 * 60 * 60 * 1000;
  return new Date(fromDate.getTime() + intervalMs);
}

/**
 * 获取下一阶段
 */
export function getNextStage(currentStage: number): number {
  return Math.min(currentStage + 1, 7);
}

/**
 * 获取复习优先级分数
 * 优先级规则：
 * 1. 遗忘的词（stage=0）优先级最高
 * 2. 超期越久优先级越高
 * 3. 错词本中的词优先级高于普通词
 */
export function getReviewPriority(
  stage: number,
  nextReviewAt: Date,
  isErrorWord: boolean = false,
  now: Date = new Date()
): number {
  const overdueHours = (now.getTime() - nextReviewAt.getTime()) / (1000 * 60 * 60);
  // 阶段权重：遗忘=100, 一阶=80, 二阶=60, 三阶=40, 四阶=20, 五阶=10, 六阶=5, 掌握=0
  const stageWeight = Math.max((7 - stage) * 15, 0);
  // 超期权重：每超期1小时加1分，上限100分
  const overdueWeight = Math.min(Math.max(Math.round(overdueHours), 0), 100);
  // 错词本额外加30分
  const errorWordBonus = isErrorWord ? 30 : 0;

  return stageWeight + overdueWeight + errorWordBonus;
}

/**
 * 计算记忆掌握度 (0-100%)
 *
 * 基于记忆阶段：
 * 0级（遗忘）：0%
 * 1级（一阶）：15%
 * 2级（二阶）：30%
 * 3级（三阶）：45%
 * 4级（四阶）：60%
 * 5级（五阶）：75%
 * 6级（六阶）：90%
 * 7级（掌握）：100%
 */
export function calculateMastery(stage: number, reviewCount: number = 0): number {
  if (stage >= 7) return 100;
  const baseMastery = stage * 15; // 0, 15, 30, 45, 60, 75, 90
  const bonus = Math.min(reviewCount * 1, 10);
  return Math.min(baseMastery + bonus, 99);
}

/**
 * 获取阶段对应的中文描述
 */
export function getStageLabel(stage: number): string {
  const stageConfig = CYCLE_STAGES[stage];
  return stageConfig?.label || '未知';
}

/**
 * 获取阶段对应的颜色
 */
export function getStageColor(stage: number): string {
  const stageConfig = CYCLE_STAGES[stage];
  return stageConfig?.color || '#B2BEC3';
}

/**
 * 获取复习间隔的显示文本
 */
export function getStageIntervalDisplay(stage: number): string {
  if (stage <= 0) return '立即复习';
  if (stage >= 7) return '已掌握 ✅';
  return CYCLE_STAGES[stage]?.display || '';
}

/**
 * 获取今日待复习的条件 (Prisma where clause)
 */
export function getTodayReviewCondition(userId: string, now: Date = new Date()) {
  return {
    userId,
    nextReviewAt: { lte: now },
    stage: { lt: 7 }, // 未掌握
  };
}

// Backward-compatible aliases
/** @deprecated Use getStageLabel instead */
export const getLevelLabel = getStageLabel;
/** @deprecated Use getStageColor instead */
export const getLevelColor = getStageColor;
