'use client';

import { ReactNode } from 'react';
import { Header } from '@/components/Header';
import NodePalette from '@/components/sidebar/NodePalette';
import HistoryPanel from '@/components/sidebar/HistoryPanel';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col bg-dark-bg overflow-hidden">
      <Header className="h-14 border-b border-dark-border" />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[280px] border-r border-dark-border bg-dark-surface overflow-y-auto">
          <NodePalette />
        </aside>
        <main className="flex-1 relative bg-dark-bg">
          {children}
        </main>
        <aside className="w-[320px] border-l border-dark-border bg-dark-surface overflow-y-auto">
          <HistoryPanel />
        </aside>
      </div>
    </div>
  );
}