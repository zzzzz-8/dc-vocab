'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HiOutlineBookOpen, HiOutlineAcademicCap, HiOutlineLightBulb,
  HiOutlineCog, HiOutlineBuildingLibrary, HiOutlineChartBar,
  HiOutlineArrowPath, HiOutlineClock, HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';
import { useUserStore, useSettingsStore } from '@/lib/store';
import { REVIEW_INTERVALS } from '@/lib/ebbinghaus';
import Mascot from '@/components/common/Mascot';

const modules = [
  {
    title: '学新词',
    desc: '前置检测 · 分组学习',
    icon: <HiOutlineBookOpen className="w-7 h-7" />,
    href: '/learn/new-words',
    color: 'from-[#FF6B6B] to-[#FF8E8E]',
    bg: 'bg-[#FFF0F0]',
    highlight: true,
  },
  {
    title: '抗遗忘',
    desc: '艾宾浩斯定时复习',
    icon: <HiOutlineArrowPath className="w-7 h-7" />,
    href: '/learn/review',
    color: 'from-[#4ECDC4] to-[#55EFC4]',
    bg: 'bg-[#E8FFF8]',
  },
  {
    title: '循环记',
    desc: '九宫格循环记忆游戏',
    icon: <HiOutlineClock className="w-7 h-7" />,
    href: '/learn/cycle',
    color: 'from-[#A29BFE] to-[#6C5CE7]',
    bg: 'bg-[#F0EDFF]',
  },
  {
    title: '刷题提分',
    desc: '阅读·完形·听力·七选五',
    icon: <HiOutlineAcademicCap className="w-7 h-7" />,
    href: '/practice/reading',
    color: 'from-[#6C5CE7] to-[#A29BFE]',
    bg: 'bg-[#F0EDFF]',
  },
  {
    title: '词汇专项',
    desc: '词根缀·拼写·语法·音标',
    icon: <HiOutlineLightBulb className="w-7 h-7" />,
    href: '/vocabulary/roots',
    color: 'from-[#00B894] to-[#55EFC4]',
    bg: 'bg-[#E8FFF8]',
  },
  {
    title: '辅助工具',
    desc: '错词本·查词典·测词量',
    icon: <HiOutlineCog className="w-7 h-7" />,
    href: '/tools/error-book',
    color: 'from-[#FDCB6E] to-[#FFEAA7]',
    bg: 'bg-[#FFFBE8]',
  },
  {
    title: '资源库',
    desc: '词书库·题库·课件库',
    icon: <HiOutlineBuildingLibrary className="w-7 h-7" />,
    href: '/resources/word-books',
    color: 'from-[#0984E3] to-[#74B9FF]',
    bg: 'bg-[#E8F4FF]',
  },
  {
    title: '学习报告',
    desc: '学习数据·薄弱分析',
    icon: <HiOutlineChartBar className="w-7 h-7" />,
    href: '/reports',
    color: 'from-[#E84393] to-[#FD79A8]',
    bg: 'bg-[#FFE8F5]',
  },
];

const platformStats = [
  { label: '词书总量', value: '50+', color: '#FF6B6B' },
  { label: '单词总量', value: '50,000+', color: '#4ECDC4' },
  { label: '记忆方法', value: '21天', color: '#A29BFE', suffix: '抗遗忘' },
  { label: '覆盖难度', value: '12级', color: '#FDCB6E', suffix: '全学段' },
];

