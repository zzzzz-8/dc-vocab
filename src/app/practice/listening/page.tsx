'use client';

import { useState, useEffect, useRef } from 'react';
import { HiOutlineSpeakerWave } from 'react-icons/hi2';
import { useUserStore, useToastStore, useLearningStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';
import { speak } from '@/lib/voice';

const listeningWords = [
  { word: 'apple', meaning: '苹果', sentence: 'I eat an apple every day.' },
  { word: 'beautiful', meaning: '美丽的', sentence: 'The flowers are beautiful.' },
  { word: 'challenge', meaning: '挑战', sentence: 'This is a big challenge.' },
  { word: 'dangerous', meaning: '危险的', sentence: 'It is dangerous to play with fire.' },
  { word: 'education', meaning: '教育', sentence: 'Education is very important.' },
  { word: 'familiar', meaning: '熟悉的', sentence: 'This place looks familiar.' },
  { word: 'generous', meaning: '慷慨的', sentence: 'He is a generous person.' },
  { word: 'history', meaning: '历史', sentence: 'History is my favorite subject.' },
  { word: 'important', meaning: '重要的', sentence: 'This is very important.' },
  { word: 'knowledge', meaning: '知识', sentence: 'Knowledge is power.' },
  { word: 'language', meaning: '语言', sentence: 'Language is a tool for communication.' },
  { word: 'mountain', meaning: '山', sentence: 'The mountain is very high.' },
  { word: 'natural', meaning: '自然的', sentence: 'This park has natural beauty.' },
  { word: 'opportunity', meaning: '机会', sentence: 'Don\'t miss this opportunity.' },
  { word: 'president', meaning: '总统/校长', sentence: 'The president gave a speech.' },
  { word: 'question', meaning: '问题', sentence: 'Do you have any questions?' },
  { word: 'restaurant', meaning: '餐厅', sentence: 'Let\'s go to a restaurant.' },
  { word: 'situation', meaning: '情况', sentence: 'This is a difficult situation.' },
  { word: 'temperature', meaning: '温度', sentence: 'The temperature is rising.' },
  { word: 'university', meaning: '大学', sentence: 'She studies at a university.' },
];

export default function ListeningPage() {
  const { isLoggedIn } = useUserStore();
  const { addToast } = useToastStore();
  const { accent } = useLearningStore();
  const [words] = useState(() => [...listeningWords].sort(() => Math.random() - 0.5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const [autoPlayed, setAutoPlayed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoPlayed && words.length > 0) {
      handlePlay(words[currentIndex].word);
      setAutoPlayed(true);
    }
  }, [currentIndex, autoPlayed, words]);

  useEffect(() => {
    if (isCorrect === null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, isCorrect]);

  const handlePlay = (text: string) => {
    speak(text, accent, 0.7, 1);
  };

  const handlePlaySentence = () => {
    speak(words[currentIndex].sentence, accent, 0.8, 1);
    setReplayCount(r => r + 1);
  };

  const handlePlayWord = () => {
    speak(words[currentIndex].word, accent, 0.6, 1);
    setReplayCount(r => r + 1);
  };

  const handleSubmit = () => {
    const correct = userInput.trim().toLowerCase() === words[currentIndex].word.toLowerCase();
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);

    fetch('/api/practice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        practiceType: 'listening',
        questionId: `listen-${currentIndex}`,
        question: '听写单词',
        userAnswer: userInput,
        correctAnswer: words[currentIndex].word,
        isCorrect: correct,
      }),
    });
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(i => i + 1);
      setUserInput('');
      setIsCorrect(null);
      setReplayCount(0);
      setAutoPlayed(false);
    } else {
      setCompleted(true);
      addToast(`听力练习完成！得分 ${score + (isCorrect ? 1 : 0)}/${words.length}`, 'success');
    }
  };

  if (completed) {
    return (
      <div className="text-center py-16">
        <Mascot expression="celebrate" size="lg" />
        <h3 className="text-lg font-bold mt-3">听力练习完成！</h3>
        <p className="text-gray-500 mt-1">得分: {score}/{words.length}</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-4 text-sm">再来一轮</button>
      </div>
    );
  }

  const w = words[currentIndex];
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineSpeakerWave className="w-5 h-5 text-[#00CEC9]" />
        <h2 className="text-lg font-extrabold text-gray-800">学听力</h2>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>第 {currentIndex + 1}/{words.length} 题</span>
        <span>得分: {score}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(currentIndex / words.length) * 100}%` }} />
      </div>
      <div className="card p-6 text-center">
        {isCorrect === null ? (
          <>
            <div className="flex justify-center mb-6">
              <Mascot expression="talking" size="md" />
            </div>
            <button onClick={handlePlayWord}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00CEC9] to-[#55EFC4] flex items-center justify-center mx-auto mb-4 hover:shadow-lg transition-all active:scale-95">
              <HiOutlineSpeakerWave className="w-8 h-8 text-white" />
            </button>
            <p className="text-sm text-gray-500 mb-4">
              {replayCount > 0 ? `已播放 ${replayCount} 次` : '点击播放按钮听单词'}
            </p>
            <input ref={inputRef} type="text" value={userInput} onChange={e => setUserInput(e.target.value)}
              placeholder="请输入你听到的单词..."
              className="input-field text-center text-lg" autoFocus
              onKeyDown={e => e.key === 'Enter' && userInput && handleSubmit()} />
            <div className="flex gap-2 mt-3 justify-center">
              <button onClick={handlePlayWord} className="text-xs text-[#00CEC9] font-bold hover:underline">
                再听一遍
              </button>
              <button onClick={handlePlaySentence} className="text-xs text-[#00CEC9] font-bold hover:underline">
                听例句
              </button>
            </div>
          </>
        ) : (
          <div>
            <p className={`text-lg font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? '✅ 正确！' : '❌ 错误'}
            </p>
            <p className="text-2xl font-extrabold text-gray-800 mt-3">{w.word}</p>
            <p className="text-gray-500 text-sm">{w.meaning}</p>
            <p className="text-gray-400 text-xs mt-2 italic">"{w.sentence}"</p>
            <button onClick={() => handlePlay(w.word)} className="mt-3 text-[#00CEC9] text-sm font-bold hover:underline">
              再听一遍发音
            </button>
          </div>
        )}
      </div>
      {isCorrect === null ? (
        <button onClick={handleSubmit} className="btn-primary w-full justify-center py-3 text-sm"
          disabled={!userInput.trim()}>
          提交答案
        </button>
      ) : (
        <button onClick={handleNext} className="btn-primary w-full justify-center py-3 text-sm">
          {currentIndex < words.length - 1 ? '下一题' : '查看结果'}
        </button>
      )}
    </div>
  );
}
