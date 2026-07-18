import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { calculateNextReview } from '@/lib/ebbinghaus';

// 获取循环记忆数据
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const records = await prisma.userWord.findMany({
      where: { userId: payload.userId },
      include: { word: true },
      orderBy: { nextReviewAt: 'asc' },
    });

    // 按阶段分组（0-7）
    const stages: Record<number, any[]> = {};
    for (const r of records) {
      if (!stages[r.stage]) stages[r.stage] = [];
      stages[r.stage].push(r);
    }

    const total = records.length;
    const mastered = records.filter((r) => r.stage >= 7).length;
    const inProgress = total - mastered;

    return NextResponse.json({
      success: true,
      data: {
        total,
        mastered,
        inProgress,
        stages,
        records: records.slice(0, 200),
      },
    });
  } catch (error) {
    console.error('Error fetching cycle:', error);
    return NextResponse.json({ success: false, error: '获取数据失败' }, { status: 500 });
  }
}

// 提交循环记忆游戏结果
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { wordId, isCorrect, stage } = await request.json();

    // 获取当前学习记录
    const record = await prisma.userWord.findUnique({
      where: { userId_wordId: { userId: payload.userId, wordId } },
    });

    if (!record) {
      // 如果没有记录，创建一个
      const newStage = isCorrect ? Math.min(1, 7) : 0;
      const nextReviewAt = calculateNextReview(newStage);
      await prisma.userWord.create({
        data: {
          userId: payload.userId,
          wordId,
          stage: newStage,
          nextReviewAt,
          reviewedCount: 1,
          status: newStage >= 7 ? 'MASTERED' : newStage === 0 ? 'FORGOTTEN' : 'LEARNING',
          isInErrorBook: !isCorrect,
        },
      });

      // 记录复习
      await prisma.reviewRecord.create({
        data: {
          userId: payload.userId,
          wordId,
          stage: stage ?? 0,
          isCorrect,
          reviewType: 'cycle',
        },
      });

      return NextResponse.json({
        success: true,
        data: { stage: newStage, nextReviewAt: nextReviewAt.toISOString(), isMastered: newStage >= 7 },
      });
    }

    // 九宫格规则：
    // 正确：stage + 1（向外移动）
    // 错误：stage = 0（退回中心）
    const newStage = isCorrect ? Math.min(record.stage + 1, 7) : 0;
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

    // 记录复习
    await prisma.reviewRecord.create({
      data: {
        userId: payload.userId,
        wordId,
        stage: stage ?? record.stage,
        isCorrect,
        reviewType: 'cycle',
      },
    });

    return NextResponse.json({
      success: true,
      data: { stage: newStage, nextReviewAt: nextReviewAt.toISOString(), isMastered },
    });
  } catch (error) {
    console.error('Error in cycle game:', error);
    return NextResponse.json({ success: false, error: '提交失败' }, { status: 500 });
  }
}
