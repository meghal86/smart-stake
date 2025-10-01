import React from 'react';

export function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-80 bg-slate-800 rounded-lg p-4 border border-slate-700 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-slate-700 rounded w-20"></div>
        <div className="h-5 bg-slate-700 rounded w-12"></div>
      </div>
      <div className="h-4 bg-slate-700 rounded w-32 mb-3"></div>
      <div className="flex gap-2">
        <div className="h-8 bg-slate-700 rounded w-20"></div>
        <div className="h-8 bg-slate-700 rounded w-16"></div>
        <div className="h-8 bg-slate-700 rounded w-14"></div>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 animate-pulse">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-4 h-4 bg-slate-700 rounded-full"></div>
        <div className="h-4 bg-slate-700 rounded w-48"></div>
      </div>
    </div>
  );
}