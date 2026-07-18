import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 订阅词书
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { wordBookId } = await request.json();

    const existing = await prisma.userWordBook.findUnique({
      where: { userId_wordBookId: { userId: payload.userId, wordBookId } },
    });

    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const sub = await prisma.userWordBook.create({
      data: { userId: payload.userId, wordBookId },
    });

    return NextResponse.json({ success: true, data: sub });
  } catch (error) {
    console.error('Error subscribing:', error);
    return NextResponse.json({ success: false, error: '订阅词书失败' }, { status: 500 });
  }
}

// 获取已订阅词书
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const subs = await prisma.userWordBook.findMany({
      where: { userId: payload.userId, isActive: true },
      include: { wordBook: true },
    });

    return NextResponse.json({ success: true, data: subs });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ success: false, error: '获取订阅列表失败' }, { status: 500 });
  }
}
