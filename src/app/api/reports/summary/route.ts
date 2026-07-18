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

    const userId = payload.userId;

    // 总学习统计
    const [totalLearned, totalMastered, totalErrors] = await Promise.all([
      prisma.userWord.count({ where: { userId } }),
      prisma.userWord.count({ where: { userId, stage: { gte: 7 } } }),
      prisma.userWord.count({ where: { userId, isInErrorBook: true } }),
    ]);

    // 阶段分布
    const stageDistribution = await prisma.userWord.groupBy({
      by: ['stage'],
      where: { userId },
      _count: true,
    });

    // 今日统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStats = await prisma.dailyStats.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    // 总体掌握率
    const totalRecords = await prisma.userWord.count({ where: { userId } });

    // 总学习时长
    const sessions = await prisma.learningSession.findMany({
      where: { userId },
      select: { duration: true },
    });
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalLearned,
        totalMastered,
        totalErrors,
        totalMinutes,
        masteryRate: totalRecords > 0 ? Math.round((totalMastered / totalRecords) * 100) : 0,
        todayStats: todayStats || {
          studyMinutes: 0, newWords: 0, reviewedWords: 0,
          totalWords: 0, errorWords: 0,
        },
        stageDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json({ success: false, error: '获取总结失败' }, { status: 500 });
  }
}
