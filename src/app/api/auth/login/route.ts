import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: '请填写用户名和密码' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ success: false, error: '用户名或密码错误' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ success: false, error: '用户名或密码错误' }, { status: 401 });
    }

    const token = generateToken({ userId: user.id, username: user.username });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar,
        token,
        isMember: user.membership !== 'FREE',
        memberExpiry: user.membershipExpiry?.toISOString() || null,
        credits: user.credits,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
