'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore, useToastStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useUserStore();
  const { addToast } = useToastStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      addToast('请填写用户名和密码', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        addToast('登录成功！', 'success');
        router.push('/');
      } else {
        addToast(data.error || '登录失败', 'error');
      }
    } catch {
      addToast('网络错误，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <Mascot expression="happy" size="lg" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-800">单词跳跳岛 🏝️</h2>
            <p className="text-sm text-gray-500 mt-1">登录继续你的学习之旅</p>
            <p className="text-xs text-[#FF6B6B] font-bold mt-1">新用户注册即享1天免费试用</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="请输入密码"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center text-sm py-3"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            还没有账号？
            <Link href="/register" className="text-[#FF6B6B] font-bold hover:underline">
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
