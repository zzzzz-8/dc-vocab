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

    const homeworks = await prisma.homeworkRecord.findMany({
      where: { userId: payload.userId },
      include: { word: true },
      orderBy: { assignedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: homeworks });
  } catch (error) {
    console.error('Error fetching homework:', error);
    return NextResponse.json({ success: false, error: '获取作业单失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { wordId, homeworkType, question, answer, userAnswer, isCorrect, score } = await request.json();

    const record = await prisma.homeworkRecord.create({
      data: {
        userId: payload.userId,
        wordId: wordId || null,
        homeworkType,
        question,
        answer,
        userAnswer: userAnswer || null,
        isCorrect: isCorrect ?? null,
        score: score || 0,
        completedAt: userAnswer ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error creating homework:', error);
    return NextResponse.json({ success: false, error: '创建作业失败' }, { status: 500 });
  }
}
