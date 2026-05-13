import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast } from './Toast';
import { useToastStore } from '../../store/useToastStore';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast
              message={t.message}
              type={t.type}
              onClose={() => removeToast(t.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
