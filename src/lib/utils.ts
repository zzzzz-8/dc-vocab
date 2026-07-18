import { type ClassValue, clsx } from 'clsx';
import { format, formatDistanceToNow, isToday, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 合并className
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string, pattern: string = 'yyyy-MM-dd'): string {
  return format(new Date(date), pattern);
}

/**
 * 相对时间
 */
export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
}

/**
 * 判断是否为今天
 */
export function checkIsToday(date: Date | string): boolean {
  return isToday(new Date(date));
}

/**
 * 判断是否为昨天
 */
export function checkIsYesterday(date: Date | string): boolean {
  return isYesterday(new Date(date));
}

/**
 * 获取本周范围
 */
export function getWeekRange(date: Date = new Date()) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

/**
 * 获取本月范围
 */
export function getMonthRange(date: Date = new Date()) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

/**
 * 随机从数组取元素
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 从数组中随机取N个元素
 */
export function pickRandom<T>(array: T[], n: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

/**
 * 防抖
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 生成随机ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 计算掌握程度百分比 (6阶循环)
 */
export function getMasteryPercent(stage: number): number {
  const stages = [0, 15, 30, 45, 60, 75, 90, 100];
  return stages[Math.min(stage, stages.length - 1)];
}

/**
 * 获取掌握程度标签 (6阶循环)
 */
export function getMasteryLabel(stage: number): string {
  const labels = ['遗忘', '一阶', '二阶', '三阶', '四阶', '五阶', '六阶', '掌握'];
  return labels[Math.min(stage, labels.length - 1)];
}

/**
 * 获取难度标签
 */
export function getDifficultyLabel(difficulty: number): string {
  const labels = ['简单', '较易', '中等', '较难', '困难'];
  return labels[Math.min(difficulty - 1, labels.length - 1)];
}

/**
 * 获取难度颜色
 */
export function getDifficultyColor(difficulty: number): string {
  const colors = ['bg-green-100 text-green-700', 'bg-blue-100 text-blue-700', 'bg-yellow-100 text-yellow-700', 'bg-orange-100 text-orange-700', 'bg-red-100 text-red-700'];
  return colors[Math.min(difficulty - 1, colors.length - 1)];
}

/**
 * 格式化学习时长
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
}

/**
 * 获取词库级别颜色
 */
export function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    '小学': 'bg-green-100 text-green-700 border-green-200',
    '初中': 'bg-blue-100 text-blue-700 border-blue-200',
    '高中': 'bg-purple-100 text-purple-700 border-purple-200',
    '四级': 'bg-orange-100 text-orange-700 border-orange-200',
    '六级': 'bg-red-100 text-red-700 border-red-200',
    '考研': 'bg-pink-100 text-pink-700 border-pink-200',
    '雅思': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    '托福': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'GRE': 'bg-teal-100 text-teal-700 border-teal-200',
  };
  return colors[level] || 'bg-gray-100 text-gray-700 border-gray-200';
}

/**
 * 获取卡通形象表情 (新版5级)
 */
export function getMascotExpression(stage: number, isCorrect?: boolean): string {
  if (isCorrect === true) return '😄';
  if (isCorrect === false) return '😅';
  if (stage >= 5) return '🎉';
  if (stage >= 4) return '😊';
  if (stage >= 3) return '🙂';
  if (stage >= 1) return '🤔';
  return '😐';
}

/**
 * 获取字体大小对应的文本大小class
 */
export function getFontSizeClass(level: number): string {
  const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl'];
  return sizes[Math.min(Math.max(level - 1, 0), sizes.length - 1)];
}

/**
 * 获取主题模式背景色class
 */
export function getThemeBgClass(mode: string): string {
  const themes: Record<string, string> = {
    light: 'bg-[#FFF8F0]',
    dark: 'bg-gray-900',
    green: 'bg-green-50',
    gray: 'bg-gray-50',
  };
  return themes[mode] || themes.light;
}

/**
 * 获取主题模式文字颜色class
 */
export function getThemeTextClass(mode: string): string {
  const themes: Record<string, string> = {
    light: 'text-gray-800',
    dark: 'text-gray-100',
    green: 'text-gray-800',
    gray: 'text-gray-800',
  };
  return themes[mode] || themes.light;
}
