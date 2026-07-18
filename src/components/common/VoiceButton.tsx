'use client';

import { useState } from 'react';
import { HiOutlineSpeakerWave } from 'react-icons/hi2';
import { speak, isSpeaking, stopSpeaking } from '@/lib/voice';
import { useLearningStore } from '@/lib/store';

interface VoiceButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function VoiceButton({ text, className = '', size = 'sm' }: VoiceButtonProps) {
  const [playing, setPlaying] = useState(false);
  const { accent } = useLearningStore();

  const handleClick = () => {
    if (isSpeaking()) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    speak(text, accent, 0.9, 1, () => setPlaying(false));
  };

  const sizeClass = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';

  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleClick(); }}
      className={`${sizeClass} rounded-full flex items-center justify-center transition-all ${
        playing ? 'bg-[#FF6B6B] text-white animate-pulse-glow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      } ${className}`}
      title={playing ? '停止' : '点击发音'}
    >
      <HiOutlineSpeakerWave className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
    </button>
  );
}
