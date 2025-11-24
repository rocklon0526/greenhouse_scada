import React from 'react';

const SensorDot = ({ val, maxLimit }) => (
  <div className="relative group cursor-pointer">
    <div className={`w-3 h-3 rounded-full border border-slate-900 transition-colors duration-500 ${val > maxLimit ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
    {/* Tooltip */}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-24 bg-slate-900 text-white text-[10px] p-2 rounded border border-slate-700 z-50 shadow-xl text-center">
      <div className="font-bold text-xs">{val}°C</div>
      <div className="text-slate-400">Normal</div>
    </div>
  </div>
);

export default SensorDot;