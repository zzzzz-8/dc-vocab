'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  HiOutlineClipboardDocumentList, HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlineFunnel, HiOutlineMagnifyingGlass, HiOutlineCheckCircle,
  HiOutlineXCircle, HiOutlinePrinter, HiOutlineArrowDownTray,
  HiOutlineArrowPath, HiOutlinePuzzlePiece, HiOutlinePencilSquare,
  HiOutlineClock,
} from 'react-icons/hi2';
import { useUserStore, useToastStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { getStageLabel, getStageColor } from '@/lib/ebbinghaus';
import WordItem from '@/components/word/WordItem';
import Mascot from '@/components/common/Mascot';

type SortMode = 'newest' | 'oldest' | 'alpha' | 'priority';
type FilterLevel = number | 'all';

const LEVEL_FILTERS = [
  { value: 'all' as const, label: '全部' },
  { value: 0, label: '0级·新生' },
  { value: 1, label: '1级·弱记' },
  { value: 2, label: '2级·中等' },
  { value: 3, label: '3级·中深' },
  { value: 4, label: '4级·牢固' },
  { value: 5, label: '5级·掌握' },
];

export default function LearnedPage() {
  const { isLoggedIn } = useUserStore();
  const { addToast } = useToastStore();
  const router = useRouter();

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailRecord, setShowDetailRecord] = useState<any>(null);

  const pageSize = 20;

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return; }
    fetchLearned();
  }, [isLoggedIn, page, filterLevel, sortMode]);

  const fetchLearned = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sort: sortMode,
      });
      if (filterLevel !== 'all') {
        params.set('stage', String(filterLevel));
      }
      const res = await fetch(`/api/learn/learned?${params}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  };

  // 搜索过滤（客户端）
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter((r) =>
      r.word?.word?.toLowerCase().includes(q) ||
      r.word?.definition?.toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  // 批量操作：加入错词本
  const batchAddToErrorBook = async () => {
    if (selectedIds.size === 0) return;
    let count = 0;
    for (const wordId of selectedIds) {
      try {
        await fetch('/api/tools/error-book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wordId }),
        });
        count++;
      } catch {}
    }
    addToast(`已将 ${count} 个单词加入错词本`, 'success');
    setSelectedIds(new Set());
  };

  // 批量操作：生成复习任务
  const batchCreateReview = () => {
    if (selectedIds.size === 0) return;
    addToast(`已为 ${selectedIds.size} 个单词生成复习任务`, 'success');
    router.push('/learn/review');
    setSelectedIds(new Set());
  };

  // 批量操作：导出
  const batchExport = () => {
    if (selectedIds.size === 0) return;
    const words = records
      .filter(r => selectedIds.has(r.id))
      .map(r => `${r.word?.word}\t${r.word?.definition}\t${getStageLabel(r.stage)}`);
    const text = `单词\t释义\t记忆等级\n${words.join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `已学词_${formatDate(new Date())}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('导出成功', 'success');
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map(r => r.id)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
          <HiOutlineClipboardDocumentList className="w-5 h-5 text-[#FDCB6E]" />
          已学词
        </h2>
        <span className="text-xs text-gray-400">共 {total} 词</span>
      </div>

      {/* 搜索 & 筛选 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索已学单词..."
            className="input-field pl-9 text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-[#FDCB6E] text-white' : 'bg-gray-100 text-gray-500'}`}
        >
          <HiOutlineFunnel className="w-4 h-4" />
        </button>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="card p-3 space-y-3">
          {/* 等级筛选 */}
          <div>
            <p className="text-xs text-gray-400 mb-2">记忆等级</p>
            <div className="flex flex-wrap gap-1.5">
              {LEVEL_FILTERS.map((f) => (
                <button
                  key={String(f.value)}
                  onClick={() => { setFilterLevel(f.value); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    filterLevel === f.value
                      ? 'bg-[#FDCB6E] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 排序 */}
          <div>
            <p className="text-xs text-gray-400 mb-2">排序</p>
            <div className="flex gap-2">
              {[
                { value: 'newest' as const, label: '最新学习' },
                { value: 'oldest' as const, label: '最早学习' },
                { value: 'alpha' as const, label: '字母 A-Z' },
                { value: 'priority' as const, label: '遗忘优先' },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSortMode(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sortMode === s.value
                      ? 'bg-[#FDCB6E] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-[#FFF8F0] rounded-xl border border-[#FFE0C0]">
          <span className="text-xs font-bold text-gray-600">已选 {selectedIds.size} 词</span>
          <button onClick={batchAddToErrorBook} className="btn-outline text-xs text-red-500 border-red-200">
            <HiOutlineXCircle className="w-3.5 h-3.5" />
            加入错词本
          </button>
          <button onClick={batchCreateReview} className="btn-outline text-xs">
            <HiOutlineArrowPath className="w-3.5 h-3.5" />
            生成复习
          </button>
          <button onClick={batchExport} className="btn-outline text-xs">
            <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
            导出
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 hover:text-gray-600 ml-auto">
            清除
          </button>
        </div>
      )}

      {/* 全选 */}
      <div className="flex items-center justify-between">
        <button onClick={selectAll} className="text-xs text-gray-500 hover:text-gray-700">
          {selectedIds.size === filteredRecords.length && filteredRecords.length > 0 ? '取消全选' : '全选'}
        </button>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-outline text-xs">
            <HiOutlinePrinter className="w-3.5 h-3.5" />
          </button>
          <button onClick={batchExport} className="btn-outline text-xs" title="导出为TXT">
            <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 单词列表 */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-10 h-10 border-4 border-[#FDCB6E]/30 border-t-[#FDCB6E] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRecords.map((record) => (
            <div key={record.id} className="relative">
              <div className="flex items-start">
                {/* 复选框 */}
                <div className="pt-3 pl-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(record.id)}
                    onChange={() => toggleSelect(record.id)}
                    className="w-4 h-4 accent-[#FDCB6E]"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <WordItem
                    word={record.word}
                    mode="list"
                    showPhonetic={true}
                    actions={
                      <div className="flex items-center gap-1 text-xs">
                        <span
                          className="px-2 py-0.5 rounded-full text-white font-bold"
                          style={{ backgroundColor: getStageColor(record.stage) }}
                        >
                          {getStageLabel(record.stage)}
                        </span>
                        <span className="text-gray-400">{record.reviewedCount}次</span>
                      </div>
                    }
                  />
                </div>
              </div>

              {/* 记忆轨迹明细 */}
              {showDetailRecord?.id === record.id && (
                <div className="mx-4 mb-2 p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                  <p><span className="text-gray-400">学习时间：</span>{formatDate(record.learnedAt, 'yyyy-MM-dd HH:mm')}</p>
                  <p><span className="text-gray-400">当前等级：</span>第 {record.stage} 级 ({getStageLabel(record.stage)})</p>
                  <p><span className="text-gray-400">复习次数：</span>{record.reviewedCount} 次</p>
                  <p><span className="text-gray-400">下次复习：</span>{formatDate(record.nextReviewAt, 'yyyy-MM-dd HH:mm')}</p>
                  {record.isMastered && <p className="text-green-600 font-bold">✅ 已掌握</p>}
                  {record.notes && <p><span className="text-gray-400">个人笔记：</span>{record.notes}</p>}
                  <button
                    onClick={() => {
                      addToast(`已为 "${record.word?.word}" 生成复习任务`, 'success');
                    }}
                    className="text-[#4ECDC4] hover:underline mt-1 inline-block"
                  >
                    生成复习任务 →
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredRecords.length === 0 && (
            <div className="text-center py-10 space-y-3">
              <Mascot expression="happy" size="md" />
              <p className="text-gray-400 text-sm">还没有学习任何单词</p>
              <button onClick={() => router.push('/learn/new-words')} className="btn-primary text-sm">
                去学新词
              </button>
            </div>
          )}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-gray-100 disabled:opacity-30">
            <HiOutlineChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">{page}/{totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-gray-100 disabled:opacity-30">
            <HiOutlineChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 快捷复习入口 */}
      {total > 0 && (
        <div className="flex gap-2">
          <button onClick={() => router.push('/learn/review')} className="flex-1 btn-secondary text-xs py-2.5">
            <HiOutlineArrowPath className="w-4 h-4" />
            抗遗忘复习
          </button>
          <button onClick={() => router.push('/learn/cycle')} className="flex-1 btn-secondary text-xs py-2.5">
            <HiOutlinePuzzlePiece className="w-4 h-4" />
            九宫格循环
          </button>
          <button onClick={() => router.push('/vocabulary/spelling')} className="flex-1 btn-secondary text-xs py-2.5">
            <HiOutlinePencilSquare className="w-4 h-4" />
            拼写专项
          </button>
        </div>
      )}
    </div>
  );
}
