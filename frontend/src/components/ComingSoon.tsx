import React from 'react';
import { Lock } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
      <div className="w-20 h-20 rounded-2xl bg-gray-800/50 border border-border flex items-center justify-center mb-6">
        <Lock size={32} className="text-gray-600" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-sm text-gray-500 max-w-md text-center">{description}</p>
      <div className="mt-6 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Coming in Next Processing Module
        </span>
      </div>
    </div>
  );
}
