import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/tools/error-book
 * 获取错词本列表（使用 UserWord.isInErrorBook 字段）
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const [errors, total] = await Promise.all([
      prisma.userWord.findMany({
        where: { userId: payload.userId, isInErrorBook: true },
        include: { word: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.userWord.count({ where: { userId: payload.userId, isInErrorBook: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: errors,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching error book:', error);
    return NextResponse.json({ success: false, error: '获取错词本失败' }, { status: 500 });
  }
}

/**
 * POST /api/tools/error-book
 * 添加单词到错词本 / 设置笔记
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { wordId, note } = await request.json();
    if (!wordId) {
      return NextResponse.json({ success: false, error: '请提供单词ID' }, { status: 400 });
    }

    const existing = await prisma.userWord.findUnique({
      where: { userId_wordId: { userId: payload.userId, wordId } },
    });

    if (existing) {
      await prisma.userWord.update({
        where: { id: existing.id },
        data: {
          isInErrorBook: true,
          errorCount: { increment: 1 },
          note: note !== undefined ? note : existing.note,
        },
      });
    } else {
      await prisma.userWord.create({
        data: {
          userId: payload.userId,
          wordId,
          stage: 0,
          nextReviewAt: new Date(),
          errorCount: 1,
          isInErrorBook: true,
          status: 'FORGOTTEN',
          note: note || null,
        },
      });
    }

    return NextResponse.json({ success: true, message: '已加入错词本' });
  } catch (error) {
    console.error('Error adding error word:', error);
    return NextResponse.json({ success: false, error: '操作失败' }, { status: 500 });
  }
}

/**
 * DELETE /api/tools/error-book
 * 从错词本移除
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { wordId } = await request.json();
    await prisma.userWord.updateMany({
      where: { userId: payload.userId, wordId },
      data: { isInErrorBook: false },
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('Error removing error word:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
