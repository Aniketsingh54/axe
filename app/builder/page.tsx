import AppLayout from '@/components/layout/AppLayout';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import { ReactFlowProvider } from '@xyflow/react';

export default function BuilderPage() {
  return (
    <ReactFlowProvider>
      <AppLayout>
        <WorkflowCanvas />
      </AppLayout>
    </ReactFlowProvider>
  );
}

