'use client';

import { useState, useEffect } from 'react';
import { HiOutlinePencil } from 'react-icons/hi2';
import { useUserStore, useToastStore, useLearningStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';
import { speak } from '@/lib/voice';

interface SpellingWord {
  word: string;
  meaning: string;
  difficulty: number;
}

export default function SpellingPage() {
  const { isLoggedIn } = useUserStore();
  const { addToast } = useToastStore();
  const { accent } = useLearningStore();
  const [words, setWords] = useState<SpellingWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [charStates, setCharStates] = useState<string[]>([]);

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    try {
      // Try to fetch words from the dictionary API
      const res = await fetch('/api/tools/dictionary?limit=30');
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        const spellingData = data.data
          .filter((w: any) => w.word && w.word.length >= 3 && w.word.length <= 12)
          .map((w: any) => ({
            word: w.word.toLowerCase(),
            meaning: w.meaning || '',
            difficulty: w.difficulty || 2,
          }));
        setWords(shuffle(spellingData.length > 0 ? spellingData : fallbackWords));
      } else {
        setWords(shuffle(fallbackWords));
      }
    } catch {
      setWords(shuffle(fallbackWords));
    } finally {
      setLoading(false);
    }
  };

  const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);

  const fallbackWords: SpellingWord[] = [
    { word: 'beautiful', meaning: '美丽的', difficulty: 2 },
    { word: 'challenge', meaning: '挑战', difficulty: 3 },
    { word: 'dictionary', meaning: '词典', difficulty: 3 },
    { word: 'education', meaning: '教育', difficulty: 3 },
    { word: 'familiar', meaning: '熟悉的', difficulty: 4 },
    { word: 'generous', meaning: '慷慨的', difficulty: 4 },
    { word: 'happiness', meaning: '幸福', difficulty: 3 },
    { word: 'important', meaning: '重要的', difficulty: 2 },
    { word: 'knowledge', meaning: '知识', difficulty: 4 },
    { word: 'necessary', meaning: '必要的', difficulty: 4 },
    { word: 'opportunity', meaning: '机会', difficulty: 4 },
    { word: 'environment', meaning: '环境', difficulty: 4 },
    { word: 'immediately', meaning: '立即', difficulty: 4 },
    { word: 'accommodation', meaning: '住宿', difficulty: 5 },
  ];

  const playWord = () => {
    if (words[currentIndex]) speak(words[currentIndex].word, accent, 0.6, 1);
  };

  useEffect(() => { if (words.length > 0) playWord(); }, [currentIndex, words]);

  const checkSpelling = () => {
    const input = userInput.trim().toLowerCase();
    const correct = words[currentIndex].word.toLowerCase();
    const isExact = input === correct;
    setIsCorrect(isExact);
    if (isExact) setScore(s => s + 1);
    const states: string[] = [];
    for (let i = 0; i < Math.max(input.length, correct.length); i++) {
      if (i >= input.length || i >= correct.length) states.push('wrong');
      else if (input[i] === correct[i]) states.push('correct');
      else states.push('wrong');
    }
    setCharStates(states);
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(i => i + 1);
      setUserInput('');
      setIsCorrect(null);
      setCharStates([]);
    } else {
      setCompleted(true);
      addToast(`拼写练习完成！得分 ${score + (isCorrect ? 1 : 0)}/${words.length}`, 'success');
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-400 text-sm">加载中...</div>;
  }

  if (completed) {
    return (
      <div className="text-center py-16">
        <Mascot expression="celebrate" size="lg" />
        <h3 className="text-lg font-bold mt-3">拼写练习完成！</h3>
        <p className="text-gray-500 mt-1">得分: {score}/{words.length}</p>
        <button onClick={() => { setWords(shuffle([...words])); setCurrentIndex(0); setUserInput(''); setIsCorrect(null); setScore(0); setCompleted(false); setCharStates([]); }}
          className="btn-primary mt-4 text-sm">再来一轮</button>
      </div>
    );
  }

  const w = words[currentIndex];
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlinePencil className="w-5 h-5 text-[#00B894]" />
        <h2 className="text-lg font-extrabold text-gray-800">练拼写</h2>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>第 {currentIndex + 1}/{words.length} 题</span>
        <span>得分: {score}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(currentIndex / words.length) * 100}%` }} />
      </div>
      <div className="card p-6 text-center">
        <Mascot expression="talking" size="md" />
        <p className="text-gray-500 text-sm mt-4 mb-1">请拼写出以下单词</p>
        <p className="text-lg font-bold text-[#00B894] mb-4">{w.meaning}</p>
        <button onClick={playWord} className="text-xs text-[#00B894] font-bold hover:underline mb-4">
          🔊 再听一遍
        </button>
        <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)}
          placeholder="输入拼写..."
          className="input-field text-center text-lg tracking-widest" autoFocus
          onKeyDown={e => e.key === 'Enter' && userInput && (isCorrect === null ? checkSpelling() : handleNext())} />
        {isCorrect !== null && (
          <div className="mt-3">
            <p className={`text-lg font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? '✅ 拼写正确！' : '❌ 拼写错误'}
            </p>
            {!isCorrect && charStates.length > 0 && (
              <div className="flex justify-center gap-1 mt-2">
                {w.word.split('').map((ch, i) => (
                  <span key={i} className={`w-6 h-6 flex items-center justify-center rounded text-sm font-bold ${
                    charStates[i] === 'correct' ? 'bg-green-100 text-green-700' :
                    charStates[i] === 'wrong' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'
                  }`}>{ch}</span>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-600 mt-1">
              正确: <span className="font-bold text-gray-800">{w.word}</span>
            </p>
          </div>
        )}
      </div>
      {isCorrect === null ? (
        <button onClick={checkSpelling} className="btn-primary w-full justify-center py-3 text-sm" disabled={!userInput.trim()}>
          检查拼写
        </button>
      ) : (
        <button onClick={handleNext} className="btn-primary w-full justify-center py-3 text-sm">
          {currentIndex < words.length - 1 ? '下一题' : '查看结果'}
        </button>
      )}
    </div>
  );
}
