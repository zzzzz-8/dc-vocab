'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  HiOutlinePuzzlePiece, HiOutlineSpeakerWave, HiOutlineStar,
  HiOutlineArrowPath, HiOutlineXMark, HiOutlineBookOpen,
  HiOutlineStop, HiOutlineArrowRight,
} from 'react-icons/hi2';
import { useUserStore, useLearningStore, useToastStore, useSettingsStore } from '@/lib/store';
import { speak } from '@/lib/voice';
import { shuffleArray } from '@/lib/utils';
import { getStageColor } from '@/lib/ebbinghaus';
import WordItem from '@/components/word/WordItem';
import Mascot from '@/components/common/Mascot';
import type { WordData } from '@/types';

// 8个复习阶段格子位置（从中心向外围的顺序）
const GRID_POSITIONS = [
  { stage: 0, row: 1, col: 1, label: '中心', color: '#FF6B6B' },    // 中心 - 起点
  { stage: 1, row: 0, col: 1, label: '5分钟', color: '#FF8E8E' },    // 上
  { stage: 2, row: 1, col: 2, label: '30分钟', color: '#FDCB6E' },   // 右
  { stage: 3, row: 2, col: 1, label: '12小时', color: '#FFE66D' },   // 下
  { stage: 4, row: 1, col: 0, label: '1天', color: '#4ECDC4' },      // 左
  { stage: 5, row: 0, col: 0, label: '2天', color: '#55EFC4' },      // 左上
  { stage: 6, row: 0, col: 2, label: '4天', color: '#A29BFE' },      // 右上
  { stage: 7, row: 2, col: 0, label: '7天', color: '#74B9FF' },      // 左下
  { stage: 8, row: 2, col: 2, label: '15天', color: '#00B894' },     // 右下 → 掌握
];

interface GameWord {
  word: WordData;
  currentStage: number; // 0-8, 0=中心, 8=已掌握
  correctCount: number;
  errorCount: number;
}

type GameSource = 'all' | 'error' | 'learned' | 'book';

