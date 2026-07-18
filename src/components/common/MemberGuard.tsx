'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/lib/store';
import { HiOutlineLockClosed, HiOutlineCrown } from 'react-icons/hi2';
import Mascot from './Mascot';

interface MemberGuardProps {
  /** 需要会员才能访问的内容 */
  children: React.ReactNode;
  /** 会员专属标识 */
  featureName?: string;
}

/**
 * 会员权限控制组件
 * 非会员且试用期已过，显示升级提示
 * 试用期内或会员，正常显示内容
 */
export default function MemberGuard({ children, featureName = '此功能' }: MemberGuardProps) {
  const { isLoggedIn, isMember, trialStartAt } = useUserStore();
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    if (isMember) {
      setShowUpgrade(false);
      return;
    }

    // 检查试用期（1天）
    if (trialStartAt) {
      const trialStart = new Date(trialStartAt);
      const now = new Date();
      const daysSinceTrial = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceTrial >= 1) {
        setShowUpgrade(true);
      } else {
        setShowUpgrade(false);
      }
    } else {
      // 没有试用记录，认为是新用户，允许试用
      setShowUpgrade(false);
    }
  }, [isLoggedIn, isMember, trialStartAt]);

  if (!isLoggedIn) {
    // 未登录可浏览但引导登录
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px] rounded-xl">
          <div className="text-center p-6">
            <HiOutlineLockClosed className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-3">请登录后使用{featureName}</p>
            <a href="/login" className="btn-primary text-sm inline-flex">去登录</a>
          </div>
        </div>
      </div>
    );
  }

  if (showUpgrade) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[2px] rounded-xl">
          <div className="text-center p-6 bg-white rounded-2xl shadow-xl max-w-sm mx-4">
            <Mascot expression="thinking" size="md" />
            <h3 className="font-bold text-gray-800 mt-3 mb-1">
              <HiOutlineCrown className="w-5 h-5 text-[#FFD700] inline-block mr-1" />
              会员专属
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              免费试用已结束，开通会员解锁完整功能
            </p>
            <div className="space-y-2">
              <button className="btn-primary w-full justify-center text-sm py-2.5">
                <HiOutlineCrown className="w-4 h-4" />
                开通会员 ¥19.9/月
              </button>
              <button className="btn-outline w-full text-xs py-2">
                游客模式（数据不保存）
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
