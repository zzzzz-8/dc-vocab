import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { calculateNextReview } from '@/lib/ebbinghaus';

/**
 * GET /api/learn/new-words
 * 获取未学新词列表（用于前置检测页面）
 * 参数: wordBookId, count, page, pageSize
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const wordBookId = searchParams.get('wordBookId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    if (!wordBookId) {
      return NextResponse.json({ success: false, error: '请选择词书' }, { status: 400 });
    }

    // 获取已学的单词ID
    const learnedIds = await prisma.userWord.findMany({
      where: { userId: payload.userId },
      select: { wordId: true },
    });
    const learnedSet = new Set(learnedIds.map((r) => r.wordId));

    // 获取未学单词
    const totalCount = await prisma.word.count({
      where: {
        wordBookId,
        id: { notIn: Array.from(learnedSet) },
      },
    });

    const newWords = await prisma.word.findMany({
      where: {
        wordBookId,
        id: { notIn: Array.from(learnedSet) },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { frequency: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: newWords,
      total: totalCount,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching new words:', error);
    return NextResponse.json({ success: false, error: '获取新词失败' }, { status: 500 });
  }
}

/**
 * POST /api/learn/new-words
 * 记录学习结果
 *
 * action 说明:
 * - 'pretest_known': 前置检测中标记为认识，直接写入已学（stage=1 一阶）
 * - 'learn_correct': 学习中标记为掌握，提升等级
 * - 'learn_error': 学习中标记为不认识，退回遗忘(stage=0)，标记错词本
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { wordId, wordBookId, knownWords, action } = await request.json();

    // 前置检测 - 批量标记认识单词（直接写入已学，stage=1）
    if (action === 'pretest_known' && knownWords && Array.isArray(knownWords)) {
      const now = new Date();
      const records = [];
      for (const id of knownWords) {
        const existing = await prisma.userWord.findUnique({
          where: { userId_wordId: { userId: payload.userId, wordId: id } },
        });
        if (!existing) {
          const record = await prisma.userWord.create({
            data: {
              userId: payload.userId,
              wordId: id,
              wordBookId: wordBookId || undefined,
              stage: 1, // 直接标记为一阶
              nextReviewAt: calculateNextReview(1),
              reviewedCount: 0,
            },
          });
          records.push(record);

          // 更新日统计
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          await prisma.dailyStats.upsert({
            where: { userId_date: { userId: payload.userId, date: today } },
            update: { newWords: { increment: 1 }, totalWords: { increment: 1 } },
            create: { userId: payload.userId, date: today, newWords: 1, totalWords: 1 },
          });
        }
      }
      return NextResponse.json({ success: true, data: records });
    }

    if (!wordId) {
      return NextResponse.json({ success: false, error: '请提供单词ID' }, { status: 400 });
    }

    // 学习中标记为正确
    if (action === 'learn_correct') {
      let record = await prisma.userWord.findUnique({
        where: { userId_wordId: { userId: payload.userId, wordId } },
      });

      if (record) {
        // 已有记录，提升一级
        const newStage = Math.min(record.stage + 1, 7);
        record = await prisma.userWord.update({
          where: { id: record.id },
          data: {
            stage: newStage,
            nextReviewAt: calculateNextReview(newStage),
            reviewedCount: { increment: 1 },
            status: newStage >= 7 ? 'MASTERED' : 'LEARNING',
          },
        });
      } else {
        record = await prisma.userWord.create({
          data: {
            userId: payload.userId,
            wordId,
            wordBookId: wordBookId || undefined,
            stage: 1,
            nextReviewAt: calculateNextReview(1),
            reviewedCount: 0,
          },
        });
      }

      // 更新日统计
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await prisma.dailyStats.upsert({
        where: { userId_date: { userId: payload.userId, date: today } },
        update: { newWords: { increment: 1 }, totalWords: { increment: 1 } },
        create: { userId: payload.userId, date: today, newWords: 1, totalWords: 1 },
      });

      return NextResponse.json({ success: true, data: record });
    }

    // 学习中标记为不认识（错误）
    if (action === 'learn_error') {
      let record = await prisma.userWord.findUnique({
        where: { userId_wordId: { userId: payload.userId, wordId } },
      });

      if (record) {
        record = await prisma.userWord.update({
          where: { id: record.id },
          data: {
            stage: 0,
            nextReviewAt: new Date(),
            reviewedCount: { increment: 1 },
            errorCount: { increment: 1 },
            isInErrorBook: true,
            status: 'FORGOTTEN',
          },
        });
      } else {
        record = await prisma.userWord.create({
          data: {
            userId: payload.userId,
            wordId,
            wordBookId: wordBookId || undefined,
            stage: 0,
            nextReviewAt: new Date(),
            reviewedCount: 0,
            errorCount: 1,
            isInErrorBook: true,
            status: 'FORGOTTEN',
          },
        });
      }

      return NextResponse.json({ success: true, data: record });
    }

    return NextResponse.json({ success: false, error: '无效操作' }, { status: 400 });
  } catch (error) {
    console.error('Error in new-words API:', error);
    return NextResponse.json({ success: false, error: '操作失败' }, { status: 500 });
  }
}
