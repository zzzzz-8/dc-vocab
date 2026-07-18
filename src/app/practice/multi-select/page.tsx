'use client';

import { useState, useEffect } from 'react';
import { HiOutlineChartPie } from 'react-icons/hi2';
import { useUserStore, useToastStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';
import VoiceButton from '@/components/common/VoiceButton';

const sampleQuestions = [
  { word: 'beautiful', options: ['美丽的', '丑陋的', '高大的', '聪明的'], correct: [0] },
  { word: 'important', options: ['有趣的', '重要的', '著名的', '不同的'], correct: [1] },
  { word: 'education', options: ['娱乐', '教育', '运动', '音乐'], correct: [1] },
  { word: 'environment', options: ['设备', '娱乐', '环境', '事件'], correct: [2] },
  { word: 'knowledge', options: ['知识', '力量', '勇气', '智慧'], correct: [0] },
  { word: 'challenge', options: ['改变', '挑战', '机会', '选择'], correct: [1] },
  { word: 'familiar', options: ['著名的', '熟悉的', '亲爱的', '相似的'], correct: [1] },
  { word: 'generous', options: ['一般的', '慷慨的', '聪明的', '优雅的'], correct: [1] },
  { word: 'different', options: ['不同的', '困难的', '重要的', '有趣的'], correct: [0] },
  { word: 'opportunity', options: ['操作', '机会', '反对', '选择'], correct: [1] },
  { word: 'immediately', options: ['立即', '间接', '伟大的', '重要的'], correct: [0] },
  { word: 'significant', options: ['信号的', '重要的', '安静的', '显著的'], correct: [1] },
];

export default function MultiSelectPage() {
  const { isLoggedIn } = useUserStore();
  const { addToast } = useToastStore();
  const [questions, setQuestions] = useState(sampleQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const toggleSelect = (idx: number) => {
    if (isCorrect !== null) return;
    setSelected(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleSubmit = () => {
    const correct = JSON.stringify([...selected].sort()) === JSON.stringify([...questions[currentIndex].correct].sort());
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);

    fetch('/api/practice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        practiceType: 'multi_select',
        questionId: `multi-${currentIndex}`,
        question: questions[currentIndex].word,
        userAnswer: selected.join(','),
        correctAnswer: questions[currentIndex].correct.join(','),
        isCorrect: correct,
      }),
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelected([]);
      setIsCorrect(null);
    } else {
      setCompleted(true);
      addToast(`完成！得分 ${score + (isCorrect ? 1 : 0)}/${questions.length}`, 'success');
    }
  };

  const restart = () => {
    setQuestions([...sampleQuestions].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setSelected([]);
    setIsCorrect(null);
    setScore(0);
    setCompleted(false);
  };

  if (completed) {
    return (
      <div className="text-center py-16">
        <Mascot expression="celebrate" size="lg" />
        <h3 className="text-lg font-bold mt-3">多选五完成！</h3>
        <p className="text-gray-500 mt-1">得分: {score}/{questions.length}</p>
        <button onClick={restart} className="btn-primary mt-4 text-sm">再来一轮</button>
      </div>
    );
  }

  const q = questions[currentIndex];
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineChartPie className="w-5 h-5 text-[#E84393]" />
        <h2 className="text-lg font-extrabold text-gray-800">多选五</h2>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>第 {currentIndex + 1}/{questions.length} 题</span>
        <span>得分: {score}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(currentIndex / questions.length) * 100}%` }} />
      </div>
      <div className="card p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl font-extrabold text-gray-800">{q.word}</span>
          <VoiceButton text={q.word} />
        </div>
        <p className="text-sm text-gray-500 mb-4">选择正确的释义</p>
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt, idx) => (
            <button key={idx} onClick={() => toggleSelect(idx)}
              className={`p-4 rounded-xl text-sm font-bold transition-all ${
                isCorrect !== null && q.correct.includes(idx) ? 'bg-green-50 text-green-700 border-2 border-green-300' :
                isCorrect !== null && selected.includes(idx) ? 'bg-red-50 text-red-700 border-2 border-red-300' :
                selected.includes(idx) ? 'bg-[#E84393]/10 text-[#E84393] border-2 border-[#E84393]' :
                'bg-gray-50 text-gray-600 border-2 border-gray-100 hover:border-[#E84393]/30'
              }`}>
              {opt}
            </button>
          ))}
        </div>
        {isCorrect !== null && (
          <p className={`mt-3 text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
            {isCorrect ? '✅ 正确！' : '❌ 错误'}
          </p>
        )}
      </div>
      {isCorrect === null ? (
        <button onClick={handleSubmit} className="btn-primary w-full justify-center py-3 text-sm"
          disabled={selected.length === 0}>
          提交答案
        </button>
      ) : (
        <button onClick={handleNext} className="btn-primary w-full justify-center py-3 text-sm">下一题</button>
      )}
    </div>
  );
}
