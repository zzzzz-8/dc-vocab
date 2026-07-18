import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "单词跳跳岛 - 艾宾浩斯21天抗遗忘记忆法",
  description: "单词跳跳岛 - 基于艾宾浩斯遗忘曲线的智能单词学习平台，前置检测、分组学习、九宫格循环记忆，涵盖中小学、四六级、考研、雅思托福等词库",
  keywords: "背单词,艾宾浩斯,英语学习,单词跳跳岛,四六级,考研英语,雅思,托福,词库",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#FFF8F0]">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
