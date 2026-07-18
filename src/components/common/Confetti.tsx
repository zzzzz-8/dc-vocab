'use client';

import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  size: number;
  delay: number;
  rotation: number;
}

export default function Confetti({ active = false }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A29BFE', '#FDCB6E', '#00B894', '#E17055', '#74B9FF'];
    const newPieces: ConfettiPiece[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 0.5,
      rotation: Math.random() * 360,
    }));
    setPieces(newPieces);

    const timer = setTimeout(() => setPieces([]), 3500);
    return () => clearTimeout(timer);
  }, [active]);

  if (pieces.length === 0) return null;

  return (
    <div className="celebration-overlay">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
