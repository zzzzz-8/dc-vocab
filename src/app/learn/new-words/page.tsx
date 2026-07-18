'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  HiOutlineBookOpen, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineArrowRight, HiOutlineMagnifyingGlass,
  HiOutlineChevronLeft, HiOutlineCheck, HiOutlineXMark,
} from 'react-icons/hi2';
import { useUserStore, useLearningStore, useToastStore } from '@/lib/store';
import WordItem from '@/components/word/WordItem';
import Mascot from '@/components/common/Mascot';
import type { WordData, LearningSessionResult } from '@/types';

// 学习分组大小
const GROUP_SIZE = 10;

export default function NewWordsPage() {
  const { isLoggedIn, isMember, trialStartAt } = useUserStore();
  const { currentWordBookId, currentWordBookName, setCurrentWordBook } = useLearningStore();
  const { addToast } = useToastStore();
  const router = useRouter();

  // 页面阶段: selectBook | pretest | learning | complete
  const [phase, setPhase] = useState<'selectBook' | 'pretest' | 'learning' | 'complete'>('selectBook');
  const [wordBooks, setWordBooks] = useState<any[]>([]);
  const [allWords, setAllWords] = useState<WordData[]>([]);
  const [pretestMarks, setPretestMarks] = useState<Record<number, boolean | null>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuide, setShowGuide] = useState(true);
  const [currentGroup, setCurrentGroup] = useState(0);
  const [learningResults, setLearningResults] = useState<LearningSessionResult | null>(null);
  const [loading, setLoading] = useState(false);

  // 分组计算
  const unknownWords = useMemo(() => {
    return allWords.filter(w => pretestMarks[w.id] === false);
  }, [allWords, pretestMarks]);

  const knownWords = useMemo(() => {
    return allWords.filter(w => pretestMarks[w.id] === true);
  }, [allWords, pretestMarks]);

  const wordGroups = useMemo(() => {
    const groups: WordData[][] = [];
    for (let i = 0; i < unknownWords.length; i += GROUP_SIZE) {
      groups.push(unknownWords.slice(i, i + GROUP_SIZE));
    }
    return groups;
  }, [unknownWords]);

  const currentGroupWords = wordGroups[currentGroup] || [];

  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return allWords;
    const q = searchQuery.toLowerCase();
    return allWords.filter(w => w.word.toLowerCase().includes(q));
  }, [allWords, searchQuery]);

  // 统计
  const markedCount = Object.values(pretestMarks).filter(v => v !== null).length;
  const unknownCount = unknownWords.length;
  const knownCount = knownWords.length;

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return; }
    fetchWordBooks();
    if (currentWordBookId) {
      fetchAllWords(currentWordBookId);
    }
  }, [isLoggedIn]);

  const fetchWordBooks = async () => {
    try {
      const res = await fetch('/api/resources/word-books');
      const data = await res.json();
      if (data.success) setWordBooks(data.data);
    } catch {}
  };

  const fetchAllWords = async (bookId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resources/word-books/${bookId}/words?pageSize=999`);
      const data = await res.json();
      if (data.success) {
        setAllWords(data.data || []);
      }
    } catch {}
    setLoading(false);
  };

  const selectBook = (book: any) => {
    setCurrentWordBook(book.id, book.name);
    setPhase('pretest');
    fetchAllWords(book.id);
    // 首次进入显示引导
    const guideDismissed = localStorage.getItem('pretest-guide-dismissed');
    setShowGuide(!guideDismissed);
  };

  const markWord = (wordId: number, isKnown: boolean) => {
    setPretestMarks(prev => ({ ...prev, [wordId]: isKnown }));
  };

  const clearMarks = () => setPretestMarks({});
  const markAllKnown = () => {
    const marks: Record<number, boolean> = {};
    allWords.forEach(w => { marks[w.id] = true; });
    setPretestMarks(marks);
  };
  const markAllUnknown = () => {
    const marks: Record<number, boolean> = {};
    allWords.forEach(w => { marks[w.id] = false; });
    setPretestMarks(marks);
  };

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem('pretest-guide-dismissed', 'true');
  };

  // 开始识记: 将认识单词写入已学（level 1），不认识单词进入学习组
  const startLearning = async () => {
    if (unknownWords.length === 0) {
      addToast('请至少标记一个不认识的单词', 'warning');
      return;
    }

    // 将认识的单词直接写入已学（level 1）
    if (knownWords.length > 0) {
      try {
        await fetch('/api/learn/new-words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wordBookId: currentWordBookId,
            knownWords: knownWords.map(w => w.id),
            action: 'pretest_known',
          }),
        });
      } catch {}
    }

    setPhase('learning');
    setCurrentGroup(0);
  };

  // 学习组内操作
  const handleGroupResult = async (wordId: number, isCorrect: boolean) => {
    try {
      await fetch('/api/learn/new-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId,
          wordBookId: currentWordBookId,
          action: isCorrect ? 'learn_correct' : 'learn_error',
        }),
      });
    } catch {}
  };

  const nextGroup = () => {
    if (currentGroup < wordGroups.length - 1) {
      setCurrentGroup(currentGroup + 1);
    } else {
      // 学习完成
      setLearningResults({
        totalWords: unknownWords.length,
        learnedCount: unknownWords.length,
        masteredCount: currentGroup, // approximate
        errorCount: 0,
        accuracy: 0,
        duration: 0,
      });
      setPhase('complete');
      addToast('本组单词学习完成！🎉', 'success');
    }
  };

  // ==================== 选书页面 ====================
  if (phase === 'selectBook') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
            <HiOutlineBookOpen className="w-5 h-5 text-[#FF6B6B]" />
            学新词
          </h2>
        </div>
        <p className="text-sm text-gray-500">选择词书，开始您的前置检测学习</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {wordBooks.map((book) => (
            <div key={book.id} onClick={() => selectBook(book)}
              className="card p-4 cursor-pointer hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📖</span>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-sm">{book.name}</h3>
                  <span className="text-xs text-gray-400">{book.level}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{book.description || ''}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400">{book.wordCount} 词</span>
                {book.progress > 0 && (
                  <div className="progress-track flex-1">
                    <div className="progress-fill" style={{ width: `${book.progress}%` }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==================== 前置检测页面 ====================
  if (phase === 'pretest') {
    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => { setPhase('selectBook'); setPretestMarks({}); }}
              className="p-1.5 hover:bg-gray-100 rounded-lg">
              <HiOutlineChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <h2 className="text-lg font-extrabold text-gray-800">
              前置检测
            </h2>
          </div>
          <span className="text-xs text-gray-400">{currentWordBookName}</span>
        </div>

        {/* 搜索和快捷操作 */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索单词..."
              className="input-field pl-9 text-sm"
            />
          </div>
          <button onClick={markAllKnown} className="btn-outline text-xs px-2 py-2">
            <HiOutlineCheck className="w-3.5 h-3.5" />
            全认识
          </button>
          <button onClick={markAllUnknown} className="btn-outline text-xs px-2 py-2">
            <HiOutlineXMark className="w-3.5 h-3.5" />
            全不认识
          </button>
          <button onClick={clearMarks} className="btn-outline text-xs px-2 py-2">
            清除
          </button>
        </div>

        {/* 引导弹窗 */}
        {showGuide && (
          <div className="relative p-4 bg-gradient-to-r from-[#FFF0F0] to-[#FFF8F0] rounded-xl border border-[#FFE0E0]">
            <button onClick={dismissGuide} className="absolute top-2 right-2 p-1 hover:bg-black/5 rounded-full">
              <HiOutlineXMark className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex items-start gap-3">
              <Mascot expression="happy" size="sm" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-sm mb-1">温馨提示 💡</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  认识的单词点 <span className="text-blue-500 font-bold">✅ 对勾</span> 标记为掌握；
                  不熟悉的单词点 <span className="text-red-500 font-bold">❌ 叉号</span> 标记为生词。
                  点击底部「开始识记」后，仅把标记红叉的单词纳入本次学习组。
                </p>
                <p className="text-xs text-gray-400 mt-1">单击单词可听发音，双击查看完整释义。</p>
              </div>
            </div>
          </div>
        )}

        {/* 单词列表 */}
        <div className="card divide-y divide-gray-50 overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">加载中...</div>
          ) : filteredWords.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              {searchQuery ? '未找到匹配的单词' : '该词书暂无单词'}
            </div>
          ) : (
            filteredWords.map((word) => (
              <div key={word.id} className="flex items-center group">
                <div className="flex-1 min-w-0">
                  <WordItem
                    word={word}
                    mode="list"
                    showPhonetic={true}
                  />
                </div>
                {/* 操作按钮 */}
                <div className="flex items-center gap-1 pr-3 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); markWord(word.id, true); }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      pretestMarks[word.id] === true
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-300 hover:bg-blue-50 hover:text-blue-300'
                    }`}
                    title="认识"
                  >
                    <HiOutlineCheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); markWord(word.id, false); }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      pretestMarks[word.id] === false
                        ? 'bg-red-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-300 hover:bg-red-50 hover:text-red-300'
                    }`}
                    title="不认识"
                  >
                    <HiOutlineXCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部统计栏 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-3 flex items-center justify-between rounded-t-xl shadow-lg">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              已选择 <span className="font-bold text-gray-800">{markedCount}</span> 个单词
            </span>
            {knownCount > 0 && (
              <span className="text-blue-500">
                ✅ {knownCount} 认识
              </span>
            )}
            {unknownCount > 0 && (
              <span className="text-red-500">
                ❌ {unknownCount} 生词
              </span>
            )}
          </div>
          <button
            onClick={startLearning}
            disabled={unknownCount === 0}
            className={`btn-primary text-sm py-2.5 px-5 ${
              unknownCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {unknownCount > 0 ? `开始识记 (${unknownCount}词)` : '请标记生词'}
          </button>
        </div>
      </div>
    );
  }

  // ==================== 分组学习页面 ====================
  if (phase === 'learning') {
    if (currentGroupWords.length === 0 && currentGroup >= wordGroups.length) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Mascot expression="celebrate" size="lg" />
          <h2 className="text-xl font-extrabold text-gray-800">学习完成！🎉</h2>
          <button onClick={() => {
            setPhase('complete');
            setLearningResults({
              totalWords: unknownWords.length,
              learnedCount: unknownWords.length,
              masteredCount: unknownWords.length,
              errorCount: 0,
              accuracy: 100,
              duration: 0,
            });
          }} className="btn-primary text-sm">查看结果</button>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-w-2xl mx-auto">
        {/* 进度信息 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-800">分组学习</h2>
            <p className="text-xs text-gray-500">
              第 {currentGroup + 1}/{wordGroups.length} 组 · 本组 {currentGroupWords.length} 词
            </p>
          </div>
          <span className="text-xs text-gray-400">{currentWordBookName}</span>
        </div>

        {/* 全局进度条 */}
        <div className="progress-track">
          <div className="progress-fill" style={{
            width: `${((currentGroup * GROUP_SIZE) / unknownWords.length) * 100}%`
          }} />
        </div>

        {/* 本组单词列表 */}
        <div className="space-y-2">
          {currentGroupWords.map((word) => (
            <WordItem
              key={word.id}
              word={word}
              mode="card"
              showPhonetic={true}
              actions={
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGroupResult(word.id, true)}
                    className="w-10 h-10 rounded-full bg-green-50 text-green-500 hover:bg-green-100 flex items-center justify-center transition-all"
                    title="掌握"
                  >
                    <HiOutlineCheck className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleGroupResult(word.id, false)}
                    className="w-10 h-10 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all"
                    title="不认识"
                  >
                    <HiOutlineXMark className="w-5 h-5" />
                  </button>
                </div>
              }
            />
          ))}
        </div>

        {/* 批量操作及完成按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button className="btn-outline text-xs">批量导出</button>
            <button className="btn-outline text-xs">打印</button>
          </div>
          <button onClick={nextGroup} className="btn-primary text-sm py-2.5 px-6">
            {currentGroup < wordGroups.length - 1 ? (
              <>下一组 <HiOutlineArrowRight className="w-4 h-4" /></>
            ) : (
              '完成学习 🎉'
            )}
          </button>
        </div>
      </div>
    );
  }

  // ==================== 学习完成页 ====================
  if (phase === 'complete') {
    const total = unknownWords.length;
    const mastered = unknownWords.length; // approximate
    const rate = total > 0 ? Math.round((mastered / total) * 100) : 0;

    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <Mascot expression="celebrate" size="lg" />
        <h2 className="text-2xl font-extrabold text-gray-800">学习完成！🎉</h2>

        <div className="card p-6 w-full max-w-sm space-y-4">
          <div className="text-center">
            <div className="text-4xl font-extrabold text-[#FF6B6B]">{total}</div>
            <div className="text-xs text-gray-500">本次学习生词总数</div>
          </div>

          <div className="flex justify-around text-center">
            <div>
              <div className="text-xl font-bold text-[#4ECDC4]">{mastered}</div>
              <div className="text-xs text-gray-500">已掌握</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#FF6B6B]">{total - mastered}</div>
              <div className="text-xs text-gray-500">需巩固</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#A29BFE]">{rate}%</div>
              <div className="text-xs text-gray-500">掌握率</div>
            </div>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${rate}%` }} />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setPretestMarks({});
              setPhase('pretest');
              setCurrentGroup(0);
            }}
            className="btn-primary text-sm"
          >
            继续学新词
          </button>
          <button
            onClick={() => router.push('/learn/review')}
            className="btn-secondary text-sm"
          >
            <HiOutlineArrowRight className="w-4 h-4" />
            去复习
          </button>
          <button onClick={() => window.print()} className="btn-outline text-sm">
            打印结果
          </button>
        </div>
      </div>
    );
  }
}
