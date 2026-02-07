'use client';

import { ReactNode, useState, useCallback, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import NodePalette from '@/components/sidebar/NodePalette';
import HistoryPanel from '@/components/sidebar/HistoryPanel';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      // Clamp between min and max
      setRightSidebarWidth(Math.max(200, Math.min(600, newWidth)));
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div className={`flex h-screen w-full flex-col bg-dark-bg overflow-hidden ${isResizing ? 'select-none' : ''}`}>
      <Header className="h-14 border-b border-dark-border" />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[280px] border-r border-dark-border bg-dark-surface overflow-y-auto">
          <NodePalette />
        </aside>
        <main className="flex-1 relative bg-dark-bg">
          {children}
        </main>
        {/* Resizable Right Sidebar */}
        <aside
          ref={resizeRef}
          style={{ width: rightSidebarWidth }}
          className="relative border-l border-dark-border bg-dark-surface overflow-y-auto"
        >
          {/* Resize Handle */}
          <div
            onMouseDown={startResizing}
            className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 transition-colors ${isResizing ? 'bg-wy-500' : 'bg-transparent hover:bg-wy-500/50'
              }`}
          />
          <HistoryPanel />
        </aside>
      </div>
    </div>
  );
}