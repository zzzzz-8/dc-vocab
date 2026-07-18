'use client';

import { useState } from 'react';
import { HiOutlineChartBar } from 'react-icons/hi2';
import { useUserStore, useToastStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';

const testWords = [
  { word: 'abandon', options: ['放弃', '接受', '到达', '出现'], answer: 0 },
  { word: 'brilliant', options: ['脆弱的', '明亮的', '勇敢的', '愚蠢的'], answer: 1 },
  { word: 'capable', options: ['有能力的', '资本', '首都', '捕获'], answer: 0 },
  { word: 'diverse', options: ['不同的', '相反的', '反转的', '内向的'], answer: 0 },
  { word: 'enormous', options: ['正常的', '巨大的', '兴奋的', '嫉妒的'], answer: 1 },
  { word: 'flexible', options: ['脆弱的', '灵活的', '反射的', '流动的'], answer: 1 },
  { word: 'generate', options: ['一般', '产生', '慷慨', '温和'], answer: 1 },
  { word: 'horizon', options: ['水平', '地平线', '恐怖', '荣誉'], answer: 1 },
  { word: 'illustrate', options: ['说明', '照明', '幻想', '生病'], answer: 0 },
  { word: 'justify', options: ['调整', '判断', '证明正确', '跳跃'], answer: 2 },
  { word: 'launch', options: ['午餐', '发射', '洗衣', '锁定'], answer: 1 },
  { word: 'magnificent', options: ['磁性的', '宏伟的', '必要的', '恶意的'], answer: 1 },
  { word: 'negotiate', options: ['否定', '协商', '忽视', '邻居'], answer: 1 },
  { word: 'obstacle', options: ['障碍', '坚持', '观察', '获得'], answer: 0 },
  { word: 'phenomenon', options: ['现象', '哲学', '音素', '偏见'], answer: 0 },
  { word: 'quantity', options: ['质量', '数量', '季度', '争吵'], answer: 1 },
  { word: 'significant', options: ['信号的', '重要的', '安静的', '签名'], answer: 1 },
  { word: 'technology', options: ['恐怖', '温度', '技术', '术语'], answer: 2 },
  { word: 'ultimately', options: ['最终的', '亲密的', '激进的', '超前的'], answer: 0 },
  { word: 'vulnerable', options: ['有价值的', '脆弱的', '可敬的', '自愿的'], answer: 1 },
];

export default function AssessmentPage() {
  const { isLoggedIn } = useUserStore();
  const { addToast } = useToastStore();
  const [started, setStarted] = useState(false);
  const [words] = useState(testWords.sort(() => Math.random() - 0.5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnswer = (idx: number) => {
    const newAnswers = [...answers, idx];
    setAnswers(newAnswers);

    if (currentIndex < words.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      // Calculate result
      const correct = newAnswers.filter((a, i) => a === words[i].answer).length;
      const score = Math.round(correct / words.length * 100);

      let level = 'A1';
      if (score >= 95) level = 'C2';
      else if (score >= 85) level = 'C1';
      else if (score >= 70) level = 'B2';
      else if (score >= 55) level = 'B1';
      else if (score >= 35) level = 'A2';

      const res = {
        totalWords: words.length,
        knownWords: correct,
        score,
        vocabularyLevel: level,
      };
      setResult(res);
      setCompleted(true);

      // Save
      fetch('/api/tools/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalWords: words.length,
          knownWords: correct,
          score,
          details: { byLevel: [], weakCategories: [] },
        }),
      });

      addToast(`测词完成！预估词汇量等级: ${level}`, 'success');
    }
  };

  if (!started) {
    return (
      <div className="text-center py-16 max-w-lg mx-auto">
        <HiOutlineChartBar className="w-12 h-12 text-[#E84393] mx-auto mb-4" />
        <h2 className="text-xl font-extrabold text-gray-800">测词量</h2>
        <p className="text-gray-500 text-sm mt-2">通过测试评估你的词汇量水平</p>
        <p className="text-gray-400 text-xs mt-1">共 {words.length} 道选择题</p>
        <button onClick={() => setStarted(true)} className="btn-primary mt-6 text-lg px-8 py-3">
          开始测试
        </button>
      </div>
    );
  }

  if (completed && result) {
    const levelColors: Record<string, string> = { A1: '#FF6B6B', A2: '#FF8E8E', B1: '#FDCB6E', B2: '#4ECDC4', C1: '#00B894', C2: '#6C5CE7' };
    const levelDescs: Record<string, string> = {
      A1: '入门级，能理解并使用日常用语',
      A2: '基础级，能进行简单的日常交流',
      B1: '中下级，能应对旅行和工作基本场景',
      B2: '中高级，能流利交流并理解复杂内容',
      C1: '高级，能自如运用语言进行学术/专业交流',
      C2: '精通级，接近母语水平',
    };

    return (
      <div className="max-w-lg mx-auto text-center space-y-4">
        <Mascot expression={result.score >= 70 ? 'celebrate' : 'happy'} size="lg" />
        <h2 className="text-xl font-extrabold text-gray-800">测试结果</h2>
        <div className="card p-6 space-y-3">
          <div className="text-5xl font-extrabold" style={{ color: levelColors[result.vocabularyLevel] || '#FF6B6B' }}>
            {result.vocabularyLevel}
          </div>
          <p className="text-sm text-gray-500">{levelDescs[result.vocabularyLevel] || ''}</p>
          <div className="flex justify-center gap-6">
            <div>
              <div className="text-2xl font-extrabold text-[#00B894]">{result.knownWords}</div>
              <div className="text-xs text-gray-500">认识</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-gray-800">{result.totalWords}</div>
              <div className="text-xs text-gray-500">总词</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#FF6B6B]">{result.score}%</div>
              <div className="text-xs text-gray-500">正确率</div>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${result.score}%` }} />
          </div>
        </div>
        <button onClick={() => { setStarted(false); setCurrentIndex(0); setAnswers([]); setCompleted(false); }}
          className="btn-primary text-sm">
          重新测试
        </button>
      </div>
    );
  }

  const q = words[currentIndex];
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <HiOutlineChartBar className="w-5 h-5 text-[#E84393]" />
        <h2 className="text-lg font-extrabold text-gray-800">测词量</h2>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>第 {currentIndex + 1}/{words.length} 题</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(currentIndex / words.length) * 100}%` }} />
      </div>
      <div className="card p-6">
        <p className="text-xl font-extrabold text-gray-800 text-center mb-6">{q.word}</p>
        <div className="space-y-2">
          {q.options.map((opt, idx) => (
            <button key={idx} onClick={() => handleAnswer(idx)}
              className="w-full p-3 rounded-xl text-sm font-medium text-left bg-gray-50 text-gray-600 border border-gray-100 hover:border-[#E84393]/30 hover:bg-[#E84393]/5 transition-all">
              {String.fromCharCode(65 + idx)}. {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
