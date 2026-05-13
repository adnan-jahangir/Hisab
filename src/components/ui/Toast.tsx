import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastProps = {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
};

export const Toast = ({ message, type = 'success', onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-glow text-sm font-medium ${
        type === 'success' 
          ? 'bg-success/10 text-success border border-success/20' 
          : type === 'warning'
          ? 'bg-warning/10 text-warning border border-warning/20'
          : 'bg-danger/10 text-danger border border-danger/20'
      } backdrop-blur-md`}
    >
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
