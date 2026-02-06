'use client';

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Weavy Clone
        </Link>
        <UserButton />
      </div>
    </header>
  );
}