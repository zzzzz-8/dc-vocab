import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET: 获取会员信息
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { membership: true, membershipExpiry: true, credits: true },
    });

    const isMember = user?.membership !== 'FREE';
    const expiryDate = user?.membershipExpiry;
    const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;
    const isActiveMember = isMember && !isExpired;

    return NextResponse.json({
      success: true,
      data: {
        membership: user?.membership || 'FREE',
        isMember: isActiveMember,
        memberExpiry: expiryDate?.toISOString() || null,
        credits: user?.credits || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching membership:', error);
    return NextResponse.json({ success: false, error: '获取会员信息失败' }, { status: 500 });
  }
}

// POST: 激活会员（模拟支付成功）
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { plan } = await request.json();
    const durationDays = plan === 'year' ? 365 : plan === 'quarter' ? 90 : 30;
    let newMembership = 'PERSONAL';
    if (plan === 'coach') newMembership = 'COACH';
    if (plan === 'institution') newMembership = 'INSTITUTION';

    const memberExpiry = new Date();
    memberExpiry.setDate(memberExpiry.getDate() + durationDays);

    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        membership: newMembership as any,
        membershipExpiry: memberExpiry,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        isMember: true,
        membership: newMembership,
        memberExpiry: memberExpiry.toISOString(),
        message: `会员已激活，有效期至 ${memberExpiry.toLocaleDateString('zh-CN')}`,
      },
    });
  } catch (error) {
    console.error('Error activating membership:', error);
    return NextResponse.json({ success: false, error: '激活会员失败' }, { status: 500 });
  }
}
