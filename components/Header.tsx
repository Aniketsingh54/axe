'use client';

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header className={cn("bg-dark-surface", className)}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-dark-text">
          Weavy Clone
        </Link>
        <UserButton />
      </div>
    </header>
  );
}