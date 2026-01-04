'use client';

import { Zap } from 'lucide-react';

interface QuickCaptureButtonProps {
  onClick: () => void;
}

export default function QuickCaptureButton({ onClick }: QuickCaptureButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 left-4 z-50 w-14 h-14 bg-accent text-white rounded-full shadow-lg shadow-accent/30 flex items-center justify-center hover:bg-accent/90 hover:scale-105 transition-all duration-200 group"
      title="Quick Capture (Ctrl+Shift+N)"
    >
      <Zap size={24} className="group-hover:scale-110 transition-transform" />
    </button>
  );
}
