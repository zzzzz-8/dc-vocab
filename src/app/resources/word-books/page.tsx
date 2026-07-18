'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineBookOpen, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { useUserStore, useLearningStore, useToastStore } from '@/lib/store';

const levelOrder = ['小学', '初中', '高中', '四级', '六级', '考研', '雅思', '托福', 'GRE'];

function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    '小学': 'bg-green-100 text-green-700 border-green-200',
    '初中': 'bg-blue-100 text-blue-700 border-blue-200',
    '高中': 'bg-purple-100 text-purple-700 border-purple-200',
    '四级': 'bg-orange-100 text-orange-700 border-orange-200',
    '六级': 'bg-red-100 text-red-700 border-red-200',
    '考研': 'bg-pink-100 text-pink-700 border-pink-200',
    '雅思': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    '托福': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'GRE': 'bg-teal-100 text-teal-700 border-teal-200',
  };
  return colors[level] || 'bg-gray-100 text-gray-700 border-gray-200';
}

function getLevelEmoji(level: string): string {
  const emojis: Record<string, string> = {
    '小学': '🎒', '初中': '📚', '高中': '🏫', '四级': '🎓', '六级': '🎯',
    '考研': '💪', '雅思': '🌍', '托福': '🇺🇸', 'GRE': '🏆',
  };
  return emojis[level] || '📖';
}

export default function WordBooksPage() {
  const { isLoggedIn } = useUserStore();
  const { setCurrentWordBook } = useLearningStore();
  const { addToast } = useToastStore();
  const router = useRouter();
  const [wordBooks, setWordBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return; }
    fetchWordBooks();
  }, [isLoggedIn]);

  const fetchWordBooks = async () => {
    try {
      const res = await fetch('/api/resources/word-books');
      const data = await res.json();
      if (data.success) setWordBooks(data.data);
    } catch {}
    setLoading(false);
  };

  const filtered = wordBooks.filter(book => {
    if (levelFilter !== 'all' && book.level !== levelFilter) return false;
    if (search && !book.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (a.level !== b.level) return levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
    return a.name.localeCompare(b.name);
  });

  const startLearning = (book: any) => {
    setCurrentWordBook(book.id, book.name);
    // Subscribe if not already
    fetch('/api/learn/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordBookId: book.id }),
    });
    addToast(`开始学习 "${book.name}"`, 'success');
    router.push('/learn/new-words');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineBookOpen className="w-5 h-5 text-[#6C5CE7]" />
        <h2 className="text-lg font-extrabold text-gray-800">词书库</h2>
      </div>

      {/* Search */}
      <div className="relative">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜索词书..." className="input-field pl-10 text-sm" />
      </div>

      {/* Level Filters */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setLevelFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-bold ${levelFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
          全部
        </button>
        {levelOrder.map(level => (
          <button key={level} onClick={() => setLevelFilter(level)}
            className={`px-3 py-1 rounded-full text-xs font-bold ${levelFilter === level ? getLevelColor(level) : 'bg-gray-100 text-gray-600'}`}>
            {level}
          </button>
        ))}
      </div>

      {/* Word Books Grid */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-10 h-10 border-4 border-[#6C5CE7]/30 border-t-[#6C5CE7] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">暂无词书</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((book) => (
            <div key={book.id} className="card p-4 hover:shadow-lg transition-all group">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-2xl">{getLevelEmoji(book.level)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-sm truncate">{book.name}</h3>
                  <span className={`level-tag text-[10px] ${getLevelColor(book.level)}`}>{book.level}</span>
                </div>
              </div>
              {book.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{book.description}</p>
              )}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-400">{book.wordCount || 0} 单词</span>
              </div>
              <div className="book-card-progress mb-3">
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#6C5CE7] to-[#A29BFE] h-full rounded-full transition-all duration-500"
                    style={{ width: `${book.progress || 0}%` }} />
                </div>
                {book.progress > 0 && (
                  <span className="text-[10px] text-gray-400 mt-0.5 block">{book.progress}%</span>
                )}
              </div>
              <button onClick={() => startLearning(book)}
                className="w-full py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-[#6C5CE7] to-[#A29BFE] text-white hover:shadow-md transition-all">
                {book.progress > 0 ? '继续学习' : '开始学习'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
