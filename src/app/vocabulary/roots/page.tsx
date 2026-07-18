'use client';

import { useState, useEffect } from 'react';
import { HiOutlineLightBulb } from 'react-icons/hi2';
import { useUserStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';
import VoiceButton from '@/components/common/VoiceButton';

interface RootData {
  id: string;
  root: string;
  type: 'prefix' | 'suffix' | 'root';
  meaning: string;
  origin: string | null;
  examples: string | null;
  description: string | null;
}

export default function RootsPage() {
  const { token } = useUserStore();
  const [roots, setRoots] = useState<RootData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<RootData | null>(null);

  useEffect(() => {
    fetchRoots();
  }, [filter]);

  const fetchRoots = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?type=${filter}` : '';
      const res = await fetch(`/api/vocabulary/roots${params}`);
      const data = await res.json();
      if (data.success) setRoots(data.data);
    } catch (err) {
      console.error('Failed to fetch roots:', err);
    } finally {
      setLoading(false);
    }
  };

  const types = ['prefix', 'suffix', 'root'];
  const typeNames = ['前缀 Prefix', '后缀 Suffix', '词根 Root'];
  const typeColors = ['bg-[#6C5CE7]/10 text-[#6C5CE7]', 'bg-[#00B894]/10 text-[#00B894]', 'bg-[#FDCB6E]/10 text-[#FDCB6E]'];

  if (selected) {
    const examples: string[] = selected.examples ? JSON.parse(selected.examples) : [];
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <button onClick={() => setSelected(null)} className="text-sm text-[#6C5CE7] font-bold hover:underline">← 返回列表</button>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${typeColors[types.indexOf(selected.type)]}`}>
              {typeNames[types.indexOf(selected.type)]}
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800 mb-2">{selected.root}</h2>
          <p className="text-lg text-[#6C5CE7] font-bold mb-4">{selected.meaning}</p>
          {selected.origin && (
            <p className="text-sm text-gray-500 mb-4">来源: {selected.origin}</p>
          )}
          {selected.description && (
            <p className="text-sm text-gray-500 mb-4">{selected.description}</p>
          )}
          <h3 className="font-bold text-gray-700 text-sm mb-2">例词</h3>
          <div className="space-y-2">
            {examples.map((ex: string, i: number) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 flex items-center justify-between">
                <span>{ex}</span>
                <VoiceButton text={ex.split(' ')[0]} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineLightBulb className="w-5 h-5 text-[#6C5CE7]" />
        <h2 className="text-lg font-extrabold text-gray-800">词根缀</h2>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>全部</button>
        {types.map((t, i) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold ${filter === t ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {typeNames[i]}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">加载中...</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {roots.map((root) => {
            const examples: string[] = root.examples ? JSON.parse(root.examples) : [];
            return (
              <div key={root.id} onClick={() => setSelected(root)}
                className="card p-4 cursor-pointer hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeColors[types.indexOf(root.type)]}`}>
                    {typeNames[types.indexOf(root.type)]}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-gray-800">{root.root}</h3>
                <p className="text-sm text-[#6C5CE7] font-bold mt-1">{root.meaning}</p>
                <div className="mt-2 space-y-0.5">
                  {examples.slice(0, 3).map((ex, i) => (
                    <p key={i} className="text-xs text-gray-500">{ex}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
