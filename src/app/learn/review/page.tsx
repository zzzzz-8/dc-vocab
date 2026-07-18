'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  HiOutlineArrowPath, HiOutlineClock, HiOutlineCheckCircle,
  HiOutlineXCircle, HiOutlineArrowRight, HiOutlineSpeakerWave,
  HiOutlinePencilSquare, HiOutlineListBullet,
} from 'react-icons/hi2';
import { useUserStore, useLearningStore, useToastStore, useSettingsStore } from '@/lib/store';
import { speak } from '@/lib/voice';
import { shuffleArray } from '@/lib/utils';
import Mascot from '@/components/common/Mascot';
import Confetti from '@/components/common/Confetti';
import WordItem from '@/components/word/WordItem';
import type { WordData, ReviewQuestion, ReviewQuestionType } from '@/types';

// 复习题型配置
const QUESTION_TYPES: { type: ReviewQuestionType; label: string; icon: React.ReactNode }[] = [
  { type: 'en2cn', label: '英译中', icon: <HiOutlineListBullet className="w-4 h-4" /> },
  { type: 'cn2en', label: '中译英', icon: <HiOutlineListBullet className="w-4 h-4" /> },
  { type: 'spelling', label: '拼写', icon: <HiOutlinePencilSquare className="w-4 h-4" /> },
  { type: 'listening', label: '听音', icon: <HiOutlineSpeakerWave className="w-4 h-4" /> },
  { type: 'discrimination', label: '辨析', icon: <HiOutlineArrowPath className="w-4 h-4" /> },
];

interface ReviewWord {
  id: number;
  wordId: number;
  word: WordData;
  stage: number;
  nextReviewAt: string;
  reviewedCount: number;
}

interface DashboardData {
  totalDue: number;
  overdueCount: number;
  groups: { key: string; label: string; stage: number; color: string; count: number }[];
}

