import React from 'react';

const Card = ({ title, children, className = "" }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col ${className}`}>
    {title && <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>}
    {children}
  </div>
);

export default Card;