'use client';

import { useState } from 'react';
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlinePrinter,
  HiOutlineArrowDownTray,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { useSettingsStore } from '@/lib/store';
import type { FontSizeLevel, ThemeMode } from '@/types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FONT_SIZES: { level: FontSizeLevel; label: string; preview: string }[] = [
  { level: 1, label: '极小', preview: 'xs' },
  { level: 2, label: '偏小', preview: 'sm' },
  { level: 3, label: '适中', preview: 'base' },
  { level: 4, label: '偏大', preview: 'lg' },
  { level: 5, label: '极大', preview: 'xl' },
];

const THEMES: { mode: ThemeMode; label: string; icon: React.ReactNode; color: string }[] = [
  { mode: 'light', label: '纯白', icon: <HiOutlineSun className="w-4 h-4" />, color: 'bg-white border-gray-200' },
  { mode: 'green', label: '浅绿', icon: <span className="w-4 h-4 rounded-full bg-green-200" />, color: 'bg-green-100 border-green-300' },
  { mode: 'gray', label: '浅灰', icon: <span className="w-4 h-4 rounded-full bg-gray-200" />, color: 'bg-gray-100 border-gray-300' },
  { mode: 'dark', label: '深色', icon: <HiOutlineMoon className="w-4 h-4" />, color: 'bg-gray-800 border-gray-600' },
];

const MASCOTS = [
  { id: 'default', name: '小猫咪', emoji: '🐱' },
  { id: 'panda', name: '大熊猫', emoji: '🐼' },
  { id: 'fox', name: '小狐狸', emoji: '🦊' },
  { id: 'rabbit', name: '小兔子', emoji: '🐰' },
  { id: 'bear', name: '小熊', emoji: '🐻' },
  { id: 'dog', name: '小狗', emoji: '🐶' },
];

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const {
    fontSizeLevel, setFontSize,
    themeMode, setThemeMode,
    isMuted, toggleMute,
    mascotId, setMascot,
    accent, setAccentPreference,
  } = useSettingsStore();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    window.print(); // 浏览器打印支持"另存为PDF"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <HiOutlineAdjustmentsHorizontal className="w-5 h-5 text-[#FF6B6B]" />
            <h2 className="font-extrabold text-gray-800">设置</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* 字体大小 */}
          <Section title="字体大小">
            <div className="flex gap-2">
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs.level}
                  onClick={() => setFontSize(fs.level)}
                  className={`flex-1 py-2 rounded-lg text-center transition-all ${
                    fontSizeLevel === fs.level
                      ? 'bg-[#FF6B6B] text-white shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className={`font-bold ${
                    fs.level === 1 ? 'text-xs' : fs.level === 2 ? 'text-sm' : fs.level === 3 ? 'text-base' : fs.level === 4 ? 'text-lg' : 'text-xl'
                  }`}>A</div>
                  <div className="text-[10px] mt-0.5">{fs.label}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* 主题背景 */}
          <Section title="护眼背景">
            <div className="flex gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.mode}
                  onClick={() => setThemeMode(theme.mode)}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                    themeMode === theme.mode
                      ? 'border-[#FF6B6B] ring-2 ring-[#FF6B6B]/20'
                      : 'border-gray-100 hover:border-gray-200'
                  } ${theme.color}`}
                >
                  {theme.icon}
                  <span className={`text-[10px] ${theme.mode === 'dark' ? 'text-white' : 'text-gray-600'}`}>
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* 发音设置 */}
          <Section title="发音设置">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiOutlineSpeakerWave className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">全局静音</span>
              </div>
              <button
                onClick={toggleMute}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isMuted ? 'bg-gray-300' : 'bg-[#4ECDC4]'
                }`}
              >
                <div className={`absolute w-5 h-5 bg-white rounded-full shadow top-0.5 transition-transform ${
                  isMuted ? 'left-0.5' : 'left-[26px]'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-gray-600">发音偏好</span>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setAccentPreference('US')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    accent === 'US' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  美式 🇺🇸
                </button>
                <button
                  onClick={() => setAccentPreference('UK')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    accent === 'UK' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  英式 🇬🇧
                </button>
              </div>
            </div>
          </Section>

          {/* 卡通形象 */}
          <Section title="卡通形象">
            <div className="grid grid-cols-6 gap-2">
              {MASCOTS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMascot(m.id)}
                  className={`p-2 rounded-xl text-center transition-all ${
                    mascotId === m.id
                      ? 'bg-[#FFF0F0] ring-2 ring-[#FF6B6B]'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="text-2xl">{m.emoji}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 truncate">{m.name}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* 打印/导出 */}
          <Section title="打印与导出">
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <HiOutlinePrinter className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600 font-bold">网页打印</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <HiOutlineArrowDownTray className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600 font-bold">导出 PDF</span>
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}
