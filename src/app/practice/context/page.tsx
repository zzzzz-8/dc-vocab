'use client';

import { useState, useEffect } from 'react';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import { useUserStore, useToastStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';
import VoiceButton from '@/components/common/VoiceButton';

const sampleContexts = [
  { sentence: 'The ________ is shining brightly today.', options: ['sun', 'run', 'fun', 'gun'], answer: 'sun', meaning: '太阳' },
  { sentence: 'She is a very ________ student.', options: ['good', 'food', 'hood', 'wood'], answer: 'good', meaning: '好的' },
  { sentence: 'I need to ________ my homework.', options: ['do', 'go', 'so', 'no'], answer: 'do', meaning: '做' },
  { sentence: 'The cat is ________ the table.', options: ['on', 'in', 'at', 'under'], answer: 'on', meaning: '在上面' },
  { sentence: 'He ________ to school every day.', options: ['walks', 'walked', 'walking', 'walk'], answer: 'walks', meaning: '走' },
  { sentence: 'I have two ________ and a dog.', options: ['cat', 'cats', 'cat\'s', 'cating'], answer: 'cats', meaning: '猫（复数）' },
  { sentence: 'She ________ playing the piano now.', options: ['is', 'am', 'are', 'be'], answer: 'is', meaning: '是（第三人称单数）' },
  { sentence: 'This book is ________ than that one.', options: ['cheap', 'cheaper', 'cheapest', 'more cheap'], answer: 'cheaper', meaning: '更便宜的' },
  { sentence: 'They ________ to the park yesterday.', options: ['go', 'goes', 'went', 'going'], answer: 'went', meaning: '去（过去式）' },
  { sentence: 'Would you like ________ tea?', options: ['some', 'any', 'many', 'few'], answer: 'some', meaning: '一些（用于建议/邀请）' },
  { sentence: 'The movie was very ________.', options: ['excited', 'exciting', 'excite', 'excitement'], answer: 'exciting', meaning: '令人兴奋的' },
  { sentence: 'Please ________ the door before leaving.', options: ['open', 'close', 'closing', 'closed'], answer: 'close', meaning: '关' },
  { sentence: 'I\'m looking forward ________ you.', options: ['see', 'seeing', 'to see', 'to seeing'], answer: 'to seeing', meaning: '期待（固定搭配）' },
  { sentence: '________ a beautiful day it is!', options: ['What', 'How', 'Which', 'That'], answer: 'What', meaning: '感叹句引导词' },
  { sentence: 'She is ________ girl in our class.', options: ['tall', 'taller', 'tallest', 'more tall'], answer: 'tallest', meaning: '最高的' },
];

export default function ContextPage() {
  const { isLoggedIn } = useUserStore();
  const { addToast } = useToastStore();
  const [questions, setQuestions] = useState(sampleContexts);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleSelect = (opt: string) => {
    if (isCorrect !== null) return;
    const correct = opt === questions[currentIndex].answer;
    setSelectedAnswer(opt);
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);

    fetch('/api/practice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        practiceType: 'context',
        questionId: `context-${currentIndex}`,
        question: questions[currentIndex].sentence,
        userAnswer: opt,
        correctAnswer: questions[currentIndex].answer,
        isCorrect: correct,
      }),
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer('');
      setIsCorrect(null);
    } else {
      setCompleted(true);
      addToast(`语境练习完成！得分 ${score + (isCorrect ? 1 : 0)}/${questions.length}`, 'success');
    }
  };

  const restart = () => {
    setQuestions([...sampleContexts].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setSelectedAnswer('');
    setIsCorrect(null);
    setScore(0);
    setCompleted(false);
  };

  if (completed) {
    return (
      <div className="text-center py-16">
        <Mascot expression="celebrate" size="lg" />
        <h3 className="text-lg font-bold mt-3">练习完成！</h3>
        <p className="text-gray-500 mt-1">得分: {score}/{questions.length}</p>
        <button onClick={restart} className="btn-primary mt-4 text-sm">再来一轮</button>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineUserGroup className="w-5 h-5 text-[#0984E3]" />
        <h2 className="text-lg font-extrabold text-gray-800">学语境</h2>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>第 {currentIndex + 1}/{questions.length} 题</span>
        <span>得分: {score}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(currentIndex / questions.length) * 100}%` }} />
      </div>
      <div className="card p-6">
        <p className="text-base text-gray-800 leading-relaxed mb-6">{q.sentence}</p>
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt) => (
            <button key={opt} onClick={() => handleSelect(opt)}
              className={`p-4 rounded-xl text-lg font-bold text-center transition-all ${
                isCorrect !== null && opt === q.answer ? 'bg-green-50 text-green-700 border-2 border-green-300' :
                isCorrect !== null && opt === selectedAnswer ? 'bg-red-50 text-red-700 border-2 border-red-300' :
                selectedAnswer === opt ? 'bg-[#0984E3]/10 text-[#0984E3] border-2 border-[#0984E3]' :
                'bg-gray-50 text-gray-600 border-2 border-gray-100 hover:border-[#0984E3]/30'
              }`}>
              {opt}
            </button>
          ))}
        </div>
        {isCorrect !== null && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              <VoiceButton text={q.answer} />
              <p className="text-sm text-gray-600">正确答案: <span className="font-bold text-gray-800">{q.answer}</span></p>
            </div>
            <p className="text-xs text-gray-500 mt-1">释义: {q.meaning}</p>
          </div>
        )}
      </div>
      {isCorrect !== null && (
        <button onClick={handleNext} className="btn-primary w-full justify-center py-3 text-sm">
          {currentIndex < questions.length - 1 ? '下一题' : '查看结果'}
        </button>
      )}
    </div>
  );
}
