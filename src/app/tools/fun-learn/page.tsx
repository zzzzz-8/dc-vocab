'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { HiOutlinePuzzlePiece, HiOutlineArrowPath } from 'react-icons/hi2';
import { speak } from '@/lib/voice';
import { useLearningStore, useToastStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';

// ==================== Shared Word Pool ====================
const wordPool = [
  { en: 'apple', zh: '苹果' }, { en: 'book', zh: '书' }, { en: 'cat', zh: '猫' },
  { en: 'dog', zh: '狗' }, { en: 'fish', zh: '鱼' }, { en: 'good', zh: '好的' },
  { en: 'happy', zh: '快乐' }, { en: 'school', zh: '学校' }, { en: 'teacher', zh: '老师' },
  { en: 'water', zh: '水' }, { en: 'beautiful', zh: '美丽' }, { en: 'challenge', zh: '挑战' },
  { en: 'different', zh: '不同' }, { en: 'education', zh: '教育' }, { en: 'familiar', zh: '熟悉' },
  { en: 'generous', zh: '慷慨' }, { en: 'history', zh: '历史' }, { en: 'important', zh: '重要' },
  { en: 'knowledge', zh: '知识' }, { en: 'language', zh: '语言' }, { en: 'morning', zh: '早上' },
  { en: 'night', zh: '晚上' }, { en: 'people', zh: '人们' }, { en: 'family', zh: '家庭' },
  { en: 'friend', zh: '朋友' }, { en: 'garden', zh: '花园' }, { en: 'holiday', zh: '假日' },
  { en: 'island', zh: '岛屿' }, { en: 'journey', zh: '旅程' }, { en: 'kitchen', zh: '厨房' },
];

const GAMES = [
  { id: 'matching', name: '单词连连看', emoji: '🎮', desc: '点击配对单词和释义', color: '#FF6B6B' },
  { id: 'puzzle', name: '单词拼图', emoji: '🧩', desc: '拼凑字母成单词', color: '#00B894' },
  { id: 'levels', name: '单词大闯关', emoji: '🏰', desc: '答题闯关升级', color: '#FDCB6E' },
  { id: 'quiz', name: '单词猜猜看', emoji: '🎯', desc: '根据描述猜单词', color: '#A29BFE' },
  { id: 'speed', name: '单词赛车', emoji: '🏎️', desc: '快速回答单词释义', color: '#E17055' },
  { id: 'match-pairs', name: '单词消消乐', emoji: '💥', desc: '消除匹配的单词对', color: '#4ECDC4' },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ==================== Game 1: 单词连连看 (Word Matching) ====================
function MatchingGame({ onBack }: { onBack: () => void }) {
  const { accent } = useLearningStore();
  const { addToast } = useToastStore();
  const [cards, setCards] = useState<{ id: number; text: string; type: 'en' | 'zh'; pairId: number; matched: boolean; flipped: boolean }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [completed, setCompleted] = useState(false);
  const lockRef = useRef(false);

  useEffect(() => {
    const selectedWords = shuffle(wordPool).slice(0, 6);
    const newCards = shuffle(
      selectedWords.flatMap((w, i) => [
        { id: i * 2, text: w.en, type: 'en' as const, pairId: i, matched: false, flipped: false },
        { id: i * 2 + 1, text: w.zh, type: 'zh' as const, pairId: i, matched: false, flipped: false },
      ])
    );
    setCards(newCards);
  }, []);

  const handleCardClick = (cardId: number) => {
    if (lockRef.current || completed) return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.matched || card.flipped) return;

    const newCards = cards.map(c => c.id === cardId ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newSelected = [...selected, cardId];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      lockRef.current = true;
      setAttempts(a => a + 1);
      const [first, second] = newSelected.map(id => newCards.find(c => c.id === id)!);
      if (first.pairId === second.pairId && first.type !== second.type) {
        // Match!
        setTimeout(() => {
          setCards(prev => prev.map(c => c.pairId === first.pairId ? { ...c, matched: true } : c));
          setMatchedPairs(p => {
            const newCount = p + 1;
            if (newCount === 6) {
              setCompleted(true);
              const elapsed = Math.floor((Date.now() - startTime) / 1000);
              addToast(`连连看完成！用时 ${elapsed}秒，尝试 ${attempts + 1} 次`, 'success');
            }
            return newCount;
          });
          setSelected([]);
          lockRef.current = false;
        }, 400);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => c.id === first.id || c.id === second.id ? { ...c, flipped: false } : c));
          setSelected([]);
          lockRef.current = false;
        }, 800);
      }
    }
  };

  if (completed) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return (
      <div className="text-center py-8">
        <Mascot expression="celebrate" size="lg" />
        <h3 className="text-lg font-bold mt-3">🎉 连连看完成！</h3>
        <p className="text-gray-500 text-sm mt-1">用时 {elapsed}秒 · 尝试 {attempts} 次</p>
        <button onClick={onBack} className="btn-primary mt-4 text-sm">返回游戏列表</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-[#FF6B6B] font-bold hover:underline">← 返回</button>
        <span className="text-xs text-gray-400">已匹配 {matchedPairs}/6 · 尝试 {attempts}</span>
      </div>
      <h2 className="text-lg font-extrabold text-gray-800">🎮 单词连连看</h2>
      <p className="text-xs text-gray-500">点击两张卡片，配对英文单词和中文释义</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cards.map((card) => (
          <button key={card.id} onClick={() => handleCardClick(card.id)}
            className={`h-20 rounded-xl text-sm font-bold transition-all duration-300 ${
              card.matched ? 'bg-green-100 text-green-700 opacity-60 scale-95' :
              card.flipped ? 'bg-white text-gray-800 shadow-md border-2 border-[#FF6B6B] scale-105' :
              'bg-gray-100 text-gray-400 hover:bg-gray-200 border-2 border-transparent'
            }`}>
            {card.matched ? '✓' : card.flipped ? card.text : '?'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ==================== Game 2: 单词拼图 (Word Puzzle) ====================
function PuzzleGame({ onBack }: { onBack: () => void }) {
  const { accent } = useLearningStore();
  const { addToast } = useToastStore();
  const [currentWord, setCurrentWord] = useState(0);
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const gameWords = shuffle(wordPool).filter(w => w.en.length >= 4 && w.en.length <= 8).slice(0, 10);

  useEffect(() => {
    scrambleWord();
  }, [currentWord]);

  const scrambleWord = () => {
    const word = gameWords[currentWord].en;
    const letters = word.split('');
    // Scramble until different from original
    let scrambledArr: string[];
    do {
      scrambledArr = shuffle(letters);
    } while (scrambledArr.join('') === word && word.length > 1);
    setScrambled(scrambledArr);
    setSelectedTiles([]);
    setShowHint(false);
  };

  const handleTileClick = (idx: number) => {
    if (completed || selectedTiles.includes(idx)) return;
    setSelectedTiles(prev => [...prev, idx]);
  };

  const handleUndo = () => {
    setSelectedTiles(prev => prev.slice(0, -1));
  };

  const checkAnswer = () => {
    const answer = selectedTiles.map(i => scrambled[i]).join('');
    if (answer === gameWords[currentWord].en) {
      setScore(s => s + 1);
      if (currentWord < gameWords.length - 1) {
        setCurrentWord(i => i + 1);
      } else {
        setCompleted(true);
        addToast(`拼图完成！得分 ${score + 1}/${gameWords.length}`, 'success');
      }
    } else {
      addToast('拼写不正确，再试试！', 'warning');
      setSelectedTiles([]);
    }
  };

  if (completed) {
    return (
      <div className="text-center py-8">
        <Mascot expression="celebrate" size="lg" />
        <h3 className="text-lg font-bold mt-3">🧩 拼图完成！</h3>
        <p className="text-gray-500 text-sm mt-1">得分: {score}/{gameWords.length}</p>
        <button onClick={onBack} className="btn-primary mt-4 text-sm">返回游戏列表</button>
      </div>
    );
  }

  const w = gameWords[currentWord];
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-[#00B894] font-bold hover:underline">← 返回</button>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-extrabold text-gray-800">🧩 单词拼图</h2>
        <span className="text-xs text-gray-400">第 {currentWord + 1}/{gameWords.length} 题 · 得分 {score}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(currentWord / gameWords.length) * 100}%` }} />
      </div>
      <div className="card p-6 text-center">
        <p className="text-sm text-gray-500 mb-2">
          点击字母拼出正确的单词
          <button onClick={() => setShowHint(!showHint)} className="ml-2 text-[#00B894] font-bold text-xs hover:underline">
            {showHint ? '隐藏提示' : '显示提示'}
          </button>
        </p>
        {showHint && (
          <p className="text-lg font-bold text-[#00B894] mb-3">{w.zh}</p>
        )}
        <div className="flex justify-center gap-2 flex-wrap mb-6">
          {scrambled.map((letter, i) => (
            <button key={i} onClick={() => handleTileClick(i)}
              className={`w-10 h-10 rounded-lg text-xl font-extrabold transition-all ${
                selectedTiles.includes(i) ? 'opacity-0 scale-75' :
                'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-110'
              }`}>
              {letter}
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-2 min-h-[40px]">
          {selectedTiles.map((idx, i) => (
            <span key={i} className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#00B894] text-white font-extrabold text-lg animate-bounce-in">
              {scrambled[idx]}
            </span>
          ))}
        </div>
        <div className="flex gap-2 justify-center mt-4">
          <button onClick={handleUndo} disabled={selectedTiles.length === 0}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40">
            ← 撤销
          </button>
          <button onClick={checkAnswer} disabled={selectedTiles.length !== w.en.length}
            className="px-6 py-2 text-xs font-bold rounded-lg bg-[#00B894] text-white hover:bg-[#00A383] disabled:opacity-40">
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Game 3: 单词大闯关 (Word Levels) ====================
function LevelsGame({ onBack }: { onBack: () => void }) {
  const { accent } = useLearningStore();
  const { addToast } = useToastStore();
  const [level, setLevel] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState<boolean | null>(null);

  const questions = [
    { level: 1, q: '"apple" 的中文是？', options: ['香蕉', '苹果', '橙子', '葡萄'], answer: 1 },
    { level: 1, q: '"cat" 的中文是？', options: ['狗', '鸟', '猫', '鱼'], answer: 2 },
    { level: 1, q: '"good" 的中文是？', options: ['坏的', '好的', '大的', '小的'], answer: 1 },
    { level: 2, q: '"beautiful" 的中文是？', options: ['丑陋的', '美丽的', '高大的', '聪明的'], answer: 1 },
    { level: 2, q: '"education" 的中文是？', options: ['娱乐', '教育', '运动', '交通'], answer: 1 },
    { level: 2, q: '"important" 的同义词是？', options: ['small', 'big', 'vital', 'weak'], answer: 2 },
    { level: 3, q: '"knowledge" 的动词形式是？', options: ['know', 'knew', 'known', 'knowing'], answer: 0 },
    { level: 3, q: '"different" 的名词形式是？', options: ['differ', 'difference', 'differently', 'differential'], answer: 1 },
    { level: 3, q: '"environment" 的意思是？', options: ['设备', '环境', '事件', '政府'], answer: 1 },
  ];

  const levelWords = ['初级', '中级', '高级'];
  const levelColors = ['#00B894', '#FDCB6E', '#FF6B6B'];

  const levelQuestions = questions.filter(q => q.level === level);
  const allCompleted = level > 3;

  const handleAnswer = (idx: number) => {
    if (feedback !== null) return;
    const correct = idx === levelQuestions[questionIndex].answer;
    setFeedback(correct);
    if (correct) setScore(s => s + 1);
    const word = levelQuestions[questionIndex].q.match(/"([^"]+)"/)?.[1];
    if (word) speak(word, accent, 0.9, 1);
  };

  const handleNext = () => {
    if (questionIndex < levelQuestions.length - 1) {
      setQuestionIndex(i => i + 1);
      setFeedback(null);
    } else if (level < 3) {
      setLevel(l => l + 1);
      setQuestionIndex(0);
      setFeedback(null);
      addToast(`🎉 第 ${levelWords[level - 1]} 关通过！`, 'success');
    } else {
      setCompleted(true);
      addToast(`闯关完成！最终得分 ${score + (feedback ? 1 : 0)}/9`, 'success');
    }
  };

  if (completed) {
    return (
      <div className="text-center py-8">
        <Mascot expression="celebrate" size="lg" />
        <h3 className="text-lg font-bold mt-3">🏰 恭喜通关！</h3>
        <p className="text-gray-500 text-sm mt-1">总分: {score}/{questions.length}</p>
        <button onClick={onBack} className="btn-primary mt-4 text-sm">返回游戏列表</button>
      </div>
    );
  }

  const q = levelQuestions[questionIndex];
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-[#FDCB6E] font-bold hover:underline">← 返回</button>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-gray-800">🏰 单词大闯关</span>
          <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: levelColors[level - 1] + '20', color: levelColors[level - 1] }}>
            {levelWords[level - 1]}
          </span>
        </div>
        <span className="text-xs text-gray-400">得分 {score}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3].map(l => (
          <div key={l} className={`flex-1 h-1.5 rounded-full ${l < level ? 'bg-[#FDCB6E]' : l === level ? 'bg-[#FDCB6E]/50' : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="card p-6">
        <div className="flex justify-between text-xs text-gray-400 mb-4">
          <span>第 {questionIndex + 1}/{levelQuestions.length} 题</span>
        </div>
        <p className="text-base font-bold text-gray-800 text-center mb-6">{q.q}</p>
        <div className="space-y-2">
          {q.options.map((opt, idx) => {
            const isSelected = feedback !== null && idx === q.answer;
            const isWrong = feedback !== null && idx !== q.answer;
            return (
              <button key={idx} onClick={() => handleAnswer(idx)}
                className={`w-full p-3 rounded-xl text-sm font-medium text-left transition-all ${
                  feedback === true && isSelected ? 'bg-green-50 text-green-700 border-2 border-green-300' :
                  feedback === false && idx === q.answer ? 'bg-green-50 text-green-700 border-2 border-green-300' :
                  feedback === false && idx !== q.answer && isWrong ? 'bg-red-50 text-red-700 border-2 border-red-300' :
                  'bg-gray-50 text-gray-600 border-2 border-gray-100 hover:border-gray-200'
                }`}>
                {String.fromCharCode(65 + idx)}. {opt}
              </button>
            );
          })}
        </div>
        {feedback !== null && (
          <p className={`text-center mt-4 text-sm font-bold ${feedback ? 'text-green-600' : 'text-red-600'}`}>
            {feedback ? '✅ 正确！' : '❌ 错误'}
          </p>
        )}
      </div>
      {feedback !== null && (
        <button onClick={handleNext} className="btn-primary w-full justify-center py-3 text-sm">
          {questionIndex < levelQuestions.length - 1 ? '下一题' : level < 3 ? '进入下一关' : '查看结果'}
        </button>
      )}
    </div>
  );
}

// ==================== Game 4: 单词赛车 (Speed Quiz) ====================
function SpeedGame({ onBack }: { onBack: () => void }) {
  const { accent } = useLearningStore();
  const { addToast } = useToastStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const speedWords = shuffle(wordPool).slice(0, 40);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setGameOver(true);
          addToast(`赛车结束！得分 ${score}`, 'success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (gameOver && timerRef.current) clearInterval(timerRef.current);
  }, [gameOver]);

  // Generate options
  const currentWord = speedWords[currentIndex % speedWords.length];
  const options = shuffle([
    currentWord.zh,
    ...shuffle(wordPool.filter(w => w.en !== currentWord.en)).slice(0, 3).map(w => w.zh),
  ]);

  const handleAnswer = (zh: string) => {
    if (feedback !== null || gameOver) return;
    const correct = zh === currentWord.zh;
    setFeedback(correct);
    if (correct) {
      setScore(s => s + 1);
      setCurrentIndex(i => i + 1);
      setTimeout(() => setFeedback(null), 300);
    } else {
      setTimeout(() => {
        setFeedback(null);
        setCurrentIndex(i => i + 1);
      }, 500);
    }
  };

  if (gameOver) {
    return (
      <div className="text-center py-8">
        <Mascot expression={score >= 10 ? 'celebrate' : 'happy'} size="lg" />
        <h3 className="text-lg font-bold mt-3">🏎️ 赛车结束！</h3>
        <p className="text-gray-500 text-sm mt-1">得分: {score} 题/60秒</p>
        <button onClick={onBack} className="btn-primary mt-4 text-sm">返回游戏列表</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-[#E17055] font-bold hover:underline">← 返回</button>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-gray-800">🏎️ 单词赛车</h2>
        <span className={`text-lg font-extrabold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-[#E17055]'}`}>
          {timeLeft}s
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill bg-[#E17055]" style={{ width: `${(timeLeft / 60) * 100}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>得分: {score}</span>
      </div>
      <div className="card p-6 text-center">
        <button onClick={() => speak(currentWord.en, accent, 0.8, 1)}
          className="text-3xl font-extrabold text-gray-800 mb-4 hover:text-[#E17055] transition-colors">
          {currentWord.en}
        </button>
        <p className="text-xs text-gray-400 mb-4">点击单词听发音 · 选择对应的中文释义</p>
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(opt)}
              className={`p-3 rounded-xl text-sm font-bold transition-all ${
                feedback === true && opt === currentWord.zh ? 'bg-green-50 text-green-700 border-2 border-green-300 scale-95' :
                feedback === false && opt === currentWord.zh ? 'bg-green-50 text-green-700 border-2 border-green-300' :
                'bg-gray-50 text-gray-600 border-2 border-gray-100 hover:border-[#E17055]/30 hover:bg-gray-100'
              }`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== Game 5: 单词消消乐 (Match Pairs) ====================
function MatchPairsGame({ onBack }: { onBack: () => void }) {
  const { accent } = useLearningStore();
  const { addToast } = useToastStore();
  const [cards, setCards] = useState<{ id: number; en?: string; zh?: string; pairId: number; matched: boolean }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const selectedWords = shuffle(wordPool).slice(0, 8);
    const newCards = shuffle([
      ...selectedWords.map((w, i) => ({ id: i * 2, en: w.en, pairId: i, matched: false })),
      ...selectedWords.map((w, i) => ({ id: i * 2 + 1, zh: w.zh, pairId: i, matched: false })),
    ]);
    setCards(newCards);
  }, []);

  const handleSelect = (cardId: number) => {
    if (completed) return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.matched) return;

    if (selected.length === 0) {
      setSelected([cardId]);
    } else if (selected.length === 1) {
      if (selected[0] === cardId) return;
      const first = cards.find(c => c.id === selected[0])!;
      setSelected([selected[0], cardId]);

      if (first.pairId === card.pairId && ('en' in first) !== ('en' in card)) {
        // Match
        setTimeout(() => {
          setCards(prev => prev.map(c => c.pairId === first.pairId ? { ...c, matched: true } : c));
          setScore(s => {
            const newScore = s + 1;
            if (newScore === 8) {
              setCompleted(true);
              addToast('消消乐完成！', 'success');
            }
            return newScore;
          });
          setSelected([]);
        }, 300);
      } else {
        setTimeout(() => {
          setSelected([]);
        }, 600);
      }
    }
  };

  if (completed) {
    return (
      <div className="text-center py-8">
        <Mascot expression="celebrate" size="lg" />
        <h3 className="text-lg font-bold mt-3">💥 消消乐完成！</h3>
        <button onClick={onBack} className="btn-primary mt-4 text-sm">返回游戏列表</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-[#4ECDC4] font-bold hover:underline">← 返回</button>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-gray-800">💥 单词消消乐</h2>
        <span className="text-xs text-gray-400">已消除 {score}/8</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill bg-[#4ECDC4]" style={{ width: `${(score / 8) * 100}%` }} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map(card => {
          const isSelected = selected.includes(card.id);
          return (
            <button key={card.id} onClick={() => handleSelect(card.id)}
              className={`h-16 rounded-xl text-sm font-bold transition-all ${
                card.matched ? 'opacity-20 scale-90' :
                isSelected ? 'bg-[#4ECDC4] text-white scale-105 shadow-md' :
                'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
              }`}>
              {card.matched ? '✓' : card.en || card.zh}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== Main Fun Learn Page ====================
export default function FunLearnPage() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {!activeGame && (
        <>
          <div className="flex items-center gap-2">
            <HiOutlinePuzzlePiece className="w-5 h-5 text-[#FDCB6E]" />
            <h2 className="text-lg font-extrabold text-gray-800">趣味学</h2>
          </div>
          <p className="text-xs text-gray-500">通过趣味游戏学习单词</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {GAMES.map((game) => (
              <div key={game.id} onClick={() => setActiveGame(game.id)}
                className="card p-4 cursor-pointer hover:shadow-lg transition-all text-center group">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{game.emoji}</div>
                <h3 className="font-bold text-sm text-gray-800">{game.name}</h3>
                <p className="text-[10px] text-gray-500 mt-1">{game.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {activeGame === 'matching' && <MatchingGame onBack={() => setActiveGame(null)} />}
      {activeGame === 'puzzle' && <PuzzleGame onBack={() => setActiveGame(null)} />}
      {activeGame === 'levels' && <LevelsGame onBack={() => setActiveGame(null)} />}
      {activeGame === 'speed' && <SpeedGame onBack={() => setActiveGame(null)} />}
      {activeGame === 'match-pairs' && <MatchPairsGame onBack={() => setActiveGame(null)} />}

      {activeGame === 'quiz' && <QuizGame onBack={() => setActiveGame(null)} />}
    </div>
  );
}

// ==================== Quiz Game (Improved from original) ====================
function QuizGame({ onBack }: { onBack: () => void }) {
  const { accent } = useLearningStore();
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizResult, setQuizResult] = useState<boolean | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  const wordQuiz = [
    { question: '🍎 "苹果"的英文是？', answer: 'apple', hint: 'a _ _ _ e' },
    { question: '🐱 "猫"的英文是？', answer: 'cat', hint: 'c _ _' },
    { question: '🌞 "太阳"的英文是？', answer: 'sun', hint: 's _ _' },
    { question: '📚 "书"的英文是？', answer: 'book', hint: 'b _ _ _' },
    { question: '🏠 "房子"的英文是？', answer: 'house', hint: 'h _ _ _ _' },
    { question: '🐕 "狗"的英文是？', answer: 'dog', hint: 'd _ _' },
    { question: '🌊 "水"的英文是？', answer: 'water', hint: 'w _ _ _ _' },
    { question: '🎓 "学校"的英文是？', answer: 'school', hint: 's _ _ _ _ _' },
    { question: '❤️ "爱"的英文是？', answer: 'love', hint: 'l _ _ _' },
    { question: '🌟 "朋友"的英文是？', answer: 'friend', hint: 'f _ _ _ _ _' },
  ];

  const checkQuiz = () => {
    const correct = quizAnswer.trim().toLowerCase() === wordQuiz[quizIndex].answer;
    setQuizResult(correct);
    if (correct) setQuizScore(s => s + 1);
    speak(wordQuiz[quizIndex].answer, accent, 0.9, 1);
  };

  const nextQuiz = () => {
    if (quizIndex < wordQuiz.length - 1) {
      setQuizIndex(i => i + 1);
      setQuizAnswer('');
      setQuizResult(null);
    } else {
      setQuizDone(true);
    }
  };

  if (quizDone) {
    return (
      <div className="text-center py-8">
        <Mascot expression="celebrate" size="lg" />
        <h3 className="text-lg font-bold mt-3">🎯 游戏结束！</h3>
        <p className="text-gray-500 mt-1">得分: {quizScore}/{wordQuiz.length}</p>
        <button onClick={onBack} className="btn-primary mt-4 text-sm">返回</button>
      </div>
    );
  }

  const q = wordQuiz[quizIndex];
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <button onClick={onBack} className="text-sm text-[#A29BFE] font-bold hover:underline">← 返回</button>
      <h2 className="text-lg font-extrabold text-gray-800">🎯 单词猜猜看</h2>
      <div className="flex justify-between text-xs text-gray-400">
        <span>第 {quizIndex + 1}/{wordQuiz.length} 题</span>
        <span>得分: {quizScore}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(quizIndex / wordQuiz.length) * 100}%` }} />
      </div>
      <div className="card p-6 text-center">
        <div className="text-4xl mb-4">{q.question}</div>
        <p className="text-xs text-gray-500 mb-2">提示: {q.hint}</p>
        <input type="text" value={quizAnswer} onChange={e => setQuizAnswer(e.target.value)}
          className="input-field text-center text-lg" placeholder="输入答案..."
          onKeyDown={e => e.key === 'Enter' && quizAnswer && !quizResult && checkQuiz()} />
        {quizResult !== null && (
          <p className={`mt-3 font-bold ${quizResult ? 'text-green-600' : 'text-red-600'}`}>
            {quizResult ? '✅ 正确！' : `❌ 错误, 答案是 ${q.answer}`}
          </p>
        )}
      </div>
      {quizResult === null ? (
        <button onClick={checkQuiz} className="btn-primary w-full justify-center py-3 text-sm" disabled={!quizAnswer.trim()}>确认答案</button>
      ) : (
        <button onClick={nextQuiz} className="btn-primary w-full justify-center py-3 text-sm">
          {quizIndex < wordQuiz.length - 1 ? '下一题' : '查看结果'}
        </button>
      )}
    </div>
  );
}