export default function CyclePage() {
  const { isLoggedIn } = useUserStore();
  const { currentWordBookId, currentWordBookName } = useLearningStore();
  const { addToast } = useToastStore();
  const { accent, isMuted } = useSettingsStore();
  const router = useRouter();

  // 页面阶段: setup | playing | complete
  const [phase, setPhase] = useState<'setup' | 'playing' | 'complete'>('setup');
  const [gameWords, setGameWords] = useState<GameWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ correct: 0, error: 0 });
  const [source, setSource] = useState<GameSource>('all');
  const [loading, setLoading] = useState(false);
  const [showWordDetail, setShowWordDetail] = useState(false);

  const currentWord = gameWords[currentWordIndex];

  // 获取单词
  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      let words: WordData[] = [];
      let endpoint = '/api/learn/review?limit=30';

      if (source === 'error') {
        const res = await fetch('/api/tools/error-book');
        const data = await res.json();
        if (data.success) words = data.data.map((e: any) => e.word).filter(Boolean);
      } else if (source === 'learned') {
        const res = await fetch('/api/learn/learned?pageSize=50');
        const data = await res.json();
        if (data.success) words = data.data.map((r: any) => r.word).filter(Boolean);
      } else {
        const res = await fetch(endpoint);
        const data = await res.json();
        if (data.success) words = data.data.map((r: any) => r.word).filter(Boolean);
      }

      if (words.length === 0) {
        addToast('没有找到可用的单词', 'warning');
        return;
      }

      // 初始化为游戏单词
      const gameW = shuffleArray(words).slice(0, 20).map(w => ({
        word: w,
        currentStage: 0,
        correctCount: 0,
        errorCount: 0,
      }));
      setGameWords(gameW);
      setCurrentWordIndex(0);
      setStats({ correct: 0, error: 0 });
      generateOptions(gameW[0]);
      setPhase('playing');
    } catch {}
    setLoading(false);
  }, [source, addToast]);

  // 生成选项（英译中）
  const generateOptions = useCallback((gw: GameWord) => {
    if (!gw) return;
    const distractors = gameWords
      .filter(g => g.word.id !== gw.word.id)
      .slice(0, 3)
      .map(g => g.word.definition);

    const opts = shuffleArray([gw.word.definition, ...distractors]);
    setOptions(opts);
  }, [gameWords]);

  // 提交答案
  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentWord.word.definition;
    const newStats = {
      correct: stats.correct + (isCorrect ? 1 : 0),
      error: stats.error + (isCorrect ? 0 : 1),
    };
    setStats(newStats);

    // 更新单词位置
    setGameWords(prev => prev.map((gw, i) => {
      if (i !== currentWordIndex) return gw;

      if (isCorrect) {
        // 答对：向外移动一格
        const newStage = Math.min(gw.currentStage + 1, 8);
        const mastered = newStage >= 8;
        return {
          ...gw,
          currentStage: newStage,
          correctCount: gw.correctCount + 1,
        };
      } else {
        // 答错：退回中心
        return {
          ...gw,
          currentStage: 0,
          errorCount: gw.errorCount + 1,
        };
      }
    }));

    // 提交到后端
    try {
      fetch('/api/learn/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: currentWord.word.id,
          isCorrect,
          stage: currentWord.currentStage,
        }),
      });
    } catch {}
  };

  // 下一词
  const nextWord = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setShowWordDetail(false);

    const nextIndex = currentWordIndex + 1;
    if (nextIndex < gameWords.length) {
      setCurrentWordIndex(nextIndex);
      generateOptions(gameWords[nextIndex]);
    } else {
      setPhase('complete');
      addToast(`循环记忆完成！正确率 ${Math.round(stats.correct / Math.max(stats.correct + stats.error, 1) * 100)}%`, 'success');
    }
  };

  // 播放发音
  const playWord = () => {
    if (!isMuted && currentWord) {
      speak(currentWord.word.word, accent === 'US' ? 'US' : 'UK', 0.9, 1);
    }
  };

  // 获取当前单词在网格中的位置
  const stagePos = GRID_POSITIONS.find(p => p.stage === (currentWord?.currentStage || 0));

  // ==================== 设置页面 ====================
  if (phase === 'setup') {
    const sources: { id: GameSource; label: string; icon: string; desc: string }[] = [
      { id: 'all', label: '全部复习', icon: '🔄', desc: '所有待复习单词' },
      { id: 'error', label: '错词本', icon: '❌', desc: '错词本中的单词' },
      { id: 'learned', label: '已学词', icon: '✅', desc: '已学过的单词' },
      { id: 'book', label: '当前词书', icon: '📖', desc: `${currentWordBookName || '当前词书'} 子集` },
    ];

    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <HiOutlinePuzzlePiece className="w-5 h-5 text-[#A29BFE]" />
          <h2 className="text-lg font-extrabold text-gray-800">循环记 · 九宫格</h2>
        </div>

        <div className="card p-5 bg-gradient-to-br from-[#F8F0FF] to-[#FFF0F0]">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎯</span>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">游戏规则</h3>
              <p className="text-xs text-gray-500">单词答对向外移动一格，答错退回中心原点</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 max-w-[180px] mx-auto">
            {GRID_POSITIONS.map((p) => (
              <div key={p.stage} className="aspect-square rounded-lg flex items-center justify-center text-[8px] font-bold text-white"
                style={{ backgroundColor: p.color, opacity: p.stage === 0 ? 1 : 0.7 }}
              >
                {p.stage === 0 ? '🎯' : p.label}
              </div>
            ))}
          </div>
        </div>

        <h3 className="font-bold text-gray-700 text-sm">选择词集</h3>
        <div className="grid grid-cols-1 gap-2">
          {sources.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSource(s.id); fetchWords(); }}
              disabled={s.id === 'book' && !currentWordBookId}
              className={`card p-4 flex items-center gap-3 text-left hover:shadow-lg transition-all ${
                s.id === 'book' && !currentWordBookId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <span className="text-2xl">{s.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-sm">{s.label}</div>
                <div className="text-xs text-gray-500">{s.desc}</div>
              </div>
              <HiOutlineArrowRight className="w-5 h-5 text-gray-300" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ==================== 游戏进行中 ====================
  if (phase === 'playing') {
    if (!currentWord) {
      return (
        <div className="text-center py-16">
          <Mascot expression="happy" size="md" />
          <p className="text-gray-500 mt-3">加载单词中...</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 max-w-lg mx-auto">
        {/* 顶部统计 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
              <HiOutlinePuzzlePiece className="w-5 h-5 text-[#A29BFE]" />
              循环记
            </h2>
            <p className="text-xs text-gray-500">
              {currentWordIndex + 1}/{gameWords.length} 词
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[#4ECDC4] font-bold">✓ {stats.correct}</span>
            <span className="text-[#FF6B6B] font-bold">✗ {stats.error}</span>
            <span className="text-gray-500 text-xs">
              {stats.correct + stats.error > 0
                ? `${Math.round(stats.correct / (stats.correct + stats.error) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

        {/* 3×3 九宫格 */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-2 max-w-[320px] mx-auto">
            {GRID_POSITIONS.map((pos) => {
              const isCenter = pos.stage === 0;
              const isCurrentPos = pos.stage === (currentWord?.currentStage || 0);
              const mastered = currentWord?.currentStage >= 8;

              return (
                <div
                  key={pos.stage}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
                    isCurrentPos && !mastered
                      ? 'scale-110 shadow-lg ring-2 ring-offset-2 z-10'
                      : 'scale-100'
                  }`}
                  style={{
                    backgroundColor: isCurrentPos && !mastered ? pos.color : `${pos.color}22`,
                    borderColor: pos.color,
                    borderWidth: 2,
                    ringColor: isCurrentPos ? pos.color : 'transparent',
                  }}
                >
                  {isCurrentPos && !mastered ? (
                    <>
                      <span className="text-lg font-bold text-white">{currentWord.word.word}</span>
                      {currentWord.currentStage > 0 && (
                        <span className="text-[8px] text-white/80 mt-0.5">{pos.label}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold" style={{ color: pos.color }}>
                        {pos.stage === 0 ? '🎯' : pos.stage === 8 ? '🏆' : pos.label}
                      </span>
                      {/* 显示已掌握的单词 */}
                      {mastered && pos.stage === 8 && isCurrentPos && (
                        <span className="text-[9px] text-white mt-0.5 font-bold">已掌握!</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* 连线提示 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-dashed border-gray-200 rounded-full opacity-30" />
          </div>
        </div>

        {/* 当前单词信息 */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <button onClick={playWord} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#FF6B6B]">
              <HiOutlineSpeakerWave className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold text-gray-800">{currentWord.word.word}</span>
          </div>
          <p className="text-xs text-gray-400">
            {currentWord.word.phoneticUS && `/${currentWord.word.phoneticUS}/`}
            {currentWord.word.partOfSpeech && ` · [${currentWord.word.partOfSpeech}]`}
          </p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: getStageColor(currentWord.currentStage), color: 'white' }}>
              第 {currentWord.currentStage}/8 格
            </span>
            {currentWord.errorCount > 0 && (
              <span className="text-xs text-red-500">错误 {currentWord.errorCount} 次</span>
            )}
          </div>
        </div>

        {/* 选择题 */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 text-center font-medium">选择正确的中文释义</p>
          {options.map((opt, i) => {
            const isSelected = selectedAnswer === opt;
            const isCorrectAnswer = opt === currentWord.word.definition;
            let btnClass = 'card p-3 text-center hover:shadow-md transition-all cursor-pointer text-sm w-full';

            if (showResult) {
              if (isCorrectAnswer) {
                btnClass += ' ring-2 ring-green-500 bg-green-50';
              } else if (isSelected && !isCorrectAnswer) {
                btnClass += ' ring-2 ring-red-500 bg-red-50';
              } else {
                btnClass += ' opacity-50';
              }
            }

            return (
              <button
                key={i}
                onClick={() => !showResult && handleAnswer(opt)}
                disabled={showResult}
                className={btnClass}
              >
                <span className="text-gray-700">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* 反馈 */}
        {showResult && (
          <div className={`p-3 rounded-xl text-sm ${
            selectedAnswer === currentWord.word.definition
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold">
                {selectedAnswer === currentWord.word.definition ? '✅ 正确！向外移动一格' : '❌ 错误！退回中心'}
              </span>
              <button onClick={() => setShowWordDetail(!showWordDetail)} className="text-xs underline">
                {showWordDetail ? '收起' : '查看释义'}
              </button>
            </div>

            {/* 展开详细词条 */}
            {showWordDetail && (
              <div className="mt-2 pt-2 border-t border-white/30">
                <WordItem word={currentWord.word} mode="list" showPhonetic={true} />
              </div>
            )}

            <button
              onClick={nextWord}
              className="mt-2 w-full py-2 bg-white/50 rounded-lg text-sm font-bold hover:bg-white/80 transition-colors"
            >
              {currentWordIndex < gameWords.length - 1 ? '下一词 →' : '查看结果 🎉'}
            </button>
          </div>
        )}

        {/* 辅助操作 */}
        <div className="flex justify-center gap-2">
          <button
            onClick={playWord}
            className="btn-outline text-xs"
          >
            <HiOutlineSpeakerWave className="w-3.5 h-3.5" />
            发音
          </button>
          <button
            onClick={() => setShowWordDetail(!showWordDetail)}
            className="btn-outline text-xs"
          >
            <HiOutlineBookOpen className="w-3.5 h-3.5" />
            释义
          </button>
          <button
            onClick={() => {
              addToast('已加入错词本', 'success');
              fetch('/api/tools/error-book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wordId: currentWord.word.id }),
              });
            }}
            className="btn-outline text-xs text-red-500 border-red-200"
          >
            <HiOutlineXMark className="w-3.5 h-3.5" />
            错词本
          </button>
        </div>
      </div>
    );
  }

  // ==================== 完成页 ====================
  if (phase === 'complete') {
    const total = stats.correct + stats.error;
    const accuracy = total > 0 ? Math.round(stats.correct / total * 100) : 0;

    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <Mascot expression="celebrate" size="lg" />
        <h2 className="text-2xl font-extrabold text-gray-800">循环记忆完成！🎉</h2>

        <div className="card p-6 w-full max-w-sm text-center space-y-4">
          <div className="flex justify-center gap-8">
            <div>
              <div className="text-2xl font-extrabold text-[#4ECDC4]">{stats.correct}</div>
              <div className="text-xs text-gray-500">答对</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#FF6B6B]">{stats.error}</div>
              <div className="text-xs text-gray-500">错误</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#A29BFE]">{accuracy}%</div>
              <div className="text-xs text-gray-500">正确率</div>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${accuracy}%` }} />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setPhase('setup'); }} className="btn-primary text-sm">
            <HiOutlineArrowPath className="w-4 h-4" />
            再来一次
          </button>
          <button onClick={() => router.push('/learn/review')} className="btn-secondary text-sm">
            去复习
          </button>
          <button onClick={() => window.print()} className="btn-outline text-sm">
            打印结果
          </button>
        </div>
      </div>
    );
  }
}
