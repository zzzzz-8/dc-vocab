'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HiOutlineBookOpen, HiOutlineAcademicCap, HiOutlinePencil,
  HiOutlineLightBulb, HiOutlineCog, HiOutlineBuildingLibrary,
  HiOutlineChartBar, HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlineXMark, HiOutlineUserGroup, HiOutlineSpeakerWave,
  HiOutlinePuzzlePiece, HiOutlineClipboardDocumentList,
  HiOutlineMagnifyingGlass, HiOutlineChartPie, HiOutlineChevronDown,
} from 'react-icons/hi2';
import { useSidebarStore } from '@/lib/store';

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  items: { label: string; href: string; icon: React.ReactNode; color: string }[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle, close } = useSidebarStore();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    '学习模块': true, '刷题模块': true, '词汇专项': true, '辅助工具': true, '资源库': true,
  });

  const navGroups: NavGroup[] = [
    {
      label: '学习模块',
      icon: <HiOutlineBookOpen className="w-5 h-5" />,
      items: [
        { label: '学新词', href: '/learn/new-words', icon: <HiOutlineBookOpen className="w-4 h-4" />, color: '#FF6B6B' },
        { label: '抗遗忘复习', href: '/learn/review', icon: <HiOutlineSpeakerWave className="w-4 h-4" />, color: '#4ECDC4' },
        { label: '循环记忆', href: '/learn/cycle', icon: <HiOutlinePuzzlePiece className="w-4 h-4" />, color: '#A29BFE' },
        { label: '已学词', href: '/learn/learned', icon: <HiOutlineClipboardDocumentList className="w-4 h-4" />, color: '#FDCB6E' },
      ],
    },
    {
      label: '刷题模块',
      icon: <HiOutlineAcademicCap className="w-5 h-5" />,
      items: [
        { label: '学阅读', href: '/practice/reading', icon: <HiOutlineBookOpen className="w-4 h-4" />, color: '#6C5CE7' },
        { label: '学时文', href: '/practice/articles', icon: <HiOutlineBuildingLibrary className="w-4 h-4" />, color: '#00B894' },
        { label: '学完形', href: '/practice/cloze', icon: <HiOutlinePencil className="w-4 h-4" />, color: '#E17055' },
        { label: '学语境', href: '/practice/context', icon: <HiOutlineUserGroup className="w-4 h-4" />, color: '#0984E3' },
        { label: '多选五', href: '/practice/multi-select', icon: <HiOutlineChartPie className="w-4 h-4" />, color: '#E84393' },
        { label: '学听力', href: '/practice/listening', icon: <HiOutlineSpeakerWave className="w-4 h-4" />, color: '#00CEC9' },
      ],
    },
    {
      label: '词汇专项',
      icon: <HiOutlineLightBulb className="w-5 h-5" />,
      items: [
        { label: '词根缀', href: '/vocabulary/roots', icon: <HiOutlineLightBulb className="w-4 h-4" />, color: '#6C5CE7' },
        { label: '单词环', href: '/vocabulary/word-rings', icon: <HiOutlinePuzzlePiece className="w-4 h-4" />, color: '#FD79A8' },
        { label: '练拼写', href: '/vocabulary/spelling', icon: <HiOutlinePencil className="w-4 h-4" />, color: '#00B894' },
        { label: '学语法', href: '/vocabulary/grammar', icon: <HiOutlineAcademicCap className="w-4 h-4" />, color: '#0984E3' },
        { label: '学音标', href: '/vocabulary/phonetics', icon: <HiOutlineSpeakerWave className="w-4 h-4" />, color: '#E17055' },
        { label: '学拼读', href: '/vocabulary/phonics', icon: <HiOutlineBookOpen className="w-4 h-4" />, color: '#A29BFE' },
      ],
    },
    {
      label: '辅助工具',
      icon: <HiOutlineCog className="w-5 h-5" />,
      items: [
        { label: '错词本', href: '/tools/error-book', icon: <HiOutlineClipboardDocumentList className="w-4 h-4" />, color: '#E17055' },
        { label: '作业单', href: '/tools/homework', icon: <HiOutlinePencil className="w-4 h-4" />, color: '#6C5CE7' },
        { label: '趣味学', href: '/tools/fun-learn', icon: <HiOutlinePuzzlePiece className="w-4 h-4" />, color: '#FDCB6E' },
        { label: '随机测', href: '/tools/random-test', icon: <HiOutlineChartPie className="w-4 h-4" />, color: '#00B894' },
        { label: '查词典', href: '/tools/dictionary', icon: <HiOutlineMagnifyingGlass className="w-4 h-4" />, color: '#0984E3' },
        { label: '测词量', href: '/tools/assessment', icon: <HiOutlineChartBar className="w-4 h-4" />, color: '#E84393' },
      ],
    },
    {
      label: '资源库',
      icon: <HiOutlineBuildingLibrary className="w-5 h-5" />,
      items: [
        { label: '词书库', href: '/resources/word-books', icon: <HiOutlineBookOpen className="w-4 h-4" />, color: '#6C5CE7' },
        { label: '课件库', href: '/resources/courseware', icon: <HiOutlineBuildingLibrary className="w-4 h-4" />, color: '#00B894' },
      ],
    },
  ];

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-[#F0E6E0] transition-all duration-300 flex flex-col
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-64'}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0E6E0]">
          <Link href="/" className="flex items-center gap-2.5" onClick={close}>
            <span className="text-2xl">📚</span>
            <span className="text-lg font-extrabold bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent">
              单词跳跳岛
            </span>
          </Link>
          <button onClick={toggle} className="lg:hidden p-1 hover:bg-gray-100 rounded-lg">
            <HiOutlineXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="text-[#FF6B6B]">{group.icon}</span>
                  {group.label}
                </span>
                <HiOutlineChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    expandedGroups[group.label] ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedGroups[group.label] && (
                <div className="ml-1 mt-0.5 space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={close}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-[#FFF0F0] text-[#FF6B6B] font-bold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        }`}
                      >
                        <span style={{ color: isActive ? '#FF6B6B' : item.color }}>{item.icon}</span>
                        <span>{item.label}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF6B6B]" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Report Link */}
        <div className="border-t border-[#F0E6E0] p-3">
          <Link
            href="/reports"
            onClick={close}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
              pathname === '/reports' ? 'bg-[#FFF0F0] text-[#FF6B6B] font-bold' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <HiOutlineChartBar className="w-5 h-5 text-[#FDCB6E]" />
            <span>学习报告</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
