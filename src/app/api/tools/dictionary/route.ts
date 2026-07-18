import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');
    const page = parseInt(searchParams.get('page') || '1');

    if (!word) {
      return NextResponse.json({ success: false, error: '请输入要查询的单词' }, { status: 400 });
    }

    const [words, total] = await Promise.all([
      prisma.word.findMany({
        where: { word: { contains: word } },
        take: 20,
        skip: (page - 1) * 20,
        orderBy: { frequency: 'desc' },
      }),
      prisma.word.count({ where: { word: { contains: word } } }),
    ]);

    const exact = words.find((w) => w.word === word);

    return NextResponse.json({
      success: true,
      data: { words, exact: exact || words[0] || null, total },
    });
  } catch (error) {
    console.error('Error searching dictionary:', error);
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
  }
}
