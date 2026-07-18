'use client';

import { useState, useEffect } from 'react';
import { HiOutlineSpeakerWave } from 'react-icons/hi2';
import { speak } from '@/lib/voice';
import { useLearningStore } from '@/lib/store';

interface PhoneticSymbolData {
  id: string;
  symbol: string;
  type: string;
  examples: string | null;
  audioUrl: string | null;
  tip: string | null;
}

export default function PhoneticsPage() {
  const { accent } = useLearningStore();
  const [vowels, setVowels] = useState<PhoneticSymbolData[]>([]);
  const [consonants, setConsonants] = useState<PhoneticSymbolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'vowels' | 'consonants'>('vowels');
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vowelRes, consRes] = await Promise.all([
        fetch('/api/vocabulary/phonetics?type=vowel'),
        fetch('/api/vocabulary/phonetics?type=consonant'),
      ]);
      const vowelData = await vowelRes.json();
      const consData = await consRes.json();
      if (vowelData.success) setVowels(vowelData.data);
      if (consData.success) setConsonants(consData.data);
    } catch (err) {
      console.error('Failed to fetch phonetics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (text: string) => {
    setPlaying(text);
    speak(text, accent, 0.7, 1, () => setPlaying(null));
  };

  const symbols = tab === 'vowels' ? vowels : consonants;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineSpeakerWave className="w-5 h-5 text-[#E17055]" />
        <h2 className="text-lg font-extrabold text-gray-800">学音标</h2>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('vowels')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold ${tab === 'vowels' ? 'bg-[#E17055] text-white' : 'bg-gray-100 text-gray-600'}`}>
          元音 ({vowels.length})
        </button>
        <button onClick={() => setTab('consonants')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold ${tab === 'consonants' ? 'bg-[#E17055] text-white' : 'bg-gray-100 text-gray-600'}`}>
          辅音 ({consonants.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">加载中...</div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {symbols.map((s) => {
            const examples: string[] = s.examples ? JSON.parse(s.examples) : [];
            return (
              <div key={s.id} className="card p-3 flex items-center gap-3">
                <button onClick={() => handlePlay(s.symbol)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${
                    playing === s.symbol ? 'bg-[#E17055] text-white scale-110' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  {s.symbol}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400">{s.type === 'vowel' ? '元音' : '辅音'}</div>
                  <div className="text-xs text-gray-600 truncate">{examples.join(', ')}</div>
                  {s.tip && <div className="text-[10px] text-gray-400 truncate">{s.tip}</div>}
                </div>
                <button onClick={() => handlePlay(examples[0] || '')}
                  className="text-xs text-[#E17055] font-bold hover:underline flex-shrink-0">
                  听例词
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
