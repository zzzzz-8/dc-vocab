'use client';

import { useState, useCallback, useRef } from 'react';
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark, HiOutlineBookOpen, HiOutlineXMark } from 'react-icons/hi2';
import { speak, stopSpeaking } from '@/lib/voice';
import { useSettingsStore, useLearningStore, useToastStore } from '@/lib/store';
import type { WordData } from '@/types';

interface WordItemProps {
  word: WordData;
  /** 右侧操作按钮 */
  actions?: React.ReactNode;
  /** 是否显示音标 */
  showPhonetic?: boolean;
  /** 显示模式: list=精简列表, card=卡片模式 */
  mode?: 'list' | 'card';
  /** 额外CSS类 */
  className?: string;
  /** 点击发音回调 */
  onPlay?: (word: WordData) => void;
  /** 双击展开回调 */
  onExpand?: (word: WordData, expanded: boolean) => void;
}

/**
 * 全局单词统一交互组件
 *
 * 单击 → 播放发音
 * 双击 → 展开完整词条面板
 * 再次双击 → 收起
 */
export default function WordItem({
  word,
  actions,
  showPhonetic = true,
  mode = 'list',
  className = '',
  onPlay,
  onExpand,
}: WordItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const { isMuted } = useSettingsStore();
  const { accent } = useLearningStore();
  const { addToast } = useToastStore();
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDblClick = useRef(false);

  // 解析例句
  const examples: string[] = (() => {
    try {
      if (!word.examples) return [];
      return JSON.parse(word.examples);
    } catch {
      return [];
    }
  })();

  // 解析词形变化
  const wordForms: string[] = (() => {
    if (!word.wordForm) return [];
    return word.wordForm.split(',').map((f: string) => f.trim());
  })();

  // 拼音显示
  const phoneticDisplay = accent === 'US'
    ? (word.phoneticUS || word.phoneticUK || '')
    : (word.phoneticUK || word.phoneticUS || '');

  const handleClick = useCallback(() => {
    if (isDblClick.current) {
      isDblClick.current = false;
      return;
    }

    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }

    clickTimer.current = setTimeout(() => {
      // 单击：播放发音
      if (!isMuted) {
        setPlaying(true);
        speak(word.word, accent === 'US' ? 'US' : 'UK', 0.9, 1, () => {
          setPlaying(false);
        });
        onPlay?.(word);
      } else {
        addToast('已开启静音模式，请在设置中关闭', 'warning');
      }
    }, 250); // 250ms内等待可能的双击
  }, [word, accent, isMuted, addToast, onPlay]);

  const handleDoubleClick = useCallback(() => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    isDblClick.current = true;
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onExpand?.(word, newExpanded);
  }, [expanded, word, onExpand]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMuted) {
      setPlaying(true);
      speak(word.word, accent === 'US' ? 'US' : 'UK', 0.9, 1, () => setPlaying(false));
    }
  };

  const listMode = (
    <>
      {/* 单词行 - 单击发音，双击展开 */}
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none
          hover:bg-black/5 transition-colors rounded-lg ${expanded ? 'bg-black/5' : ''} ${className}`}
      >
        {/* 播放动画指示器 */}
        {playing && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-0.5">
            <span className="w-1 h-3 bg-[#FF6B6B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-4 bg-[#4ECDC4] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-2 bg-[#FFE66D] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}

        {/* 单词 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 text-base hover:text-[#FF6B6B] transition-colors">
              {word.word}
            </span>
            {showPhonetic && phoneticDisplay && (
              <span className="text-xs text-gray-400 font-mono">/{phoneticDisplay}/</span>
            )}
            <button
              onClick={handlePlayClick}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-[#FF6B6B]"
              title="播放发音"
            >
              <HiOutlineSpeakerWave className="w-4 h-4" />
            </button>
          </div>
          {mode !== 'list' && (
            <p className="text-xs text-gray-500 mt-0.5">{word.partOfSpeech ? `[${word.partOfSpeech}] ` : ''}{word.definition}</p>
          )}
        </div>

        {/* 右侧操作按钮 */}
        {actions && (
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>

      {/* 展开的完整词条面板 */}
      {expanded && (
        <WordDetailPanel
          word={word}
          phoneticDisplay={phoneticDisplay}
          examples={examples}
          wordForms={wordForms}
          onClose={() => setExpanded(false)}
        />
      )}
    </>
  );

  const cardMode = (
    <div className={`card p-4 ${className}`}>
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className="cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 text-lg">{word.word}</span>
              {playing && (
                <span className="flex gap-0.5 items-end h-4">
                  <span className="w-1 bg-[#FF6B6B] rounded-full animate-bounce" style={{ animationDelay: '0ms', height: '12px' }} />
                  <span className="w-1 bg-[#4ECDC4] rounded-full animate-bounce" style={{ animationDelay: '150ms', height: '16px' }} />
                  <span className="w-1 bg-[#FFE66D] rounded-full animate-bounce" style={{ animationDelay: '300ms', height: '8px' }} />
                </span>
              )}
            </div>
            {showPhonetic && phoneticDisplay && (
              <span className="text-xs text-gray-400 font-mono">/{phoneticDisplay}/</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePlayClick} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#FF6B6B]">
              <HiOutlineSpeakerWave className="w-5 h-5" />
            </button>
            {actions}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {word.partOfSpeech && <span className="text-gray-400">[{word.partOfSpeech}] </span>}
          {word.definition}
        </p>
      </div>

      {/* 展开词条面板 */}
      {expanded && (
        <WordDetailPanel
          word={word}
          phoneticDisplay={phoneticDisplay}
          examples={examples}
          wordForms={wordForms}
          onClose={() => setExpanded(false)}
        />
      )}
    </div>
  );

  return mode === 'card' ? cardMode : listMode;
}

// ==================== 展开的完整词条面板 ====================
function WordDetailPanel({
  word,
  phoneticDisplay,
  examples,
  wordForms,
  onClose,
}: {
  word: WordData;
  phoneticDisplay: string;
  examples: string[];
  wordForms: string[];
  onClose: () => void;
}) {
  const { accent } = useLearningStore();
  const { isMuted } = useSettingsStore();
  const { addToast } = useToastStore();
  const [showPhonetic, setShowPhonetic] = useState(false);
  const [showPos, setShowPos] = useState(false);
  const [showDefinition, setShowDefinition] = useState(false);
  const [showForms, setShowForms] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showRoot, setShowRoot] = useState(false);
  const [showMemoryTip, setShowMemoryTip] = useState(false);

  // 解析词根词缀
  const rootAffixParts: { root: string; meaning: string }[] = (() => {
    if (!word.rootAffix) return [];
    try {
      const parsed = JSON.parse(word.rootAffix);
      return Array.isArray(parsed) ? parsed : [{ root: word.rootAffix, meaning: '' }];
    } catch {
      return word.rootAffix.split(';').map((r: string) => {
        const parts = r.trim().split(':');
        return { root: parts[0]?.trim() || '', meaning: parts[1]?.trim() || '' };
      });
    }
  })();

  const playWord = () => {
    if (!isMuted) {
      speak(word.word, accent === 'US' ? 'US' : 'UK', 0.9, 1);
    }
  };

  return (
    <div className="mx-4 mb-3 p-4 bg-white rounded-xl border border-gray-100 shadow-lg animate-slide-up">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-800 text-base">{word.word}</span>
          <button
            onClick={playWord}
            className="p-1.5 rounded-full hover:bg-gray-100 text-[#FF6B6B]"
          >
            <HiOutlineSpeakerWave className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
        >
          <HiOutlineXMark className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {/* 音标 - 可点击切换显示 */}
        <DetailRow
          label="音标"
          show={showPhonetic}
          onToggle={() => setShowPhonetic(!showPhonetic)}
          defaultShow={true}
        >
          <div className="flex gap-4">
            {word.phoneticUS && (
              <div><span className="text-gray-400 text-xs">美</span> /{word.phoneticUS}/</div>
            )}
            {word.phoneticUK && (
              <div><span className="text-gray-400 text-xs">英</span> /{word.phoneticUK}/</div>
            )}
          </div>
        </DetailRow>

        {/* 词性 */}
        <DetailRow
          label="词性"
          show={showPos}
          onToggle={() => setShowPos(!showPos)}
          defaultShow={true}
        >
          <span>{word.partOfSpeech || '无'}</span>
        </DetailRow>

        {/* 中文释义 */}
        <DetailRow
          label="释义"
          show={showDefinition}
          onToggle={() => setShowDefinition(!showDefinition)}
          defaultShow={true}
        >
          <div>
            <p className="text-gray-800">{word.definition}</p>
            {word.definitionEn && (
              <p className="text-gray-400 text-xs mt-0.5">{word.definitionEn}</p>
            )}
          </div>
        </DetailRow>

        {/* 词形变化 */}
        {wordForms.length > 0 && (
          <DetailRow
            label="变形"
            show={showForms}
            onToggle={() => setShowForms(!showForms)}
          >
            <div className="flex flex-wrap gap-2">
              {wordForms.map((f, i) => {
                const [type, val] = f.split(':');
                return (
                  <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {type && <span className="text-gray-400">{type}:</span>} {val || f}
                  </span>
                );
              })}
            </div>
          </DetailRow>
        )}

        {/* 例句 */}
        {examples.length > 0 && (
          <DetailRow
            label={`例句 (${examples.length})`}
            show={showExamples}
            onToggle={() => setShowExamples(!showExamples)}
          >
            <div className="space-y-2">
              {examples.map((ex, i) => (
                <div key={i} className="text-sm p-2 bg-gray-50 rounded-lg">
                  {ex}
                </div>
              ))}
            </div>
          </DetailRow>
        )}

        {/* 词根词缀 */}
        {rootAffixParts.length > 0 && (
          <DetailRow
            label="词根词缀"
            show={showRoot}
            onToggle={() => setShowRoot(!showRoot)}
          >
            <div className="flex flex-wrap gap-2">
              {rootAffixParts.map((r, i) => (
                <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                  {r.root}{r.meaning ? `: ${r.meaning}` : ''}
                </span>
              ))}
            </div>
          </DetailRow>
        )}

        {/* 记忆技巧 */}
        {word.memoryTip && (
          <DetailRow
            label="记忆技巧"
            show={showMemoryTip}
            onToggle={() => setShowMemoryTip(!showMemoryTip)}
          >
            <p className="text-sm text-gray-600">{word.memoryTip}</p>
          </DetailRow>
        )}
      </div>
    </div>
  );
}

// ==================== 词条详情行（可折叠） ====================
function DetailRow({
  label,
  show,
  onToggle,
  children,
  defaultShow = false,
}: {
  label: string;
  show: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  defaultShow?: boolean;
}) {
  const isVisible = show || defaultShow;
  return (
    <div className="border-b border-gray-50 pb-2 last:border-0">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors w-full text-left"
      >
        <span className={`transform transition-transform ${isVisible ? 'rotate-90' : ''}`}>▸</span>
        {label}
        {!isVisible && <span className="text-gray-300">点击展开</span>}
      </button>
      {isVisible && (
        <div className="mt-1 text-sm ml-4" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
}
