'use client';

import { useState } from 'react';
import { HiOutlineSpeakerWave, HiOutlineArrowPath, HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2';
import { speak, isSpeaking, stopSpeaking } from '@/lib/voice';
import { useLearningStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';

interface WordCardProps {
  word: {
    id: number;
    word: string;
    phoneticUS?: string | null;
    phoneticUK?: string | null;
    partOfSpeech?: string | null;
    definition: string;
    definitionEn?: string | null;
    examples?: string | null;
    memoryTip?: string | null;
    rootAffix?: string | null;
  };
  mode?: 'learn' | 'review';
  onResult?: (isCorrect: boolean) => void;
}

export default function WordCard({ word, mode = 'learn', onResult }: WordCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [mascotExpr, setMascotExpr] = useState<'idle' | 'talking' | 'celebrate' | 'sad'>('idle');
  const { accent } = useLearningStore();

  const handleSpeak = (text: string) => {
    if (isSpeaking()) {
      stopSpeaking();
      return;
    }
    setMascotExpr('talking');
    speak(text, accent, 0.9, 1, () => setMascotExpr('idle'));
  };

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleResult = (isCorrect: boolean) => {
    setMascotExpr(isCorrect ? 'celebrate' : 'sad');
    setTimeout(() => {
      setMascotExpr('idle');
      setFlipped(false);
      onResult?.(isCorrect);
    }, 800);
  };

  let examples: string[] = [];
  try {
    if (word.examples) examples = JSON.parse(word.examples);
  } catch { examples = []; }

  const phoneticKey = accent === 'US' ? 'phoneticUS' : 'phoneticUK';
  const phonetic = word[phoneticKey as keyof typeof word] || word.phoneticUS || word.phoneticUK;

  return (
    <div className="space-y-4">
      {/* Mascot */}
      <div className="flex justify-center">
        <Mascot expression={mascotExpr} size="md" onClick={() => handleSpeak(word.word)} />
      </div>

      {/* Word Card */}
      <div className={`word-card-perspective ${flipped ? 'word-card-flipped' : ''}`}>
        <div className="word-card-inner">
          {/* Front - Word */}
          <div className="word-card-face bg-gradient-to-br from-white to-[#FFF5F5] border-2 border-[#FFE8E8]">
            <button
              onClick={handleSpeak.bind(null, word.word)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center hover:bg-[#FF6B6B]/20 transition-colors"
            >
              <HiOutlineSpeakerWave className="w-5 h-5 text-[#FF6B6B]" />
            </button>

            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">{word.word}</h2>
              {phonetic && (
                <p className="text-gray-500 text-sm mb-3">/{phonetic}/</p>
              )}
              {word.partOfSpeech && (
                <span className="px-3 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600 font-medium">
                  {word.partOfSpeech}
                </span>
              )}
            </div>

            {mode === 'learn' && (
              <button onClick={handleFlip} className="mt-4 flex items-center gap-1.5 text-sm text-[#FF6B6B] font-bold hover:underline">
                <HiOutlineArrowPath className="w-4 h-4" />
                查看释义
              </button>
            )}
          </div>

          {/* Back - Definition */}
          <div className="word-card-face word-card-back-face bg-gradient-to-br from-white to-[#F0FFFE] border-2 border-[#E0F5F2]">
            <button
              onClick={handleSpeak.bind(null, word.word)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#4ECDC4]/10 flex items-center justify-center hover:bg-[#4ECDC4]/20 transition-colors"
            >
              <HiOutlineSpeakerWave className="w-4 h-4 text-[#4ECDC4]" />
            </button>

            <div className="flex-1 w-full overflow-y-auto text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-1">{word.word}</h3>
              {phonetic && <p className="text-gray-400 text-xs mb-3">/{phonetic}/</p>}

              <p className="text-lg font-bold text-[#FF6B6B] mb-3">{word.definition}</p>

              {word.definitionEn && (
                <p className="text-sm text-gray-500 mb-3 italic">{word.definitionEn}</p>
              )}

              {examples.length > 0 && (
                <div className="space-y-2 mt-3">
                  {examples.slice(0, 2).map((ex, i) => (
                    <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2.5 text-left">
                      <p className="text-sm text-gray-700 flex-1">{ex}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSpeak(ex); }}
                        className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <HiOutlineSpeakerWave className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {word.memoryTip && (
                <div className="mt-3 px-3 py-2 bg-[#FFE66D]/20 rounded-lg">
                  <span className="text-xs text-gray-600">💡 {word.memoryTip}</span>
                </div>
              )}

              {word.rootAffix && (
                <div className="mt-2 px-3 py-1.5 bg-[#A29BFE]/10 rounded-lg">
                  <span className="text-xs text-gray-600">🌱 {word.rootAffix}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons for review mode */}
      {mode === 'review' && !flipped && (
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => { setFlipped(true); }}
            className="px-6 py-3 bg-gradient-to-r from-[#4ECDC4] to-[#6DD5CE] text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            显示答案
          </button>
        </div>
      )}

      {mode === 'review' && flipped && (
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => handleResult(false)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E17055] to-[#E8886E] text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            <HiOutlineXMark className="w-5 h-5" />
            忘记了
          </button>
          <button
            onClick={() => handleResult(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00B894] to-[#55EFC4] text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            <HiOutlineCheck className="w-5 h-5" />
            记住了
          </button>
        </div>
      )}
    </div>
  );
}
