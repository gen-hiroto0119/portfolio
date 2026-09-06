"use client";

import { Toast } from "@base-ui/react/toast";
import { Info, X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

const feedback = Toast.createToastManager();

export function FeedbackToasts() {
  return <Toast.Provider toastManager={feedback} timeout={0} limit={2}><ToastViewport /></Toast.Provider>;
}

function ToastViewport() {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport aria-label="操作の通知" className="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[70] flex flex-col gap-3 outline-none sm:left-auto sm:right-6 sm:w-96">
        {toasts.map(toast => (
          <Toast.Root key={toast.id} toast={toast} className="pointer-events-auto rounded-lg border border-border bg-background p-4 shadow-lg data-[ending-style]:hidden data-[limited]:hidden">
            <Toast.Content className="flex items-start gap-3">
              <Info size={18} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <Toast.Title className="text-sm font-medium" />
                <Toast.Description render={<div />} className="mt-2 space-y-3 text-sm leading-6 text-muted-foreground" />
              </div>
              <Toast.Close aria-label="案内を閉じる" className="rounded p-1 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2"><X size={15} aria-hidden="true" /></Toast.Close>
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

// Renders no element in the editor's layout; all feedback lives in the fixed viewport.
export function FeedbackNotice({ title, children, onDismiss }: {
  title: string;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const id = useId();
  const initial = useRef({ title, children, onDismiss });
  useEffect(() => {
    let active = true;
    const options = initial.current;
    feedback.add({ id, title: options.title, description: options.children, priority: "high", timeout: 0, onClose: () => { if (active) options.onDismiss?.(); } });
    return () => { active = false; feedback.close(id); };
  }, [id]);
  useEffect(() => { feedback.update(id, { title, description: children }); }, [id, title, children]);
  return null;
}
