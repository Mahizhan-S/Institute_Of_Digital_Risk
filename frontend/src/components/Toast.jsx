import { useEffect } from 'react';

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'border-emerald-500 bg-emerald-500/10 text-emerald-300',
    error: 'border-red-500 bg-red-500/10 text-red-300',
    info: 'border-blue-500 bg-blue-500/10 text-blue-300',
    warning: 'border-amber-500 bg-amber-500/10 text-amber-300',
  };

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

  return (
    <div className={`toast fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border ${styles[type]} backdrop-blur-lg shadow-2xl max-w-sm`}>
      <span className="text-lg">{icons[type]}</span>
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 text-white/50 hover:text-white/80 transition-colors">✕</button>
    </div>
  );
}

export default Toast;
