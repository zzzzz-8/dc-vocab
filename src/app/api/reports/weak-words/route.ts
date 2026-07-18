import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    // 错误次数最多的单词（在错词本中errorCount最高的）
    const errorWords = await prisma.userWord.findMany({
      where: { userId: payload.userId, isInErrorBook: true, errorCount: { gt: 0 } },
      include: { word: true },
      orderBy: { errorCount: 'desc' },
      take: 20,
    });

    // 复习统计
    const reviewRecords = await prisma.reviewRecord.groupBy({
      by: ['wordId'],
      where: { userId: payload.userId },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        mostErrors: errorWords,
        reviewStats: reviewRecords,
      },
    });
  } catch (error) {
    console.error('Error fetching weak words:', error);
    return NextResponse.json({ success: false, error: '获取薄弱词汇失败' }, { status: 500 });
  }
}
