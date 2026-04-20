import React from 'react';

export default function SkeletonCard() {
   return (
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col p-6 animate-pulse transition-all">
           <div className="flex justify-between items-start mb-6">
              <div className="h-6 bg-slate-200/80 rounded-lg w-2/3"></div>
              <div className="h-5 bg-slate-200/60 rounded-full w-16"></div>
           </div>
           <div className="space-y-4 mb-8">
              <div className="h-3.5 bg-slate-200/50 rounded-md w-full"></div>
              <div className="h-3.5 bg-slate-200/50 rounded-md w-5/6"></div>
              <div className="h-3.5 bg-slate-200/50 rounded-md w-4/6"></div>
           </div>
           <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
              <div className="h-4 bg-slate-200/70 rounded w-24"></div>
              <div className="h-8 w-8 bg-slate-200/60 rounded-full"></div>
           </div>
       </div>
   );
}
