'use client';

import { ReactNode, useState, useCallback, useRef, useEffect } from 'react';
import NodePalette from '@/components/sidebar/NodePalette';
import HistoryPanel from '@/components/sidebar/HistoryPanel';
import { useStore } from '@/hooks/useStore';
import { Search, Boxes, ChevronRight, FileJson } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

type LeftPanelTab = 'quick' | 'workflows' | 'json';

export default function AppLayout({ children }: AppLayoutProps) {
  const [rightSidebarWidth, setRightSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [isCompactLeftPanel, setIsCompactLeftPanel] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<LeftPanelTab>('quick');
  const resizeRef = useRef<HTMLDivElement>(null);
  const workflowName = useStore((state) => state.workflowName);
  const setWorkflowName = useStore((state) => state.setWorkflowName);

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
      setRightSidebarWidth(Math.max(260, Math.min(420, newWidth)));
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
    <div className={`flex h-screen w-full bg-dark-bg overflow-hidden ${isResizing ? 'select-none' : ''}`}>
      <aside className="w-12 shrink-0 border-r border-dark-border/70 bg-[#1b1e26] flex flex-col items-center py-3 gap-2">
        <button
          onClick={() => setActiveLeftTab('quick')}
          className={`w-8 h-8 rounded-md grid place-items-center ${activeLeftTab === 'quick' ? 'bg-[#222631] text-white/90' : 'text-white/55 hover:text-white hover:bg-white/10'}`}
          title="Quick Access"
        >
          <Boxes className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveLeftTab('workflows')}
          className={`w-8 h-8 rounded-md grid place-items-center ${activeLeftTab === 'workflows' ? 'bg-[#dfe887] text-black' : 'text-white/55 hover:text-white hover:bg-white/10'}`}
          title="Workflows"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveLeftTab('json')}
          className={`w-8 h-8 rounded-md grid place-items-center ${activeLeftTab === 'json' ? 'bg-[#dfe887] text-black' : 'text-white/55 hover:text-white hover:bg-white/10'}`}
          title="JSON Tools"
        >
          <FileJson className="w-4 h-4" />
        </button>
      </aside>

      <div className="relative flex flex-1 overflow-hidden">
        <aside className={`${isCompactLeftPanel ? 'w-0' : 'w-[250px]'} transition-all duration-200 border-r border-dark-border bg-[#1e212a] overflow-hidden flex flex-col`}>
          <div className="h-14 px-4 border-b border-dark-border/80 flex items-center justify-between">
            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-[21px] font-medium tracking-tight text-white/95 outline-none border-0 placeholder:text-white/40"
              placeholder="untitled"
              aria-label="Workflow name"
            />
            <button
              onClick={() => setIsCompactLeftPanel(true)}
              className="text-white/45 hover:text-white transition-colors"
              title="Collapse panel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <NodePalette activeTab={activeLeftTab} />
        </aside>
        {isCompactLeftPanel && (
          <button
            onClick={() => setIsCompactLeftPanel(false)}
            className="absolute left-[54px] top-4 z-20 h-8 w-8 rounded-md border border-dark-border bg-[#1f222a] text-white/70 hover:text-white"
            title="Expand panel"
          >
            <ChevronRight className="w-4 h-4 rotate-180 mx-auto" />
          </button>
        )}
        <main className="flex-1 relative bg-dark-bg overflow-hidden">
          {children}
        </main>
        {/* Resizable Right Sidebar */}
        <aside
          ref={resizeRef}
          style={{ width: rightSidebarWidth }}
          className="relative border-l border-dark-border/70 bg-[#1c1f27] overflow-hidden"
        >
          {/* Resize Handle */}
          <div
            onMouseDown={startResizing}
            className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 transition-colors ${isResizing ? 'bg-[#dfe887]' : 'bg-transparent hover:bg-[#dfe887]/50'
              }`}
          />
          <HistoryPanel />
        </aside>
      </div>
    </div>
  );
}
