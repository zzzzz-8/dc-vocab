'use client';

import { useState, useEffect } from 'react';
import { HiOutlineMagnifyingGlass, HiOutlineSpeakerWave } from 'react-icons/hi2';
import { speak } from '@/lib/voice';
import { useLearningStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';
import VoiceButton from '@/components/common/VoiceButton';

export default function DictionaryPage() {
  const { accent } = useLearningStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchWord = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/tools/dictionary?word=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.success) setResults(data.data);
    } catch {}
    setLoading(false);
  };

  const playWord = (text: string) => speak(text, accent, 0.9, 1);

  let examples: string[] = [];
  if (results?.exact?.examples) {
    try { examples = JSON.parse(results.exact.examples); } catch {}
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineMagnifyingGlass className="w-5 h-5 text-[#0984E3]" />
        <h2 className="text-lg font-extrabold text-gray-800">查词典</h2>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="输入要查询的单词..."
          className="input-field flex-1" autoFocus
          onKeyDown={e => e.key === 'Enter' && searchWord()} />
        <button onClick={searchWord} className="btn-primary text-sm px-6">
          <HiOutlineMagnifyingGlass className="w-4 h-4" />
          查询
        </button>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-10 h-10 border-4 border-[#0984E3]/30 border-t-[#0984E3] rounded-full animate-spin" />
        </div>
      )}

      {results && !loading && (
        <div className="space-y-4">
          {results.exact ? (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-2xl font-extrabold text-gray-800">{results.exact.word}</h3>
                <VoiceButton text={results.exact.word} size="md" />
              </div>

              {results.exact.phoneticUS && (
                <p className="text-gray-500 text-sm mb-1">美式: /{results.exact.phoneticUS}/</p>
              )}
              {results.exact.phoneticUK && (
                <p className="text-gray-500 text-sm mb-3">英式: /{results.exact.phoneticUK}/</p>
              )}

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-lg font-bold text-[#0984E3]">{results.exact.definition}</p>
                {results.exact.definitionEn && (
                  <p className="text-sm text-gray-500 mt-1 italic">{results.exact.definitionEn}</p>
                )}
              </div>

              {results.exact.partOfSpeech && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">
                  {results.exact.partOfSpeech}
                </span>
              )}

              {examples.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-bold text-sm text-gray-700 mb-2">例句</h4>
                  <div className="space-y-2">
                    {examples.map((ex, i) => (
                      <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 flex-1">{ex}</p>
                        <button onClick={() => playWord(ex)}
                          className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                          <HiOutlineSpeakerWave className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.exact.memoryTip && (
                <div className="mt-3 p-3 bg-[#FFE66D]/20 rounded-lg">
                  <span className="text-xs text-gray-600">💡 记忆技巧: {results.exact.memoryTip}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-6 text-center">
              <Mascot expression="thinking" size="md" />
              <p className="text-gray-500 mt-3">没有找到 "{query}" 的释义</p>
            </div>
          )}

          {results.words?.length > 1 && (
            <div className="card p-4">
              <h4 className="font-bold text-sm text-gray-700 mb-2">其他匹配结果</h4>
              <div className="space-y-1">
                {results.words.filter((w: any) => w.id !== results.exact?.id).slice(0, 5).map((w: any) => (
                  <button key={w.id} onClick={() => { setQuery(w.word); searchWord(); }}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600">
                    {w.word} - {w.definition}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!results && !loading && searched && (
        <div className="text-center py-10 text-gray-400 text-sm">请输入单词进行查询</div>
      )}
    </div>
  );
}
