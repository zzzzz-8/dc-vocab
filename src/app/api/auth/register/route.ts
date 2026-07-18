import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: '请填写用户名和密码' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: '密码至少6位' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, ...(email ? [{ email }] : [])] },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: '用户名或邮箱已存在' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email: email || null,
        password: hashedPassword,
        nickname: username,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
