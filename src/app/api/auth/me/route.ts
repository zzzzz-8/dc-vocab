import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, username: true, nickname: true, email: true,
        avatar: true, phone: true, role: true, membership: true,
        membershipExpiry: true, credits: true, totalWords: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        membershipExpiry: user.membershipExpiry?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
