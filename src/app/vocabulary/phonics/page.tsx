'use client';

import { useState, useCallback } from 'react';
import { HiOutlineBookOpen, HiOutlineShieldCheck } from 'react-icons/hi2';
import { speak } from '@/lib/voice';
import { useLearningStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';

const rules = [
  { title: '字母C的发音', rule: 'c + e/i/y → /s/；其他 → /k/', examples: ['cat /kæt/', 'city /ˈsɪti/', 'cent /sent/', 'cup /kʌp/'], level: '初级' },
  { title: '字母G的发音', rule: 'g + e/i/y → /dʒ/；其他 → /ɡ/', examples: ['go /ɡəʊ/', 'gem /dʒem/', 'get /ɡet/', 'giant /ˈdʒaɪənt/'], level: '初级' },
  { title: '字母S的发音', rule: '词首 → /s/；元音间 → /z/；清音后 → /s/；浊音后 → /z/', examples: ['sun /sʌn/', 'nose /nəʊz/', 'cats /kæts/', 'dogs /dɒɡz/'], level: '初级' },
  { title: '字母组合sh', rule: 'sh → /ʃ/', examples: ['she /ʃiː/', 'fish /fɪʃ/', 'ship /ʃɪp/', 'shut /ʃʌt/'], level: '初级' },
  { title: '字母组合ch', rule: 'ch → /tʃ/', examples: ['chair /tʃeə/', 'teach /tiːtʃ/', 'China /ˈtʃaɪnə/', 'lunch /lʌntʃ/'], level: '初级' },
  { title: '字母组合th', rule: 'th → 清音/θ/或浊音/ð/', examples: ['think /θɪŋk/', 'the /ðə/', 'three /θriː/', 'this /ðɪs/'], level: '初级' },
  { title: '字母组合ph', rule: 'ph → /f/', examples: ['phone /fəʊn/', 'photo /ˈfəʊtəʊ/', 'elephant /ˈelɪfənt/', 'graph /ɡræf/'], level: '初级' },
  { title: '字母组合wh', rule: 'wh → /w/；wh+o → /h/', examples: ['what /wɒt/', 'where /weə/', 'who /huː/', 'whole /həʊl/'], level: '初级' },
  { title: 'magic E规则', rule: 'e在词尾不发音，但使前面的元音发长音', examples: ['make /meɪk/', 'time /taɪm/', 'home /həʊm/', 'use /juːz/'], level: '初级' },
  { title: '双写辅音规则', rule: '短元音+单辅音+后缀 → 双写辅音', examples: ['big → bigger', 'hot → hottest', 'run → running', 'swim → swimming'], level: '中级' },
  { title: 'tion/sion的发音', rule: 'tion → /ʃən/；sion → /ʒən/ 或 /ʃən/', examples: ['nation /ˈneɪʃən/', 'vision /ˈvɪʒən/', 'action /ˈækʃən/', 'television /ˈtelɪvɪʒən/'], level: '中级' },
  { title: '重读音节规则', rule: '双音节名词重音在前，动词重音在后', examples: ['ˈrecord (n) / reˈcord (v)', 'ˈpresent (n) / preˈsent (v)', 'ˈproduce (n) / proˈduce (v)'], level: '中级' },
  { title: '字母组合ea', rule: 'ea → 通常发/iː/，部分发/e/', examples: ['eat /iːt/', 'bread /bred/', 'read /riːd/', 'weather /ˈweðə/'], level: '初级' },
  { title: '字母组合oo', rule: 'oo → 通常发/uː/，部分发/ʊ/', examples: ['food /fuːd/', 'book /bʊk/', 'school /skuːl/', 'good /ɡʊd/'], level: '初级' },
  { title: '字母组合igh', rule: 'igh → /aɪ/', examples: ['light /laɪt/', 'night /naɪt/', 'right /raɪt/', 'high /haɪ/'], level: '初级' },
];

export default function PhonicsPage() {
  const { accent } = useLearningStore();
  const [level, setLevel] = useState('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [mastered, setMastered] = useState<Set<number>>(new Set());

  const filtered = level === 'all' ? rules : rules.filter(r => r.level === level);

  const toggleMastered = useCallback((idx: number) => {
    setMastered(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineBookOpen className="w-5 h-5 text-[#A29BFE]" />
        <h2 className="text-lg font-extrabold text-gray-800">学拼读</h2>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', '初级', '中级'].map(l => (
            <button key={l} onClick={() => setLevel(l)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold ${level === l ? 'bg-[#A29BFE] text-white' : 'bg-gray-100 text-gray-600'}`}>
              {l === 'all' ? '全部' : l}
            </button>
          ))}
        </div>
        {mastered.size > 0 && (
          <span className="text-xs text-gray-400">已掌握 {mastered.size}/{rules.length}</span>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((rule, i) => {
          const globalIdx = rules.indexOf(rule);
          const isExpanded = expandedIndex === globalIdx;
          return (
            <div key={globalIdx} className={`card p-4 transition-all ${isExpanded ? 'ring-2 ring-[#A29BFE]' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#A29BFE]/10 flex items-center justify-center text-xs font-bold text-[#A29BFE] flex-shrink-0 mt-0.5">
                  {globalIdx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-800 text-sm">{rule.title}</h3>
                    <button onClick={() => toggleMastered(globalIdx)}
                      className={`flex-shrink-0 p-1 rounded transition-all ${
                        mastered.has(globalIdx) ? 'text-green-500 bg-green-50' : 'text-gray-300 hover:text-gray-400'
                      }`}>
                      <HiOutlineShieldCheck className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#A29BFE] font-medium mt-1">{rule.rule}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {rule.examples.slice(0, isExpanded ? rule.examples.length : 2).map((ex, j) => {
                      const word = ex.split('/')[0]?.trim() || ex;
                      return (
                        <button key={j}
                          onClick={() => speak(word, accent, 0.8, 1)}
                          className="px-3 py-1 bg-gray-50 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors">
                          {ex}
                        </button>
                      );
                    })}
                    {!isExpanded && rule.examples.length > 2 && (
                      <button onClick={() => setExpandedIndex(globalIdx)}
                        className="px-3 py-1 text-xs text-[#A29BFE] font-bold hover:underline">
                        +{rule.examples.length - 2} 更多
                      </button>
                    )}
                    {isExpanded && (
                      <button onClick={() => setExpandedIndex(null)}
                        className="px-3 py-1 text-xs text-gray-400 hover:underline">
                        收起
                      </button>
                    )}
                  </div>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                    rule.level === '初级' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {rule.level}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
