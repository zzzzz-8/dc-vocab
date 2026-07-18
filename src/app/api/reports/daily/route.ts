import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const stats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);

      const dayStat = await prisma.dailyStats.findUnique({
        where: { userId_date: { userId: payload.userId, date: dayStart } },
      });

      // 获取当天的学习时长
      const sessions = await prisma.learningSession.findMany({
        where: {
          userId: payload.userId,
          startTime: { gte: dayStart, lt: new Date(dayStart.getTime() + 86400000) },
        },
      });
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

      stats.push({
        date: format(date, 'yyyy-MM-dd'),
        studyMinutes: totalMinutes || dayStat?.studyMinutes || 0,
        newWords: dayStat?.newWords || 0,
        reviewedWords: dayStat?.reviewedWords || 0,
        totalWords: dayStat?.totalWords || 0,
        errorWords: dayStat?.errorWords || 0,
      });
    }

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    return NextResponse.json({ success: false, error: '获取统计数据失败' }, { status: 500 });
  }
}
