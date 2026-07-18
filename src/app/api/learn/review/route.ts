import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { calculateNewStage, calculateNextReview, getReviewPriority, REVIEW_GROUP_LABELS } from '@/lib/ebbinghaus';

/**
 * GET /api/learn/review
 * 获取待复习单词列表
 * 支持参数: stage (按阶段筛选), dashboard (返回首页看板数据), limit
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stageFilter = searchParams.get('stage');
    const isDashboard = searchParams.get('dashboard') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const now = new Date();

    // 首页看板：返回各阶段待复习数量
    if (isDashboard) {
      const allDueRecords = await prisma.userWord.findMany({
        where: {
          userId: payload.userId,
          nextReviewAt: { lte: now },
          stage: { lt: 7 },
        },
        select: { stage: true },
      });

      // 按阶段分组统计
      const stageGroups: Record<number, number> = {};
      allDueRecords.forEach(r => {
        stageGroups[r.stage] = (stageGroups[r.stage] || 0) + 1;
      });

      const groupStats = REVIEW_GROUP_LABELS.map(g => ({
        key: g.key,
        label: g.label,
        stage: g.stage,
        color: g.color,
        count: stageGroups[g.stage] || 0,
      }));

      const totalDue = allDueRecords.length;
      const overdueCount = allDueRecords.filter(() => true).length; // all are due

      // 获取今日学习统计
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayStats = await prisma.dailyStats.findUnique({
        where: { userId_date: { userId: payload.userId, date: todayStart } },
      });

      return NextResponse.json({
        success: true,
        data: {
          totalDue,
          overdueCount,
          groups: groupStats,
          todayNew: todayStats?.newWords || 0,
          todayReview: todayStats?.reviewedWords || 0,
          todayTotal: todayStats?.totalWords || 0,
        },
      });
    }

    // 按阶段筛选复习
    const whereClause: any = {
      userId: payload.userId,
      nextReviewAt: { lte: now },
      stage: { lt: 7 },
    };
    if (stageFilter !== null && stageFilter !== '') {
      whereClause.stage = parseInt(stageFilter);
    }

    const records = await prisma.userWord.findMany({
      where: whereClause,
      include: { word: true },
      take: 50,
      orderBy: { nextReviewAt: 'asc' },
    });

    // 按优先级排序
    const sorted = records
      .map((r) => ({
        ...r,
        priority: getReviewPriority(r.stage, r.nextReviewAt, r.isInErrorBook, now),
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);

    return NextResponse.json({ success: true, data: sorted });
  } catch (error) {
    console.error('Error fetching review words:', error);
    return NextResponse.json({ success: false, error: '获取复习词失败' }, { status: 500 });
  }
}

/**
 * POST /api/learn/review
 * 提交复习结果（用于抗遗忘复习）
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { wordId, isCorrect, responseTime } = await request.json();

    // 获取当前学习记录
    const record = await prisma.userWord.findUnique({
      where: { userId_wordId: { userId: payload.userId, wordId } },
    });

    if (!record) {
      return NextResponse.json({ success: false, error: '学习记录不存在' }, { status: 404 });
    }

    // 6阶循环：正确前进一格，错误退回遗忘
    const newStage = calculateNewStage(record.stage, isCorrect);
    const nextReviewAt = calculateNextReview(newStage);
    const isMastered = newStage >= 7;

    // 更新学习记录
    await prisma.userWord.update({
      where: { id: record.id },
      data: {
        stage: newStage,
        nextReviewAt,
        reviewedCount: { increment: 1 },
        status: isMastered ? 'MASTERED' : isCorrect ? 'FAMILIAR' : 'FORGOTTEN',
        isInErrorBook: !isCorrect ? true : record.isInErrorBook,
        errorCount: !isCorrect ? { increment: 1 } : undefined,
        lastReviewAt: new Date(),
      },
    });

    // 记录复习明细
    await prisma.reviewRecord.create({
      data: {
        userId: payload.userId,
        wordId,
        stage: record.stage,
        isCorrect,
        responseTime: responseTime || null,
        reviewType: 'anti-forget',
      },
    });

    // 更新日统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.dailyStats.upsert({
      where: { userId_date: { userId: payload.userId, date: today } },
      update: {
        reviewedWords: { increment: 1 },
        totalWords: { increment: 1 },
        errorWords: !isCorrect ? { increment: 1 } : undefined,
      },
      create: {
        userId: payload.userId, date: today,
        reviewedWords: 1, totalWords: 1,
        errorWords: !isCorrect ? 1 : 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: { stage: newStage, nextReviewAt: nextReviewAt.toISOString(), isMastered, isCorrect },
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ success: false, error: '提交复习失败' }, { status: 500 });
  }
}
