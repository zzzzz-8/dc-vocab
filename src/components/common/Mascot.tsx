'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/lib/store';
import { isSpeaking } from '@/lib/voice';

interface MascotProps {
  expression?: 'happy' | 'sad' | 'thinking' | 'celebrate' | 'idle' | 'talking';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

// 多套卡通形象
const MASCOT_CHARACTERS: Record<string, { emoji: string; talking: string; bg: string }> = {
  default: { emoji: '🐱', talking: '😺', bg: 'from-yellow-100 to-yellow-50' },
  panda: { emoji: '🐼', talking: '🐼', bg: 'from-green-100 to-green-50' },
  fox: { emoji: '🦊', talking: '🦊', bg: 'from-orange-100 to-orange-50' },
  rabbit: { emoji: '🐰', talking: '🐰', bg: 'from-pink-100 to-pink-50' },
  bear: { emoji: '🐻', talking: '🐻', bg: 'from-amber-100 to-amber-50' },
  dog: { emoji: '🐶', talking: '🐶', bg: 'from-blue-100 to-blue-50' },
};

const expressionOverrides: Record<string, { emoji: string; bg: string }> = {
  happy: { emoji: '😄', bg: 'from-yellow-100 to-yellow-50' },
  sad: { emoji: '😅', bg: 'from-blue-100 to-blue-50' },
  thinking: { emoji: '🤔', bg: 'from-purple-100 to-purple-50' },
  celebrate: { emoji: '🎉', bg: 'from-green-100 to-green-50' },
  idle: { emoji: '😊', bg: 'from-pink-100 to-pink-50' },
  talking: { emoji: '🗣️', bg: 'from-orange-100 to-orange-50' },
};

const sizes = {
  sm: 'w-10 h-10 text-xl',
  md: 'w-14 h-14 text-2xl',
  lg: 'w-20 h-20 text-4xl',
};

export default function Mascot({ expression = 'idle', size = 'md', className = '', onClick }: MascotProps) {
  const { mascotId } = useSettingsStore();
  const [talking, setTalking] = useState(false);

  // 检测说话状态
  useEffect(() => {
    const checkSpeaking = () => {
      setTalking(isSpeaking());
    };
    const interval = setInterval(checkSpeaking, 200);
    return () => clearInterval(interval);
  }, []);

  // 选择形象
  const character = MASCOT_CHARACTERS[mascotId] || MASCOT_CHARACTERS.default;
  const exprOverride = expressionOverrides[expression] || expressionOverrides.idle;

  // 是否使用表情覆盖（如开心、庆祝等）
  const useExpressionOverride = expression !== 'idle' && expression !== 'talking';

  // 显示内容：优先表情覆盖，其次说话动画，最后默认表情
  let displayEmoji = character.emoji;
  let displayBg = character.bg;

  if (useExpressionOverride) {
    displayEmoji = exprOverride.emoji;
    displayBg = exprOverride.bg;
  } else if (talking || expression === 'talking') {
    // 说话时显示嘴型动画
    displayEmoji = character.talking;
    displayBg = 'from-orange-100 to-orange-50';
  }

  return (
    <div
      className={`mascot-circle ${sizes[size]} bg-gradient-to-br ${displayBg} cursor-pointer select-none animate-float ${className}`}
      onClick={onClick}
      title="点击跟我互动"
    >
      <span className={`inline-block ${talking ? 'animate-wiggle' : 'animate-bounce-in'}`}>
        {displayEmoji}
      </span>
    </div>
  );
}
