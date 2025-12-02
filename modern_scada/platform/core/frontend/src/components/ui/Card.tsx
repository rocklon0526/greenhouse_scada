import React, { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({ title, children, className = "", noPadding = false }) => (
  <div className={`bg-slate-900/70 backdrop-blur border border-slate-700/50 rounded-xl flex flex-col ${className}`}>
    {title && (
      <div className="p-4 pb-2 shrink-0">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
      </div>
    )}
    <div className={`flex-1 min-h-0 relative ${noPadding ? 'p-0' : 'p-4'}`}>
      {children}
    </div>
  </div>
);

export default Card;