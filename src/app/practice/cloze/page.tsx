'use client';

import { useState, useEffect } from 'react';
import { HiOutlinePencil, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import { useUserStore, useToastStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';

export default function ClozePage() {
  const { isLoggedIn } = useUserStore();
  const { addToast } = useToastStore();
  const [articles, setArticles] = useState<any[]>([]);
  const [currentArticle, setCurrentArticle] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchClozeArticles();
  }, [isLoggedIn]);

  const fetchClozeArticles = async () => {
    try {
      const res = await fetch('/api/practice/articles?type=cloze');
      const data = await res.json();
      if (data.success) setArticles(data.data || []);
    } catch {}
  };

  // Generate cloze test from article content
  const generateCloze = (content: string) => {
    if (!content) return { text: '', blanks: [] as { index: number; answer: string; options: string[] }[] };
    const words = content.split(/\s+/);
    const blanks: { index: number; answer: string; options: string[] }[] = [];
    const wordPositions: number[] = [];

    // Pick every 7th word as a blank
    for (let i = 6; i < words.length; i += 7) {
      if (words[i] && words[i].length > 2) {
        wordPositions.push(i);
        const correct = words[i].replace(/[.,!?;:]/g, '');
        const distractors = ['option1', 'option2', 'option3'].map(() => {
          const idx = Math.floor(Math.random() * words.length);
          return words[idx]?.replace(/[.,!?;:]/g, '') || 'word';
        });
        blanks.push({
          index: i,
          answer: correct,
          options: [correct, ...distractors.filter(d => d !== correct)].sort(() => Math.random() - 0.5).slice(0, 4),
        });
        words[i] = '______';
      }
    }

    return { text: words.join(' '), blanks };
  };

  const startCloze = (article: any) => {
    const cloze = generateCloze(article.content || article.summary || 'Sample article content for cloze test. Learning English is fun and useful for everyone.');
    setCurrentArticle({ ...article, ...cloze });
    setAnswers({});
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!currentArticle) return;
    let correct = 0;
    currentArticle.blanks.forEach((b: any) => {
      if (answers[b.index] === b.answer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    // Submit results
    for (const b of currentArticle.blanks) {
      await fetch('/api/practice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practiceType: 'cloze',
          questionId: `cloze-${b.index}`,
          question: `Blank ${b.index + 1}`,
          userAnswer: answers[b.index] || '',
          correctAnswer: b.answer,
          isCorrect: answers[b.index] === b.answer,
        }),
      });
    }
    addToast(`完形填空完成！正确率 ${Math.round(correct/currentArticle.blanks.length*100)}%`, 'success');
  };

  if (currentArticle) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => setCurrentArticle(null)} className="text-sm text-[#E17055] font-bold hover:underline">← 返回</button>
        <h2 className="text-lg font-extrabold text-gray-800">完形填空</h2>
        <div className="card p-5">
          <p className="text-sm text-gray-700 leading-relaxed">{currentArticle.text}</p>
        </div>
        <div className="space-y-3">
          {currentArticle.blanks.map((blank: any, i: number) => (
            <div key={i} className="card p-4">
              <p className="text-sm font-bold text-gray-700 mb-2">第 {i + 1} 空</p>
              <div className="flex flex-wrap gap-2">
                {blank.options.map((opt: string) => {
                  const isSelected = answers[blank.index] === opt;
                  const showCorrect = submitted && opt === blank.answer;
                  const showWrong = submitted && isSelected && opt !== blank.answer;
                  return (
                    <button key={opt} onClick={() => !submitted && setAnswers(prev => ({ ...prev, [blank.index]: opt }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        showCorrect ? 'bg-green-50 text-green-700 border border-green-300' :
                        showWrong ? 'bg-red-50 text-red-700 border border-red-300' :
                        isSelected ? 'bg-[#E17055]/10 text-[#E17055] border border-[#E17055]' :
                        'bg-gray-50 text-gray-600 border border-gray-100 hover:border-[#E17055]/30'
                      }`}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {!submitted ? (
          <button onClick={handleSubmit} className="btn-primary w-full justify-center py-3 text-sm"
            disabled={Object.keys(answers).length < currentArticle.blanks.length}>
            提交答案
          </button>
        ) : (
          <div className="card p-4 text-center">
            <p className="font-bold text-gray-800">得分: {score}/{currentArticle.blanks.length}</p>
            <button onClick={() => setCurrentArticle(null)} className="btn-secondary mt-3 text-sm">继续练习</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlinePencil className="w-5 h-5 text-[#E17055]" />
        <h2 className="text-lg font-extrabold text-gray-800">学完形</h2>
      </div>
      {articles.length === 0 ? (
        <div className="text-center py-16">
          <Mascot expression="thinking" size="lg" />
          <p className="text-gray-500 text-sm">暂无完形填空题</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {articles.map((a) => (
            <div key={a.id} onClick={() => startCloze(a)}
              className="card p-4 cursor-pointer hover:shadow-lg transition-all">
              <h3 className="font-bold text-gray-800">{a.title}</h3>
              <p className="text-xs text-gray-500 mt-1">点击开始完形填空练习</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
