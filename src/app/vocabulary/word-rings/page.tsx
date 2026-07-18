'use client';

import { useState, useCallback } from 'react';
import { HiOutlinePuzzlePiece, HiOutlineShieldCheck } from 'react-icons/hi2';
import { speak } from '@/lib/voice';
import { useLearningStore } from '@/lib/store';

const wordRings = [
  { category: '颜色 Colors', emoji: '🎨', words: [
    { en: 'red', zh: '红色' }, { en: 'blue', zh: '蓝色' }, { en: 'green', zh: '绿色' },
    { en: 'yellow', zh: '黄色' }, { en: 'white', zh: '白色' }, { en: 'black', zh: '黑色' },
    { en: 'pink', zh: '粉色' }, { en: 'purple', zh: '紫色' }, { en: 'orange', zh: '橙色' }, { en: 'gray', zh: '灰色' },
  ]},
  { category: '数字 Numbers', emoji: '🔢', words: [
    { en: 'one', zh: '一' }, { en: 'two', zh: '二' }, { en: 'three', zh: '三' },
    { en: 'four', zh: '四' }, { en: 'five', zh: '五' }, { en: 'ten', zh: '十' },
    { en: 'hundred', zh: '百' }, { en: 'thousand', zh: '千' }, { en: 'million', zh: '百万' }, { en: 'billion', zh: '十亿' },
  ]},
  { category: '动物 Animals', emoji: '🐾', words: [
    { en: 'cat', zh: '猫' }, { en: 'dog', zh: '狗' }, { en: 'bird', zh: '鸟' },
    { en: 'fish', zh: '鱼' }, { en: 'lion', zh: '狮子' }, { en: 'tiger', zh: '老虎' },
    { en: 'elephant', zh: '大象' }, { en: 'monkey', zh: '猴子' }, { en: 'rabbit', zh: '兔子' }, { en: 'panda', zh: '熊猫' },
  ]},
  { category: '食物 Food', emoji: '🍎', words: [
    { en: 'apple', zh: '苹果' }, { en: 'bread', zh: '面包' }, { en: 'rice', zh: '米饭' },
    { en: 'meat', zh: '肉' }, { en: 'milk', zh: '牛奶' }, { en: 'water', zh: '水' },
    { en: 'fruit', zh: '水果' }, { en: 'vegetable', zh: '蔬菜' }, { en: 'chicken', zh: '鸡肉' }, { en: 'cake', zh: '蛋糕' },
  ]},
  { category: '身体 Body', emoji: '🧍', words: [
    { en: 'head', zh: '头' }, { en: 'hand', zh: '手' }, { en: 'eye', zh: '眼睛' },
    { en: 'ear', zh: '耳朵' }, { en: 'nose', zh: '鼻子' }, { en: 'mouth', zh: '嘴巴' },
    { en: 'arm', zh: '手臂' }, { en: 'leg', zh: '腿' }, { en: 'foot', zh: '脚' }, { en: 'hair', zh: '头发' },
  ]},
  { category: '学校 School', emoji: '🏫', words: [
    { en: 'book', zh: '书' }, { en: 'pen', zh: '笔' }, { en: 'desk', zh: '书桌' },
    { en: 'teacher', zh: '老师' }, { en: 'student', zh: '学生' }, { en: 'class', zh: '班级' },
    { en: 'lesson', zh: '课' }, { en: 'exam', zh: '考试' }, { en: 'homework', zh: '作业' }, { en: 'library', zh: '图书馆' },
  ]},
  { category: '天气 Weather', emoji: '🌤️', words: [
    { en: 'sunny', zh: '晴天' }, { en: 'rainy', zh: '下雨' }, { en: 'cloudy', zh: '多云' },
    { en: 'snowy', zh: '下雪' }, { en: 'windy', zh: '有风' }, { en: 'hot', zh: '热' },
    { en: 'cold', zh: '冷' }, { en: 'warm', zh: '温暖' }, { en: 'cool', zh: '凉爽' }, { en: 'storm', zh: '暴风雨' },
  ]},
  { category: '职业 Jobs', emoji: '💼', words: [
    { en: 'doctor', zh: '医生' }, { en: 'teacher', zh: '老师' }, { en: 'nurse', zh: '护士' },
    { en: 'driver', zh: '司机' }, { en: 'singer', zh: '歌手' }, { en: 'writer', zh: '作家' },
    { en: 'farmer', zh: '农民' }, { en: 'pilot', zh: '飞行员' }, { en: 'cook', zh: '厨师' }, { en: 'artist', zh: '艺术家' },
  ]},
];

export default function WordRingsPage() {
  const { accent } = useLearningStore();
  const [selectedRing, setSelectedRing] = useState<number | null>(null);
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());

  const toggleMastered = useCallback((key: string) => {
    setMasteredWords(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (selectedRing !== null) {
    const ring = wordRings[selectedRing];
    const masteredCount = ring.words.filter(w => masteredWords.has(`${selectedRing}-${w.en}`)).length;
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <button onClick={() => setSelectedRing(null)} className="text-sm text-[#FD79A8] font-bold hover:underline">← 返回</button>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-800">{ring.emoji} {ring.category}</h2>
          <span className="text-xs text-gray-400">已掌握 {masteredCount}/{ring.words.length}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(masteredCount / ring.words.length) * 100}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ring.words.map((w, i) => {
            const key = `${selectedRing}-${w.en}`;
            const isMastered = masteredWords.has(key);
            return (
              <div key={i} className={`card p-3 flex items-center gap-2 transition-all ${isMastered ? 'ring-1 ring-green-200 bg-green-50/30' : ''}`}>
                <button onClick={() => { speak(w.en, accent, 0.8, 1); }}
                  className="flex-1 text-left">
                  <span className={`font-bold ${isMastered ? 'text-green-700' : 'text-gray-800'}`}>{w.en}</span>
                  <span className="text-xs text-gray-500 ml-1">{w.zh}</span>
                </button>
                <button onClick={() => toggleMastered(key)}
                  className={`p-1 rounded ${isMastered ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}>
                  <HiOutlineShieldCheck className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlinePuzzlePiece className="w-5 h-5 text-[#FD79A8]" />
        <h2 className="text-lg font-extrabold text-gray-800">单词环</h2>
      </div>
      <p className="text-xs text-gray-500">按主题分类的单词环，方便集中记忆</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {wordRings.map((ring, i) => (
          <div key={i} onClick={() => setSelectedRing(i)}
            className="card p-4 cursor-pointer hover:shadow-lg transition-all text-center group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{ring.emoji}</div>
            <div className="text-sm font-bold text-gray-800">{ring.category}</div>
            <div className="text-xs text-gray-400 mt-1">{ring.words.length} 词</div>
          </div>
        ))}
      </div>
    </div>
  );
}