export default function HomePage() {
  const { isLoggedIn } = useUserStore();
  const [dashboard, setDashboard] = useState<any>(null);
  const [todaysStats, setTodaysStats] = useState<any>(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboard();
      fetchTodayStats();
    }
  }, [isLoggedIn]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/learn/review?dashboard=true');
      const data = await res.json();
      if (data.success) setDashboard(data.data);
    } catch {}
  };

  const fetchTodayStats = async () => {
    try {
      const res = await fetch('/api/reports/daily?days=1');
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setTodaysStats(data.data[0]);
      }
    } catch {}
  };

  return (
    <div className="space-y-5">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFE8E8] to-[#E8F8F5] p-6 md:p-10">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/80 rounded-full text-xs font-bold text-[#FF6B6B]">
                🎯 艾宾浩斯21天抗遗忘
              </span>
              <span className="px-3 py-1 bg-white/80 rounded-full text-xs font-bold text-[#4ECDC4]">
                🏝️ 单词跳跳岛
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-gray-800 mb-3">
              让背单词变得
              <span className="bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent"> 简单有趣</span>
            </h1>
            <p className="text-gray-600 text-sm md:text-base mb-4">
              前置检测 · 分组学习 · 九宫格循环 · 艾宾浩斯21天抗遗忘记忆系统
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/learn/new-words" className="btn-primary text-sm">
                <HiOutlineBookOpen className="w-4 h-4" />
                开始学习
              </Link>
              <Link href="/resources/word-books" className="btn-outline text-sm">
                选择词书
              </Link>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Mascot expression="celebrate" size="lg" />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B6B]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#4ECDC4]/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Stats 平台数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {platformStats.map((stat) => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="text-2xl md:text-3xl font-extrabold" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            {stat.suffix && <div className="text-[10px] text-gray-400">{stat.suffix}</div>}
          </div>
        ))}
      </div>

      {/* 今日学习看板（登录后显示） */}
      {isLoggedIn && (
        <div className="card p-5 bg-gradient-to-r from-[#FFF0F0] to-[#F0FFFE]">
          <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
            <HiOutlineChartBar className="w-4 h-4 text-[#FF6B6B]" />
            今日学习概览
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-extrabold text-[#FF6B6B]">
                {todaysStats?.newWords || 0}
              </div>
              <div className="text-xs text-gray-500">今日学新词</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-extrabold text-[#4ECDC4]">
                {dashboard?.totalDue || 0}
              </div>
              <div className="text-xs text-gray-500">待复习总量</div>
              {dashboard?.overdueCount > 0 && (
                <div className="text-[10px] text-red-500 mt-0.5">
                  {dashboard.overdueCount} 超期
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-xl font-extrabold text-[#A29BFE]">
                {todaysStats?.reviewedWords || 0}
              </div>
              <div className="text-xs text-gray-500">复习完成</div>
            </div>
          </div>

          {/* 遗忘词汇 */}
          {dashboard?.totalDue > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <HiOutlineExclamationCircle className="w-4 h-4 text-[#FF6B6B]" />
                <span className="text-xs text-gray-500">
                  超时未复习词汇已置顶推送，请优先完成复习
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 核心模块快捷入口 */}
      <div>
        <h3 className="font-bold text-gray-700 text-sm mb-3">核心功能</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {modules.slice(0, 4).map((mod) => (
            <Link key={mod.href} href={mod.href} className={`card card-hover p-4 group ${mod.highlight ? 'ring-2 ring-[#FF6B6B]/20' : ''}`}>
              <div className={`w-10 h-10 rounded-xl ${mod.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <span style={{ color: mod.color.split(' ')[0]?.replace('from-', '') }}>{mod.icon}</span>
              </div>
              <h3 className="font-bold text-gray-800 text-sm">{mod.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{mod.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* 全部模块 */}
      <div>
        <h3 className="font-bold text-gray-700 text-sm mb-3">全部功能</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {modules.map((mod) => (
            <Link key={mod.href} href={mod.href} className="card card-hover p-3 group">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${mod.bg} flex items-center justify-center`}>
                  <span className="text-sm" style={{ color: mod.color.split(' ')[0]?.replace('from-', '') }}>{mod.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-xs truncate">{mod.title}</h3>
                  <p className="text-[10px] text-gray-400 truncate">{mod.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 8档复习间隔说明 */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          🧠 艾宾浩斯8档复习间隔
        </h3>
        <div className="flex flex-wrap gap-2">
          {REVIEW_INTERVALS.map((interval, i) => {
            const colors = [
              'bg-red-100 text-red-700',
              'bg-orange-100 text-orange-700',
              'bg-yellow-100 text-yellow-700',
              'bg-green-100 text-green-700',
              'bg-teal-100 text-teal-700',
              'bg-blue-100 text-blue-700',
              'bg-indigo-100 text-indigo-700',
              'bg-purple-100 text-purple-700',
            ];
            return (
              <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-bold ${colors[i]}`}>
                {i === 0 ? '🎯 新学' : i === 7 ? '🏆 掌握' : `🔄 ${interval.label}`}
              </span>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          5级记忆机制：全新生词→弱记忆→中等记忆→牢固记忆→永久掌握，答错直接退回0级
        </p>
      </div>
    </div>
  );
}
