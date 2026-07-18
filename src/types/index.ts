// ==================== User Types ====================
export interface UserInfo {
  id: string;
  username: string;
  email: string | null;
  nickname: string | null;
  avatar: string | null;
  phone?: string;
  role?: string;
  membership?: string;
  membershipExpiry?: string | null;
  credits?: number;
  isMember?: boolean;
}

// ==================== Word Types ====================
export interface WordData {
  id: string;
  wordBookId: string;
  word: string;
  phonetic: string | null;
  phoneticUS: string | null;
  phoneticUK: string | null;
  meaning: string;
  partOfSpeech: string | null;
  definition: string | null;
  definitionEn: string | null;
  examples: string | null; // JSON array
  synonyms: string | null;
  antonyms: string | null;
  rootAffix: string | null;
  wordForm: string | null;
  memoryTip: string | null;
  frequency: number;
  difficulty: number;
  audioUrlUS: string | null;
  audioUrlUK: string | null;
  imageUrl: string | null;
}

// 单词详情（包含展开的面板数据）
export interface WordDetail extends WordData {
  phoneticDisplay: string;
  posDisplay: string;
  definitionList: string[];
  exampleList: string[];
  forms: string[];
}

// ==================== Word Book Types ====================
export interface WordBookData {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  level: string;
  wordCount: number;
  category: string | null;
  progress?: number;
}

// ==================== UserWord (学习状态) ====================
export interface UserWordData {
  id: string;
  userId: string;
  wordId: string;
  wordBookId: string | null;
  stage: number;        // 0=遗忘, 1-6=一阶~六阶, 7=掌握
  status: string;
  errorCount: number;
  isInErrorBook: boolean;
  nextReviewAt: string;
  reviewedCount: number;
  lastReviewAt: string | null;
  note: string | null;
  word?: WordData;
}

// 复习队列项
export interface ReviewItem {
  id: string;
  wordId: string;
  word: WordData;
  stage: number;
  nextReviewAt: string;
  reviewedCount: number;
  priority: number;
}

// 复习题型
export type ReviewQuestionType = 'en2cn' | 'cn2en' | 'spelling' | 'listening' | 'discrimination';

export interface ReviewQuestion {
  id: string;
  type: ReviewQuestionType;
  word: WordData;
  question: string;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
}

// ==================== Practice Types ====================
export type PracticeType = 'reading' | 'articles' | 'cloze' | 'context' | 'multi_select' | 'listening' | 'grammar';

export interface PracticeQuestion {
  id: string;
  type: PracticeType;
  question: string;
  options?: string[];
  correctAnswer: string;
  articleContent?: string;
  audioUrl?: string;
  explanation?: string;
}

export interface PracticeResult {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  score: number;
}

// ==================== Report Types ====================
export interface DailyStatsData {
  date: string;
  studyMinutes: number;
  newWords: number;
  reviewedWords: number;
  totalWords: number;
  errorWords: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalStudyMinutes: number;
  totalNewWords: number;
  averageReviewRate: number;
  averagePracticeAccuracy: number;
  dailyStats: DailyStatsData[];
  weakWords: { word: WordData; errorRate: number }[];
  masteryDistribution: { stage: number; count: number }[];
}

// ==================== Ebbinghaus Types ====================
export interface EbbinghausStage {
  stage: number;
  label: string;
  interval: number;
  display: string;
}

export interface ReviewSchedule {
  date: string;
  day: number;
  newWords: boolean;
  reviewStages: number[];
  wordsCount?: number;
}

// ==================== Error Word Types ====================
export interface ErrorWordData {
  id: string;
  userId: string;
  wordId: string;
  word?: WordData;
  errorCount: number;
  note: string | null;
  createdAt: string;
}

// ==================== Article Types ====================
export interface ArticleData {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  articleType: string;
  level: string;
  source: string | null;
  wordCount: number;
  questions: string | null;
  keywords: string | null;
  audioUrl: string | null;
}

// ==================== Root Affix Types ====================
export interface RootAffixData {
  id: string;
  root: string;
  type: 'prefix' | 'suffix' | 'root';
  meaning: string;
  origin: string | null;
  examples: string | null;
  description: string | null;
}

// ==================== Grammar Types ====================
export interface GrammarPointData {
  id: string;
  title: string;
  category: string;
  content: string;
  examples: string | null;
  exercises: string | null;
  difficulty: string | null;
  orderIndex: number;
}

// ==================== API Response Types ====================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== Assessment Types ====================
export interface AssessmentResult {
  totalWords: number;
  knownWords: number;
  vocabularyLevel: string;
  score: number;
  details: {
    byLevel: { level: string; count: number; correct: number }[];
    weakCategories: string[];
  };
}

// ==================== Global Settings Types ====================
export type FontSizeLevel = 1 | 2 | 3 | 4 | 5;
export type ThemeMode = 'light' | 'dark' | 'green' | 'gray';

export interface GlobalSettings {
  fontSizeLevel: FontSizeLevel;
  themeMode: ThemeMode;
  isMuted: boolean;
  mascotId: string;
  accent: 'US' | 'UK';
}

// ==================== Learning Session Types ====================
export interface NewWordPreTest {
  wordId: string;
  word: WordData;
  isKnown: boolean | null;
}

export interface LearningSessionResult {
  totalWords: number;
  learnedCount: number;
  masteredCount: number;
  errorCount: number;
  accuracy: number;
  duration: number;
}
