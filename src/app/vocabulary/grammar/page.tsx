'use client';

import { useState, useEffect } from 'react';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import VoiceButton from '@/components/common/VoiceButton';

interface GrammarData {
  id: string;
  title: string;
  category: string;
  content: string;
  examples: string | null;
  exercises: string | null;
  difficulty: string | null;
  orderIndex: number;
}

export default function GrammarPage() {
  const [points, setPoints] = useState<GrammarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<GrammarData | null>(null);

  useEffect(() => {
    fetchGrammar();
  }, [category]);

  const fetchGrammar = async () => {
    setLoading(true);
    try {
      const params = category !== 'all' ? `?category=${category}` : '';
      const res = await fetch(`/api/vocabulary/grammar${params}`);
      const data = await res.json();
      if (data.success) setPoints(data.data);
    } catch (err) {
      console.error('Failed to fetch grammar:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', '词法', '时态', '语态', '句法', '语气'];
  const difficultyLabels: Record<string, string> = {
    BASIC: '初级', INTERMEDIATE: '中级', ADVANCED: '高级',
  };
  const difficultyColors: Record<string, string> = {
    BASIC: 'bg-green-100 text-green-700',
    INTERMEDIATE: 'bg-orange-100 text-orange-700',
    ADVANCED: 'bg-red-100 text-red-700',
  };

  if (selected) {
    const examples: string[] = selected.examples ? JSON.parse(selected.examples) : [];
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={() => setSelected(null)} className="text-sm text-[#0984E3] font-bold hover:underline">← 返回</button>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#0984E3]/10 text-[#0984E3]">{selected.category}</span>
            {selected.difficulty && (
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${difficultyColors[selected.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                {difficultyLabels[selected.difficulty] || selected.difficulty}
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">{selected.title}</h2>
          <div className="text-sm text-gray-700 mb-4 leading-relaxed">{selected.content}</div>
          {examples.length > 0 && (
            <>
              <h3 className="font-bold text-sm text-gray-700 mb-2">例句</h3>
              <div className="space-y-2">
                {examples.map((ex: string, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 flex items-center justify-between">
                    <span>{ex}</span>
                    <VoiceButton text={ex} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineAcademicCap className="w-5 h-5 text-[#0984E3]" />
        <h2 className="text-lg font-extrabold text-gray-800">学语法</h2>
      </div>
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold ${category === c ? 'bg-[#0984E3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {c === 'all' ? '全部' : c}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">加载中...</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {points.map((g) => (
            <div key={g.id} onClick={() => setSelected(g)}
              className="card p-4 cursor-pointer hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0984E3]/10 text-[#0984E3]">{g.category}</span>
                {g.difficulty && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${difficultyColors[g.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                    {difficultyLabels[g.difficulty] || g.difficulty}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-gray-800">{g.title}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{g.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
