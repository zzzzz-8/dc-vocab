'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  HiOutlineClipboardDocumentList, HiOutlineTrash, HiOutlineArrowPath,
  HiOutlinePuzzlePiece, HiOutlinePencilSquare, HiOutlinePrinter,
  HiOutlineArrowDownTray,
} from 'react-icons/hi2';
import { useUserStore, useToastStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import WordItem from '@/components/word/WordItem';
import Mascot from '@/components/common/Mascot';

export default function ErrorBookPage() {
  const { isLoggedIn } = useUserStore();
  const { addToast } = useToastStore();
  const router = useRouter();
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchErrors();
  }, [isLoggedIn, page]);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tools/error-book?page=${page}&pageSize=20`);
      const data = await res.json();
      if (data.success) {
        setErrors(data.data);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  };

  const removeError = async (wordId: number) => {
    try {
      await fetch('/api/tools/error-book', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId }),
      });
      setErrors(errors.filter(e => e.wordId !== wordId));
      setTotal(t => t - 1);
      addToast('已从错词本移除', 'success');
    } catch {}
  };

  const batchDelete = async () => {
    if (selectedIds.size === 0) return;
    let count = 0;
    for (const wordId of selectedIds) {
      try {
        await fetch('/api/tools/error-book', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wordId }),
        });
        count++;
      } catch {}
    }
    setSelectedIds(new Set());
    fetchErrors();
    addToast(`已移除 ${count} 个错词`, 'success');
  };

  const batchExport = () => {
    if (selectedIds.size === 0) return;
    const words = errors
      .filter(e => selectedIds.has(e.wordId))
      .map(e => `${e.word?.word}\t${e.word?.definition}\t${e.errorCount}次错误`);
    const text = `单词\t释义\t错误次数\n${words.join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `错词本_${formatDate(new Date())}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('导出成功', 'success');
  };

  const toggleSelect = (wordId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(wordId)) next.delete(wordId);
      else next.add(wordId);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
          <HiOutlineClipboardDocumentList className="w-5 h-5 text-[#E17055]" />
          错词本
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">共 {total} 个错词</span>
          <button onClick={() => window.print()} className="btn-outline text-xs px-2 py-1">
            <HiOutlinePrinter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
          <span className="text-xs font-bold text-red-700">已选 {selectedIds.size} 词</span>
          <button onClick={batchDelete} className="btn-outline text-xs border-red-200 text-red-500">
            <HiOutlineTrash className="w-3.5 h-3.5" />
            批量删除
          </button>
          <button onClick={batchExport} className="btn-outline text-xs">
            <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
            导出
          </button>
          <button onClick={() => {
            setSelectedIds(new Set(errors.map(e => e.wordId)));
          }} className="text-xs text-gray-500 ml-auto hover:underline">
            {selectedIds.size === errors.length ? '取消全选' : '全选'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-10 h-10 border-4 border-[#E17055]/30 border-t-[#E17055] rounded-full animate-spin" />
        </div>
      ) : errors.length === 0 ? (
        <div className="text-center py-16">
          <Mascot expression="happy" size="lg" />
          <h3 className="text-lg font-bold text-gray-700 mt-3">错词本为空 🎉</h3>
          <p className="text-gray-500 text-sm mt-1">继续保持，没有错词！</p>
        </div>
      ) : (
        <div className="space-y-1">
          {errors.map((err) => (
            <div key={err.id} className="flex items-start">
              <div className="pt-3 pl-1">
                <input
                  type="checkbox"
                  checked={selectedIds.has(err.wordId)}
                  onChange={() => toggleSelect(err.wordId)}
                  className="w-4 h-4 accent-[#E17055]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <WordItem
                  word={err.word}
                  mode="list"
                  showPhonetic={true}
                  actions={
                    <div className="flex items-center gap-2">
                      <div className="text-right text-xs">
                        <div className="font-bold text-[#E17055]">错 {err.errorCount} 次</div>
                        <div className="text-gray-400">{new Date(err.lastErrorAt).toLocaleDateString('zh-CN')}</div>
                      </div>
                      <button onClick={() => removeError(err.wordId)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <HiOutlineTrash className="w-4 h-4 text-gray-400 hover:text-[#E17055]" />
                      </button>
                    </div>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-1.5 rounded-lg bg-gray-100 text-sm disabled:opacity-30">上一页</button>
          <span className="text-sm py-1.5">{page}/{totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-1.5 rounded-lg bg-gray-100 text-sm disabled:opacity-30">下一页</button>
        </div>
      )}

      {/* 专项训练入口 */}
      {total > 0 && (
        <div className="card p-4 bg-gradient-to-r from-red-50 to-orange-50">
          <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <HiOutlineArrowPath className="w-4 h-4 text-[#E17055]" />
            错词专项训练
          </h3>
          <div className="flex gap-2">
            <button onClick={() => router.push('/learn/review')} className="flex-1 btn-secondary text-xs py-2.5">
              <HiOutlineArrowPath className="w-3.5 h-3.5" />
              抗遗忘复习
            </button>
            <button onClick={() => router.push('/learn/cycle')} className="flex-1 btn-secondary text-xs py-2.5">
              <HiOutlinePuzzlePiece className="w-3.5 h-3.5" />
              九宫格循环
            </button>
            <button onClick={() => router.push('/vocabulary/spelling')} className="flex-1 btn-secondary text-xs py-2.5">
              <HiOutlinePencilSquare className="w-3.5 h-3.5" />
              拼写专项
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
