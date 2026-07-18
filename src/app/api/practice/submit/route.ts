import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { practiceType, wordId, articleId, questionId, question, userAnswer, correctAnswer, isCorrect, score, timeSpent } = await request.json();

    // 保存练习记录到 ReviewRecord
    const record = await prisma.reviewRecord.create({
      data: {
        userId: payload.userId,
        wordId: wordId || '',
        isCorrect: isCorrect || false,
        responseTime: timeSpent || null,
        reviewType: `practice_${practiceType || 'general'}`,
      },
    });

    // 如果是单词练习，更新 UserWord 状态
    if (wordId) {
      const existing = await prisma.userWord.findUnique({
        where: { userId_wordId: { userId: payload.userId, wordId } },
      });

      if (existing) {
        const newStage = isCorrect ? Math.min(existing.stage + 1, 7) : 0;
        await prisma.userWord.update({
          where: { id: existing.id },
          data: {
            stage: newStage,
            reviewedCount: { increment: 1 },
            isInErrorBook: !isCorrect ? true : existing.isInErrorBook,
            errorCount: !isCorrect ? { increment: 1 } : undefined,
            lastReviewAt: new Date(),
          },
        });
      }
    }

    // 更新日统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.dailyStats.upsert({
      where: { userId_date: { userId: payload.userId, date: today } },
      update: {
        totalWords: { increment: 1 },
        errorWords: !isCorrect ? { increment: 1 } : undefined,
      },
      create: {
        userId: payload.userId, date: today,
        totalWords: 1, errorWords: !isCorrect ? 1 : 0,
      },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error submitting practice:', error);
    return NextResponse.json({ success: false, error: '提交练习失败' }, { status: 500 });
  }
}
