'use client';

import { useState } from 'react';
import { HiOutlineChartPie } from 'react-icons/hi2';
import { speak } from '@/lib/voice';
import { useLearningStore, useToastStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';

const questions = [
  { q: '"apple" 的中文意思是？', options: ['香蕉', '苹果', '橙子', '葡萄'], answer: 1 },
  { q: '"beautiful" 的反义词是？', options: ['pretty', 'ugly', 'nice', 'cute'], answer: 1 },
  { q: '下面哪个是 "猫" 的英文？', options: ['dog', 'bird', 'cat', 'fish'], answer: 2 },
  { q: '"education" 的意思是？', options: ['娱乐', '运动', '教育', '交通'], answer: 2 },
  { q: '"important" 的同义词是？', options: ['small', 'big', 'vital', 'weak'], answer: 2 },
  { q: '"environment" 的意思是？', options: ['设备', '环境', '事件', '政府'], answer: 1 },
  { q: '"knowledge" 的动词形式是？', options: ['know', 'knew', 'known', 'knowing'], answer: 0 },
  { q: '"different" 的名词形式是？', options: ['differ', 'difference', 'differently', 'differential'], answer: 1 },
  { q: '"possible" 的反义词是？', options: ['likely', 'impossible', 'probable', 'maybe'], answer: 1 },
  { q: '"challenge" 的意思是？', options: ['改变', '挑战', '机会', '选择'], answer: 1 },
];

export default function RandomTestPage() {
  const { accent } = useLearningStore();
  const { addToast } = useToastStore();
  const [testWords] = useState(questions.sort(() => Math.random() - 0.5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleSelect = (idx: number) => {
    if (isCorrect !== null) return;
    setSelectedAnswer(idx);
    const correct = idx === testWords[currentIndex].answer;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
    // Play the key word
    const word = testWords[currentIndex].q.match(/"([^"]+)"/)?.[1];
    if (word) speak(word, accent, 0.9, 1);
  };

  const handleNext = () => {
    if (currentIndex < testWords.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setCompleted(true);
      addToast(`随机测试完成！得分 ${score + (isCorrect ? 1 : 0)}/${testWords.length}`, 'success');
    }
  };

  if (completed) {
    const pct = Math.round(score / testWords.length * 100);
    return (
      <div className="text-center py-16">
        <Mascot expression={pct >= 70 ? 'celebrate' : 'happy'} size="lg" />
        <h3 className="text-lg font-bold mt-3">测试完成！</h3>
        <div className="card p-6 mt-4 max-w-sm mx-auto">
          <div className="text-3xl font-extrabold text-[#FF6B6B]">{score}/{testWords.length}</div>
          <div className="progress-track mt-2">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm text-gray-500 mt-2">{pct >= 80 ? '优秀！继续加油！' : pct >= 60 ? '不错，继续努力！' : '需要多加练习哦！'}</p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-primary mt-4 text-sm">再来一次</button>
      </div>
    );
  }

  const q = testWords[currentIndex];
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineChartPie className="w-5 h-5 text-[#00B894]" />
        <h2 className="text-lg font-extrabold text-gray-800">随机测</h2>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>第 {currentIndex + 1}/{testWords.length} 题</span>
        <span>正确: {score}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(currentIndex / testWords.length) * 100}%` }} />
      </div>
      <div className="card p-6">
        <p className="text-base font-bold text-gray-800 mb-5">{q.q}</p>
        <div className="space-y-2">
          {q.options.map((opt, idx) => {
            const isSelected = selectedAnswer === idx;
            const showCorrect = isCorrect !== null && idx === q.answer;
            const showWrong = isCorrect !== null && isSelected && idx !== q.answer;
            return (
              <button key={idx} onClick={() => handleSelect(idx)}
                className={`w-full p-3 rounded-xl text-sm font-medium text-left transition-all ${
                  showCorrect ? 'bg-green-50 text-green-700 border-2 border-green-300' :
                  showWrong ? 'bg-red-50 text-red-700 border-2 border-red-300' :
                  isSelected ? 'bg-[#00B894]/10 text-[#00B894] border-2 border-[#00B894]' :
                  'bg-gray-50 text-gray-600 border-2 border-gray-100 hover:border-[#00B894]/30'
                }`}>
                {String.fromCharCode(65 + idx)}. {opt}
              </button>
            );
          })}
        </div>
      </div>
      {isCorrect !== null && (
        <button onClick={handleNext} className="btn-primary w-full justify-center py-3 text-sm">
          {currentIndex < testWords.length - 1 ? '下一题' : '查看结果'}
        </button>
      )}
    </div>
  );
}
