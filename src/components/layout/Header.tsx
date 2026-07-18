'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  HiOutlineBars3, HiOutlineUserCircle, HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark, HiOutlineAdjustmentsHorizontal,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';
import { useSidebarStore, useUserStore, useLearningStore, useSettingsStore } from '@/lib/store';
import { usePathname } from 'next/navigation';
import SettingsPanel from '@/components/common/SettingsPanel';

export default function Header() {
  const { toggle } = useSidebarStore();
  const { isLoggedIn, nickname, username, logout } = useUserStore();
  const { accent, setAccent } = useLearningStore();
  const { isMuted } = useSettingsStore();
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);

  const pageTitles: Record<string, string> = {
    '/': '首页',
    '/learn/new-words': '学新词',
    '/learn/review': '抗遗忘复习',
    '/learn/cycle': '循环记',
    '/learn/learned': '已学词',
    '/practice/reading': '学阅读',
    '/practice/articles': '学时文',
    '/practice/cloze': '学完形',
    '/practice/context': '学语境',
    '/practice/multi-select': '七选五',
    '/practice/listening': '学听力',
    '/vocabulary/roots': '词根缀',
    '/vocabulary/word-rings': '单词环',
    '/vocabulary/spelling': '练拼写',
    '/vocabulary/grammar': '学语法',
    '/vocabulary/phonetics': '学音标',
    '/vocabulary/phonics': '学拼读',
    '/tools/error-book': '错词本',
    '/tools/homework': '作业单',
    '/tools/fun-learn': '趣味学',
    '/tools/random-test': '随机测',
    '/tools/dictionary': '查词典',
    '/tools/assessment': '测词量',
    '/resources/word-books': '词书库',
    '/resources/courseware': '课件库',
    '/reports': '学习报告',
  };

  const title = pageTitles[pathname] || '单词跳跳岛';

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#F0E6E0]">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <HiOutlineBars3 className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-base font-bold text-gray-800 truncate">
              <span className="hidden sm:inline">单词跳跳岛</span>
              <span className="sm:hidden">{title}</span>
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 静音切换 */}
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('toggle-mute'))}
              className={`p-2 rounded-lg transition-colors ${
                isMuted ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title={isMuted ? '已静音' : '点击静音'}
            >
              {isMuted ? (
                <HiOutlineSpeakerXMark className="w-4 h-4" />
              ) : (
                <HiOutlineSpeakerWave className="w-4 h-4" />
              )}
            </button>

            {/* 发音切换 */}
            <button
              onClick={() => setAccent(accent === 'US' ? 'UK' : 'US')}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              {accent === 'US' ? '🇺🇸 美式' : '🇬🇧 英式'}
            </button>

            {/* 设置 */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              title="设置"
            >
              <HiOutlineAdjustmentsHorizontal className="w-4 h-4" />
            </button>

            {/* 用户信息 */}
            {isLoggedIn ? (
              <div className="flex items-center gap-1">
                <Link
                  href="/reports"
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white text-xs font-bold hover:shadow-md transition-shadow"
                >
                  {nickname || username}
                </Link>
                <button
                  onClick={logout}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="退出登录"
                >
                  <HiOutlineArrowRightOnRectangle className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white text-xs font-bold hover:shadow-md transition-shadow"
              >
                <HiOutlineUserCircle className="w-4 h-4" />
                登录
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 设置面板 */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
