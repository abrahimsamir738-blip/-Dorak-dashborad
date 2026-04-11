import React from 'react';

interface LoadingProps {
  show: boolean;
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ show, message = 'جاري التحميل...' }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[300] animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100 flex flex-col items-center gap-4 min-w-[200px]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-700">{message}</p>
      </div>
    </div>
  );
};

export default Loading;