export default function ReviewPage() {
  const { isLoggedIn } = useUserStore();
  const { accent } = useLearningStore();
  const { isMuted } = useSettingsStore();
  const { addToast } = useToastStore();
  const router = useRouter();

  // 页面阶段: dashboard | review | complete
  const [phase, setPhase] = useState<'dashboard' | 'review' | 'complete'>('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [reviewWords, setReviewWords] = useState<ReviewWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  // 获取首页看板数据
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/learn/review?dashboard=true');
      const data = await res.json();
      if (data.success) setDashboard(data.data);
    } catch {}
    setLoading(false);
  }, []);

  // 获取复习单词（按阶段或全部）
  const fetchReviewWords = useCallback(async (stage: number | null = null) => {
    setLoading(true);
    try {
      const url = stage !== null
        ? `/api/learn/review?stage=${stage}&limit=20`
        : '/api/learn/review?limit=20';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReviewWords(data.data);
        setCurrentIndex(0);
        setStats({ correct: 0, total: 0 });
        setSessionComplete(false);
        // 生成复习题目
        generateQuestions(data.data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return; }
    fetchDashboard();
  }, [isLoggedIn, fetchDashboard]);

  // 生成混合题型
  const generateQuestions = (words: ReviewWord[]) => {
    const qs: ReviewQuestion[] = [];
    const types: ReviewQuestionType[] = ['en2cn', 'cn2en', 'spelling', 'listening', 'discrimination'];

    words.forEach((item, index) => {
      const type = types[index % types.length];
      const word = item.word;

      switch (type) {
        case 'en2cn':
          qs.push({
            id: `q-${index}`,
            type: 'en2cn',
            word,
            question: `"${word.word}" 的中文意思是？`,
            options: generateDistractors(word, words, 'definition'),
            correctAnswer: word.definition,
          });
          break;

        case 'cn2en':
          qs.push({
            id: `q-${index}`,
            type: 'cn2en',
            word,
            question: `"${word.definition}" 的英文是？`,
            options: generateDistractors(word, words, 'word'),
            correctAnswer: word.word,
          });
          break;

        case 'spelling':
          qs.push({
            id: `q-${index}`,
            type: 'spelling',
            word,
            question: `请拼写: "${word.definition}"`,
            correctAnswer: word.word,
          });
          break;

        case 'listening': {
          // 播放发音
          if (!isMuted) {
            setTimeout(() => {
              speak(word.word, accent === 'US' ? 'US' : 'UK', 0.8, 1);
            }, 100);
          }
          qs.push({
            id: `q-${index}`,
            type: 'listening',
            word,
            question: `请选择你听到的单词`,
            options: generateDistractors(word, words, 'word'),
            correctAnswer: word.word,
          });
          break;
        }

        case 'discrimination':
          qs.push({
            id: `q-${index}`,
            type: 'discrimination',
            word,
            question: `选择与 "${word.word}" 词义最接近的选项`,
            options: generateDistractors(word, words, 'definition'),
            correctAnswer: word.definition,
          });
          break;
      }
    });

    setQuestions(shuffleArray(qs));
  };

  // 生成干扰选项
  const generateDistractors = (currentWord: WordData, allWords: ReviewWord[], field: 'word' | 'definition'): string[] => {
    const distractors = allWords
      .filter(w => w.word.id !== currentWord.id)
      .map(w => field === 'word' ? w.word.word : w.word.definition)
      .filter(Boolean);
    const shuffled = shuffleArray(distractors);
    const selected = shuffled.slice(0, 3);

    const correct = field === 'word' ? currentWord.word : currentWord.definition;
    const options = shuffleArray([correct, ...selected]);
    return options;
  };

  // 开始复习
  const startReview = (stage: number | null = null) => {
    setSelectedStage(stage);
    setPhase('review');
    fetchReviewWords(stage);
  };

  // 提交答案
  const submitAnswer = async (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const question = questions[currentIndex];
    const isCorrect = answer === question.correctAnswer;

    const newStats = {
      correct: stats.correct + (isCorrect ? 1 : 0),
      total: stats.total + 1,
    };
    setStats(newStats);

    // 提交到后端
    try {
      await fetch('/api/learn/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: question.word.id, isCorrect, responseTime: 3 }),
      });
    } catch {}
  };

  // 下一题
  const nextQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSessionComplete(true);
      if (stats.correct / Math.max(stats.total, 1) >= 0.8) {
        setShowConfetti(true);
      }
      addToast(`复习完成！正确率 ${Math.round(stats.correct / Math.max(stats.total, 1) * 100)}%`, 'success');
    }
  };

  // 播放发音（听力题重新播放）
  const playAudio = () => {
    if (!isMuted && questions[currentIndex]) {
      speak(questions[currentIndex].word.word, accent === 'US' ? 'US' : 'UK', 0.8, 1);
    }
  };

  // ==================== 看板页面 ====================
  if (phase === 'dashboard') {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-[#4ECDC4]/30 border-t-[#4ECDC4] rounded-full animate-spin" />
        </div>
      );
    }

    const hasReview = dashboard && dashboard.totalDue > 0;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
            <HiOutlineArrowPath className="w-5 h-5 text-[#4ECDC4]" />
            抗遗忘复习
          </h2>
          <span className="text-xs text-gray-400">艾宾浩斯记忆曲线</span>
        </div>

        {!hasReview ? (
          <div className="flex flex-col items-center py-16 space-y-4">
            <Mascot expression="happy" size="lg" />
            <h3 className="text-lg font-bold text-gray-700">暂无需要复习的单词 🎉</h3>
            <p className="text-gray-500 text-sm">去学习一些新单词再来复习吧！</p>
            <button onClick={() => router.push('/learn/new-words')} className="btn-primary text-sm">
              去学新词
            </button>
          </div>
        ) : (
          <>
            {/* 总览 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4 text-center">
                <div className="text-2xl font-extrabold text-[#4ECDC4]">{dashboard!.totalDue}</div>
                <div className="text-xs text-gray-500">今日待复习</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-extrabold text-[#FF6B6B]">{dashboard!.overdueCount}</div>
                <div className="text-xs text-gray-500">超期未复习</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-extrabold text-[#A29BFE]">
                  {dashboard!.groups.length}
                </div>
                <div className="text-xs text-gray-500">复习阶段</div>
              </div>
            </div>

            {/* 超期提醒 */}
            {dashboard!.overdueCount > 0 && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                <HiOutlineClock className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">
                  有 <span className="font-bold">{dashboard!.overdueCount}</span> 个单词已超期未复习，
                  请优先完成复习
                </p>
              </div>
            )}

            {/* 按阶段分组复习 */}
            <h3 className="font-bold text-gray-700 text-sm">按阶段复习</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {dashboard!.groups.filter(g => g.count > 0).map((group) => (
                <button
                  key={group.key}
                  onClick={() => startReview(group.stage)}
                  className="card p-3 text-center hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="text-xl font-extrabold" style={{ color: group.color }}>
                    {group.count}
                  </div>
                  <div className="text-xs text-gray-500">{group.label}</div>
                </button>
              ))}
            </div>

            {/* 开始全部复习 */}
            <button
              onClick={() => startReview(null)}
              className="btn-primary w-full justify-center py-3 text-sm"
            >
              <HiOutlineArrowPath className="w-4 h-4" />
              开始全部复习 ({dashboard!.totalDue}词)
            </button>
          </>
        )}
      </div>
    );
  }

  // ==================== 复习答题页 ====================
  if (phase === 'review') {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-[#4ECDC4]/30 border-t-[#4ECDC4] rounded-full animate-spin" />
        </div>
      );
    }

    if (reviewWords.length === 0 && !sessionComplete) {
      return (
        <div className="text-center py-16">
          <Mascot expression="happy" size="md" />
          <h3 className="text-lg font-bold text-gray-700 mt-3">该阶段暂无待复习单词</h3>
          <button onClick={() => setPhase('dashboard')} className="btn-primary mt-4 text-sm">
            返回看板
          </button>
        </div>
      );
    }

    if (sessionComplete) {
      const accuracy = stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0;
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Confetti active={showConfetti} />
          <Mascot expression="celebrate" size="lg" />
          <h2 className="text-xl font-extrabold text-gray-800">复习完成！🎉</h2>

          <div className="card p-6 w-full max-w-sm space-y-3">
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-[#4ECDC4]">{stats.correct}</div>
                <div className="text-xs text-gray-500">正确</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold text-[#E17055]">{stats.total - stats.correct}</div>
                <div className="text-xs text-gray-500">错误</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold text-[#FF6B6B]">{accuracy}%</div>
                <div className="text-xs text-gray-500">正确率</div>
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${accuracy}%` }} />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPhase('dashboard')} className="btn-primary text-sm">
              <HiOutlineArrowPath className="w-4 h-4" />
              返回看板
            </button>
            <button onClick={() => router.push('/learn/new-words')} className="btn-secondary text-sm">
              学新词
            </button>
          </div>
        </div>
      );
    }

    const question = questions[currentIndex];
    if (!question) {
      return <div className="py-12 text-center text-gray-400">加载题目中...</div>;
    }

    // ===== 拼写题型 =====
    if (question.type === 'spelling') {
      return <SpellingQuestion
        question={question}
        currentIndex={currentIndex}
        total={questions.length}
        stats={stats}
        selectedAnswer={selectedAnswer}
        showResult={showResult}
        onSubmit={submitAnswer}
        onNext={nextQuestion}
        onBack={() => setPhase('dashboard')}
      />;
    }

    // ===== 选择题型（en2cn, cn2en, listening, discrimination）=====
    return <ChoiceQuestion
      question={question}
      currentIndex={currentIndex}
      total={questions.length}
      stats={stats}
      selectedAnswer={selectedAnswer}
      showResult={showResult}
      onSubmit={submitAnswer}
      onNext={nextQuestion}
      onBack={() => setPhase('dashboard')}
      onPlayAudio={question.type === 'listening' ? playAudio : undefined}
      word={question.word}
      reviewItems={reviewWords}
    />;
  }

  // ==================== 完成页（从看板直达） ====================
  if (phase === 'complete') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Mascot expression="celebrate" size="lg" />
        <h2 className="text-xl font-extrabold text-gray-800">复习完成！🎉</h2>
        <div className="flex gap-3">
          <button onClick={() => { setPhase('dashboard'); fetchDashboard(); }} className="btn-primary text-sm">
            返回看板
          </button>
          <button onClick={() => router.push('/learn/new-words')} className="btn-secondary text-sm">
            学新词
          </button>
        </div>
      </div>
    );
  }
}

// ==================== 选择题组件 ====================
function ChoiceQuestion({
  question, currentIndex, total, stats, selectedAnswer, showResult,
  onSubmit, onNext, onBack, onPlayAudio, word, reviewItems,
}: {
  question: ReviewQuestion;
  currentIndex: number;
  total: number;
  stats: { correct: number; total: number };
  selectedAnswer: string | null;
  showResult: boolean;
  onSubmit: (answer: string) => void;
  onNext: () => void;
  onBack: () => void;
  onPlayAudio?: () => void;
  word: WordData;
  reviewItems: ReviewWord[];
}) {
  const typeLabel = QUESTION_TYPES.find(t => t.type === question.type)?.label || '选择题';
  const typeIcon = QUESTION_TYPES.find(t => t.type === question.type)?.icon;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <HiOutlineArrowRight className="w-4 h-4 text-gray-500 rotate-180" />
          </button>
          <div>
            <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
              {typeIcon}
              复习 · {typeLabel}
            </h2>
            <p className="text-xs text-gray-500">第 {currentIndex + 1}/{total} 题</p>
          </div>
        </div>
        <span className="text-sm font-bold text-[#4ECDC4]">{stats.correct}/{stats.total}</span>
      </div>

      {/* 进度条 */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${((currentIndex) / total) * 100}%` }} />
      </div>

      {/* 听力题播放按钮 */}
      {question.type === 'listening' && (
        <button
          onClick={onPlayAudio}
          className="w-full p-6 bg-gradient-to-r from-[#FFF0F0] to-[#FFF8F0] rounded-xl flex items-center justify-center gap-3 hover:shadow-md transition-all"
        >
          <HiOutlineSpeakerWave className="w-8 h-8 text-[#FF6B6B] animate-pulse" />
          <span className="font-bold text-gray-700">点击重新播放 👂</span>
        </button>
      )}

      {/* 题目 */}
      <div className="card p-5">
        <p className="text-center text-gray-700 font-medium text-base">{question.question}</p>
      </div>

      {/* 选项 */}
      <div className="space-y-2">
        {question.options?.map((option, i) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === question.correctAnswer;
          let btnClass = 'card p-3 text-center hover:shadow-md transition-all cursor-pointer text-sm';

          if (showResult) {
            if (isCorrect) {
              btnClass += ' ring-2 ring-green-500 bg-green-50';
            } else if (isSelected && !isCorrect) {
              btnClass += ' ring-2 ring-red-500 bg-red-50';
            } else {
              btnClass += ' opacity-50';
            }
          }

          return (
            <button
              key={i}
              onClick={() => !showResult && onSubmit(option)}
              disabled={showResult}
              className={btnClass}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className={`flex-1 ${showResult && isCorrect ? 'text-green-700 font-bold' : 'text-gray-700'}`}>
                  {option}
                </span>
                {showResult && isCorrect && <HiOutlineCheckCircle className="w-5 h-5 text-green-500" />}
                {showResult && isSelected && !isCorrect && <HiOutlineXCircle className="w-5 h-5 text-red-500" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* 反馈区域 */}
      {showResult && (
        <div className={`p-3 rounded-xl text-sm ${
          selectedAnswer === question.correctAnswer
            ? 'bg-green-50 text-green-700 border border-green-100'
            : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          <div className="flex items-center gap-2 font-bold mb-1">
            {selectedAnswer === question.correctAnswer ? '✅ 正确！' : '❌ 错误！'}
          </div>
          <p className="text-xs opacity-80">正确答案：{question.correctAnswer}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-bold text-sm">{question.word.word}</span>
            <span className="text-xs text-gray-500">[{question.word.partOfSpeech}] {question.word.definition}</span>
          </div>
        </div>
      )}

      {/* 下一题按钮 */}
      {showResult && (
        <button onClick={onNext} className="btn-primary w-full justify-center py-3 text-sm">
          {currentIndex < total - 1 ? (
            <>下一题 <HiOutlineArrowRight className="w-4 h-4" /></>
          ) : (
            '查看结果 🎉'
          )}
        </button>
      )}
    </div>
  );
}

// ==================== 拼写题组件 ====================
function SpellingQuestion({
  question, currentIndex, total, stats, selectedAnswer, showResult,
  onSubmit, onNext, onBack,
}: {
  question: ReviewQuestion;
  currentIndex: number;
  total: number;
  stats: { correct: number; total: number };
  selectedAnswer: string | null;
  showResult: boolean;
  onSubmit: (answer: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    onSubmit(inputValue.trim());
  };

  const correctWord = question.word.word;
  const isCorrect = selectedAnswer?.toLowerCase() === correctWord.toLowerCase();

  // 用下划线显示正确拼写
  const displayCorrectAnswer = (() => {
    if (!showResult) return null;
    return correctWord.split('').map((char, i) => {
      const userChar = selectedAnswer?.[i] || '';
      const match = userChar.toLowerCase() === char.toLowerCase();
      return { char, match, index: i };
    });
  })();

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <HiOutlineArrowRight className="w-4 h-4 text-gray-500 rotate-180" />
          </button>
          <div>
            <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
              <HiOutlinePencilSquare className="w-5 h-5 text-[#A29BFE]" />
              复习 · 拼写
            </h2>
            <p className="text-xs text-gray-500">第 {currentIndex + 1}/{total} 题</p>
          </div>
        </div>
        <span className="text-sm font-bold text-[#4ECDC4]">{stats.correct}/{stats.total}</span>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(currentIndex / total) * 100}%` }} />
      </div>

      {/* 题目 */}
      <div className="card p-5 text-center">
        <p className="text-gray-500 text-xs mb-2">请根据中文释义拼写单词</p>
        <p className="text-xl font-bold text-gray-800">{question.question.replace('请拼写: "', '').replace('"', '')}</p>
        {question.word.partOfSpeech && (
          <span className="text-xs text-gray-400">[{question.word.partOfSpeech}]</span>
        )}
      </div>

      {/* 输入框 */}
      {!showResult ? (
        <div className="space-y-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="输入单词拼写..."
            className="input-field text-center text-lg py-4 font-mono"
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-50"
          >
            提交
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 拼写检查结果 */}
          <div className={`card p-5 text-center ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
            {isCorrect ? (
              <>
                <HiOutlineCheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-bold text-lg">✓ 拼写正确！</p>
              </>
            ) : (
              <>
                <HiOutlineXCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 font-bold mb-2">✗ 拼写错误</p>
                <div className="flex justify-center gap-1 text-2xl font-mono">
                  {displayCorrectAnswer?.map((c, i) => (
                    <span key={i} className={c.match ? 'text-green-600' : 'text-red-500 underline'}>
                      {c.char}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <button onClick={onNext} className="btn-primary w-full justify-center py-3 text-sm">
            {currentIndex < total - 1 ? (
              <>下一题 <HiOutlineArrowRight className="w-4 h-4" /></>
            ) : (
              '查看结果 🎉'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
