'use client';

import { useState, useEffect } from 'react';
import { HiOutlineBuildingLibrary, HiOutlineSpeakerWave } from 'react-icons/hi2';
import { useUserStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';

export default function ArticlesPage() {
  const { isLoggedIn } = useUserStore();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchArticles();
  }, [isLoggedIn]);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/practice/articles?type=current_affairs');
      const data = await res.json();
      if (data.success) setArticles(data.data || []);
    } catch {}
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#00B894]/30 border-t-[#00B894] rounded-full animate-spin" /></div>;
  }

  if (selectedArticle) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => setSelectedArticle(null)} className="text-sm text-[#00B894] font-bold hover:underline">← 返回</button>
        <div className="card p-5">
          <h2 className="text-lg font-extrabold text-gray-800 mb-3">{selectedArticle.title}</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{selectedArticle.level || '初级'}</span>
            <span className="text-xs text-gray-400">{selectedArticle.wordCount || 0} 词</span>
            {selectedArticle.audioUrl && (
              <button className="flex items-center gap-1 text-xs text-[#00B894] font-bold">
                <HiOutlineSpeakerWave className="w-3.5 h-3.5" /> 播放音频
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedArticle.content || '内容加载中...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineBuildingLibrary className="w-5 h-5 text-[#00B894]" />
        <h2 className="text-lg font-extrabold text-gray-800">学时文</h2>
      </div>
      {articles.length === 0 ? (
        <div className="text-center py-16">
          <Mascot expression="thinking" size="lg" />
          <p className="text-gray-500 text-sm mt-3">暂无时文，请先在后台添加</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {articles.map((a) => (
            <div key={a.id} onClick={() => setSelectedArticle(a)}
              className="card p-4 cursor-pointer hover:shadow-lg transition-all">
              <h3 className="font-bold text-gray-800">{a.title}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.summary || a.content?.slice(0, 100)}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full">{a.level || '初级'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
