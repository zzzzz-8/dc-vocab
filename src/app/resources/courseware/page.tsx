'use client';

import { useState, useEffect } from 'react';
import { HiOutlineBuildingLibrary, HiOutlineDocumentArrowDown, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { useUserStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';

interface CoursewareData {
  id: string;
  name: string;
  label: string;
  fileUrl: string;
  fileType: string;
  coverImage: string | null;
  userId: string;
  downloadCount: number;
  isFree: boolean;
  level: string | null;
  wordBookId: string | null;
  wordBook: { name: string } | null;
}

export default function CoursewarePage() {
  const { token } = useUserStore();
  const [coursewares, setCoursewares] = useState<CoursewareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCoursewares();
  }, [levelFilter]);

  const fetchCoursewares = async () => {
    setLoading(true);
    try {
      const params = levelFilter !== 'all' ? `?level=${levelFilter}` : '';
      const res = await fetch(`/api/resources/courseware${params}`);
      const data = await res.json();
      if (data.success) setCoursewares(data.data);
    } catch (err) {
      console.error('Failed to fetch courseware:', err);
    } finally {
      setLoading(false);
    }
  };

  const levels = ['all', '小学', '初中', '四级', '六级', '考研', '雅思', '托福', 'GRE'];

  const filtered = coursewares.filter(cw =>
    cw.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cw.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const typeIcons: Record<string, string> = { PDF: '📄', video: '🎬', audio: '🎵' };
  const typeColors: Record<string, string> = {
    PDF: 'bg-red-50 text-red-600',
    video: 'bg-blue-50 text-blue-600',
    audio: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineBuildingLibrary className="w-5 h-5 text-[#00B894]" />
        <h2 className="text-lg font-extrabold text-gray-800">课件库</h2>
      </div>

      <div className="flex gap-2 flex-wrap">
        {levels.map(l => (
          <button key={l} onClick={() => setLevelFilter(l)}
            className={`px-3 py-1 rounded-full text-xs font-bold ${levelFilter === l ? 'bg-[#00B894] text-white' : 'bg-gray-100 text-gray-600'}`}>
            {l === 'all' ? '全部' : l}
          </button>
        ))}
      </div>

      <div className="relative">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索课件..."
          className="input-field pl-9" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Mascot expression="thinking" size="md" />
          <p className="text-gray-400 text-sm mt-2">暂无课件</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((cw) => (
            <div key={cw.id} className="card p-4 hover:shadow-lg transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{typeIcons[cw.fileType] || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-sm truncate">{cw.name}</h3>
                  <div className="flex gap-1 items-center mt-0.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${typeColors[cw.fileType] || 'bg-gray-100 text-gray-600'}`}>
                      {cw.fileType.toUpperCase()}
                    </span>
                    {cw.level && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{cw.level}</span>
                    )}
                  </div>
                </div>
              </div>
              {cw.wordBook && (
                <p className="text-xs text-gray-400">关联词书: {cw.wordBook.name}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">分类: {cw.label}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-gray-400">{cw.downloadCount} 次下载</span>
                <button className="flex items-center gap-1 text-xs font-bold text-[#00B894] hover:underline">
                  <HiOutlineDocumentArrowDown className="w-3.5 h-3.5" />
                  下载
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
