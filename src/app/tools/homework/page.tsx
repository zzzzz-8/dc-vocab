'use client';

import { useState, useEffect } from 'react';
import { HiOutlinePencil, HiOutlineArrowPath } from 'react-icons/hi2';
import { useUserStore, useToastStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';
import VoiceButton from '@/components/common/VoiceButton';

interface HomeworkWord {
  id?: string;
  word: string;
  meaning: string;
  sentence: string;
}

const defaultWords: HomeworkWord[] = [
  { word: 'beautiful', meaning: '美丽的', sentence: '这是一个___的花园。' },
  { word: 'important', meaning: '重要的', sentence: '学习英语很___。' },
  { word: 'different', meaning: '不同的', sentence: '我们有___的想法。' },
  { word: 'wonderful', meaning: '精彩的', sentence: '今天真是___的一天！' },
  { word: 'dangerous', meaning: '危险的', sentence: '这条河很___。' },
  { word: 'familiar', meaning: '熟悉的', sentence: '这个地方看起来很___。' },
  { word: 'generous', meaning: '慷慨的', sentence: '他是一个___的人。' },
  { word: 'history', meaning: '历史', sentence: '___是我最喜欢的科目。' },
  { word: 'knowledge', meaning: '知识', sentence: '___就是力量。' },
  { word: 'language', meaning: '语言', sentence: '英语是国际___。' },
];

export default function HomeworkPage() {
  const { isLoggedIn, token } = useUserStore();
  const { addToast } = useToastStore();
  const [words, setWords] = useState<HomeworkWord[]>(defaultWords);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchHomeworkWords();
  }, []);

  const fetchHomeworkWords = async () => {
    try {
      const res = await fetch('/api/tools/homework');
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        const hwWords = data.data.map((hw: any) => ({
          id: hw.id,
          word: hw.word?.word || defaultWords[0].word,
          meaning: hw.word?.meaning || '',
          sentence: hw.question || '',
        }));
        if (hwWords.length > 0) setWords(hwWords);
      }
    } catch {
      // Use fallback words
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (index: number, answer: string, wordId?: string) => {
    try {
      await fetch('/api/tools/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: wordId || null,
          homeworkType: 'spelling',
          question: words[index].sentence,
          answer: words[index].word,
          userAnswer: answer,
          isCorrect: answer.toLowerCase().trim() === words[index].word.toLowerCase(),
          score: answer.toLowerCase().trim() === words[index].word.toLowerCase() ? 100 : 0,
        }),
      });
    } catch {
      // Silent fail for API submission
    }
  };

  const handleSubmit = () => {
    let correct = 0;
    words.forEach((w, i) => {
      const isCorrect = answers[i]?.toLowerCase().trim() === w.word;
      if (isCorrect) correct++;
      if (w.id) submitAnswer(i, answers[i] || '', w.id);
    });
    setScore(correct);
    setSubmitted(true);
    addToast(`作业完成！得分 ${correct}/${words.length}`, 'success');
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setWords([...defaultWords].sort(() => Math.random() - 0.5));
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-400 text-sm">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlinePencil className="w-5 h-5 text-[#6C5CE7]" />
        <h2 className="text-lg font-extrabold text-gray-800">作业单</h2>
      </div>

      {!submitted ? (
        <>
          <p className="text-xs text-gray-500">根据中文意思和上下文，填写正确的单词</p>
          {words.map((w, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-[#6C5CE7]">第 {i + 1} 题</span>
                <VoiceButton text={w.word} />
              </div>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-bold text-gray-800">{w.meaning}</span> - {w.sentence.replace('___', '______')}
              </p>
              <input type="text" value={answers[i] || ''} onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                className="input-field mt-2" placeholder="输入单词..." />
            </div>
          ))}
          <button onClick={handleSubmit} className="btn-primary w-full justify-center py-3 text-sm"
            disabled={Object.keys(answers).length < words.length}>
            提交作业
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="card p-6 text-center">
            <Mascot expression={score === words.length ? 'celebrate' : 'happy'} size="lg" />
            <h3 className="text-lg font-bold mt-3">得分: {score}/{words.length}</h3>
            <div className="progress-track mt-2">
              <div className="progress-fill" style={{ width: `${(score / words.length) * 100}%` }} />
            </div>
            <button onClick={handleRetry} className="btn-primary mt-4 text-sm">
              <HiOutlineArrowPath className="w-4 h-4 inline mr-1" />
              重新做
            </button>
          </div>
          {words.map((w, i) => {
            const userAns = answers[i]?.toLowerCase().trim();
            const correct = userAns === w.word;
            return (
              <div key={i} className={`card p-4 ${correct ? 'border-l-4 border-green-400' : 'border-l-4 border-red-400'}`}>
                <div className="flex items-center gap-2">
                  <span className={correct ? 'text-green-600' : 'text-red-600'}>
                    {correct ? '✅' : '❌'}
                  </span>
                  <span className="font-bold text-gray-800">{w.word}</span>
                  <VoiceButton text={w.word} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  你的答案: {answers[i]} {!correct && <span className="text-red-500">(正确: {w.word})</span>}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
