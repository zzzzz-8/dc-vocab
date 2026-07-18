'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineChartBar, HiOutlineArrowDownTray, HiOutlineCalendarDays } from 'react-icons/hi2';
import { useUserStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

export default function ReportsPage() {
  const { isLoggedIn } = useUserStore();
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return; }
    fetchData();
  }, [isLoggedIn, days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, dailyRes] = await Promise.all([
        fetch('/api/reports/summary'),
        fetch(`/api/reports/daily?days=${days}`),
      ]);
      const s = await summaryRes.json();
      const d = await dailyRes.json();
      if (s.success) setSummary(s.data);
      if (d.success) setDailyStats(d.data);
    } catch {}
    setLoading(false);
  };

  const exportReport = () => {
    window.open('/api/reports/export', '_blank');
  };

  // Prepare chart data
  const lineData = dailyStats.map(d => ({
    date: d.date.slice(5),
    '新词': d.newWords,
    '复习': d.reviewedWords,
    '学习时长': d.studyMinutes,
  }));

  const accuracyData = dailyStats.map(d => ({
    date: d.date.slice(5),
    '正确率': d.totalWords > 0 ? Math.round((1 - d.errorWords / d.totalWords) * 100) : 0,
  }));

  // Stage distribution pie (6-stage)
  const stageLabels = ['遗忘','一阶','二阶','三阶','四阶','五阶','六阶','掌握'];
  const stageColors = ['#FF6B6B','#FF8E8E','#FDCB6E','#FFE66D','#4ECDC4','#55EFC4','#A29BFE','#00B894'];
  const stageData = summary?.stageDistribution?.map((s: any) => ({
    name: stageLabels[s.stage] || s.stage,
    value: s.count || s._count || 0,
    color: stageColors[s.stage] || '#B2BEC3',
  })) || [];

  // 计算遗忘词汇
  const forgottenWords = summary?.totalErrors ?? 0;

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#FDCB6E]/30 border-t-[#FDCB6E] rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
          <HiOutlineChartBar className="w-5 h-5 text-[#FDCB6E]" />
          学习报告
        </h2>
        <button onClick={exportReport} className="flex items-center gap-1 text-xs font-bold text-[#FDCB6E] hover:underline">
          <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
          导出CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card p-4 text-center">
          <div className="text-2xl font-extrabold text-[#FF6B6B]">{summary?.totalLearned || 0}</div>
          <div className="text-xs text-gray-500">累计新词</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-extrabold text-[#00B894]">{summary?.totalMastered || 0}</div>
          <div className="text-xs text-gray-500">已掌握</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-extrabold text-[#A29BFE]">{summary?.masteryRate || 0}%</div>
          <div className="text-xs text-gray-500">掌握率</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-extrabold text-[#FDCB6E]">{Math.floor((summary?.totalMinutes || 0) / 60)}h</div>
          <div className="text-xs text-gray-500">学习时长</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-extrabold text-[#FF6B6B]">{forgottenWords}</div>
          <div className="text-xs text-gray-500">遗忘词汇</div>
        </div>
      </div>

      {/* Today's stats */}
      {summary?.todayStats && (
        <div className="card p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-2 flex items-center gap-1">
            <HiOutlineCalendarDays className="w-4 h-4 text-[#FDCB6E]" />
            今日学习
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-[#FF6B6B]">{summary.todayStats.newWords}</div>
              <div className="text-[10px] text-gray-500">新词</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[#4ECDC4]">{summary.todayStats.reviewedWords}</div>
              <div className="text-[10px] text-gray-500">复习</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[#A29BFE]">{summary.todayStats.studyMinutes}</div>
              <div className="text-[10px] text-gray-500">分钟</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[#FDCB6E]">
                {summary.todayStats.totalWords > 0
                  ? Math.round((1 - summary.todayStats.errorWords / summary.todayStats.totalWords) * 100) + '%'
                  : '0%'}
              </div>
              <div className="text-[10px] text-gray-500">正确率</div>
            </div>
          </div>
        </div>
      )}

      {/* Day filter */}
      <div className="flex gap-2">
        {[7, 14, 30].map(d => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-3 py-1 rounded-full text-xs font-bold ${days === d ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
            近{d}天
          </button>
        ))}
      </div>

      {/* Learning Trend */}
      <div className="card p-4">
        <h3 className="font-bold text-sm text-gray-700 mb-3">学习趋势</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0E6E0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#B2BEC3" />
            <YAxis tick={{ fontSize: 10 }} stroke="#B2BEC3" />
            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Line type="monotone" dataKey="新词" stroke="#FF6B6B" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="复习" stroke="#4ECDC4" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="学习时长" stroke="#A29BFE" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Accuracy Trend */}
      <div className="card p-4">
        <h3 className="font-bold text-sm text-gray-700 mb-3">正确率趋势</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={accuracyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0E6E0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#B2BEC3" />
            <YAxis tick={{ fontSize: 10 }} stroke="#B2BEC3" domain={[0, 100]} />
            <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
            <Bar dataKey="正确率" fill="#4ECDC4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="复习率" fill="#FFE66D" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stage Distribution */}
      {stageData.length > 0 && (
        <div className="card p-4">
          <h3 className="font-bold text-sm text-gray-700 mb-3">记忆阶段分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stageData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {stageData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mastery Level */}
      {summary && (
        <div className="card p-4">
          <h3 className="font-bold text-sm text-gray-700 mb-2">总体掌握情况</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-12">已掌握</span>
              <div className="progress-track flex-1">
                <div className="progress-fill" style={{ width: `${summary.masteryRate}%` }} />
              </div>
              <span className="text-xs font-bold text-[#00B894]">{summary.masteryRate}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-12">学习中</span>
              <div className="progress-track flex-1">
                <div className="h-full rounded-full bg-[#FF6B6B] transition-all" style={{ width: `${100 - summary.masteryRate}%` }} />
              </div>
              <span className="text-xs font-bold text-[#FF6B6B]">{100 - summary.masteryRate}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
