'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineBookOpen, HiOutlineSpeakerWave, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import { useUserStore, useToastStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';

export default function ReadingPage() {
  const { isLoggedIn } = useUserStore();
  const { addToast } = useToastStore();
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [currentArticle, setCurrentArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return; }
    fetchArticles();
  }, [isLoggedIn]);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/practice/articles?type=reading');
      const data = await res.json();
      if (data.success) setArticles(data.data || []);
    } catch {}
    setLoading(false);
  };

  const startReading = (article: any) => {
    setCurrentArticle(article);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  // Generate mock questions from article
  const getQuestions = (article: any) => {
    if (article.questions) {
      try { return JSON.parse(article.questions); } catch {}
    }
    return [
      { id: 'q1', question: '这篇文章的主要主题是什么？', options: ['A) 科技发展', 'B) 环境保护', 'C) 文化教育', 'D) 健康生活'], answer: 'B' },
      { id: 'q2', question: '根据文章，作者的主要观点是？', options: ['A) 观点一', 'B) 观点二', 'C) 观点三', 'D) 观点四'], answer: 'A' },
    ];
  };

  const handleAnswer = (qId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const handleSubmit = async () => {
    const questions = getQuestions(currentArticle);
    let correct = 0;
    questions.forEach((q: any) => {
      if (answers[q.id] === q.answer) correct++;
    });
    setScore(correct);
    setSubmitted(true);

    // Submit results
    for (const q of questions) {
      await fetch('/api/practice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practiceType: 'reading',
          articleId: String(currentArticle.id),
          questionId: q.id,
          question: q.question,
          userAnswer: answers[q.id] || '',
          correctAnswer: q.answer,
          isCorrect: answers[q.id] === q.answer,
        }),
      });
    }
    addToast(`完成阅读练习！正确率 ${Math.round(correct/questions.length*100)}%`, 'success');
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#6C5CE7]/30 border-t-[#6C5CE7] rounded-full animate-spin" /></div>;
  }

  if (currentArticle) {
    const questions = getQuestions(currentArticle);
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => setCurrentArticle(null)} className="text-sm text-[#6C5CE7] font-bold hover:underline">
          ← 返回文章列表
        </button>
        <h2 className="text-lg font-extrabold text-gray-800">{currentArticle.title}</h2>
        <div className="card p-5">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{currentArticle.content || '文章内容加载中...'}</p>
        </div>
        <h3 className="font-bold text-gray-700">阅读理解题</h3>
        <div className="space-y-4">
          {questions.map((q: any, i: number) => (
            <div key={q.id} className="card p-4">
              <p className="font-bold text-sm text-gray-800 mb-3">{i + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt: string) => {
                  const isSelected = answers[q.id] === opt.charAt(0);
                  const showCorrect = submitted && opt.charAt(0) === q.answer;
                  const showWrong = submitted && isSelected && opt.charAt(0) !== q.answer;
                  return (
                    <button
                      key={opt}
                      onClick={() => !submitted && handleAnswer(q.id, opt.charAt(0))}
                      className={`w-full text-left p-3 rounded-lg text-sm transition-all ${
                        showCorrect ? 'bg-green-50 border border-green-300' :
                        showWrong ? 'bg-red-50 border border-red-300' :
                        isSelected ? 'bg-[#6C5CE7]/10 border border-[#6C5CE7]' :
                        'bg-gray-50 border border-gray-100 hover:border-[#6C5CE7]/30'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {showCorrect && <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />}
                        {showWrong && <HiOutlineXCircle className="w-4 h-4 text-red-500" />}
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {!submitted ? (
          <button onClick={handleSubmit} className="btn-primary w-full justify-center py-3 text-sm"
            disabled={Object.keys(answers).length < questions.length}>
            提交答案
          </button>
        ) : (
          <div className="card p-4 text-center">
            <p className="font-bold text-gray-800">得分: {score}/{questions.length}</p>
            <button onClick={() => { setCurrentArticle(null); fetchArticles(); }}
              className="btn-secondary mt-3 text-sm">
              继续阅读
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineBookOpen className="w-5 h-5 text-[#6C5CE7]" />
        <h2 className="text-lg font-extrabold text-gray-800">学阅读</h2>
      </div>
      {articles.length === 0 ? (
        <div className="text-center py-16">
          <Mascot expression="thinking" size="lg" />
          <p className="text-gray-500 text-sm mt-3">暂无阅读文章，请先在后台添加</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {articles.map((article) => (
            <div key={article.id} onClick={() => startReading(article)}
              className="card p-4 cursor-pointer hover:shadow-lg transition-all">
              <h3 className="font-bold text-gray-800">{article.title}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.summary || article.content?.slice(0, 100)}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{article.level || '初级'}</span>
                <span className="text-[10px] text-gray-400">{article.wordCount || 0} 词</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
