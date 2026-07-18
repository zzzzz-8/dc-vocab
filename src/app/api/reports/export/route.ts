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

    const [stats, records, errors] = await Promise.all([
      prisma.dailyStats.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 30 }),
      prisma.userWord.findMany({
        where: { userId },
        include: { word: true },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
      prisma.userWord.findMany({
        where: { userId, isInErrorBook: true },
        include: { word: true },
        orderBy: { errorCount: 'desc' },
        take: 50,
      }),
    ]);

    // 生成CSV
    const headers = '日期,学习分钟,新词数,复习数\n';
    const rows = stats.map(s => {
      const dateStr = s.date instanceof Date ? s.date.toISOString().split('T')[0] : String(s.date);
      return `${dateStr},${s.studyMinutes},${s.newWords},${s.reviewedWords}`;
    }).join('\n');

    const csv = headers + rows;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=learning-report-${new Date().toISOString().split('T')[0]}.csv`,
      },
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json({ success: false, error: '导出报告失败' }, { status: 500 });
  }
}
