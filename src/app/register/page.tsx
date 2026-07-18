'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToastStore } from '@/lib/store';
import Mascot from '@/components/common/Mascot';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToastStore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      addToast('请填写所有必填项', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      addToast('两次密码不一致', 'error');
      return;
    }
    if (password.length < 6) {
      addToast('密码至少6位', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('注册成功！请登录', 'success');
        router.push('/login');
      } else {
        addToast(data.error || '注册失败', 'error');
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
            <h2 className="text-xl font-extrabold text-gray-800">创建账号</h2>
            <p className="text-sm text-gray-500 mt-1">开启你的单词学习之旅</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">用户名</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="input-field" placeholder="请输入用户名" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">邮箱</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-field" placeholder="请输入邮箱" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">密码</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-field" placeholder="至少6位密码" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">确认密码</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field" placeholder="再次输入密码" />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center text-sm py-3">
              {loading ? '注册中...' : '注 册'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            已有账号？
            <Link href="/login" className="text-[#FF6B6B] font-bold hover:underline">立即登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
