import React from 'react';

const Card = ({ title, children, className = "", noPadding = false }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-xl flex flex-col ${className}`}>
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