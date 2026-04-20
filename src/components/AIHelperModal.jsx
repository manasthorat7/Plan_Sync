import React, { useState } from 'react';
import { generatePlanFromIdea } from '../services/ai';

export default function AIHelperModal({ onApply }) {
  const [isOpen, setIsOpen] = useState(false);
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate(e) {
    e.preventDefault();
    if (!idea.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await generatePlanFromIdea(idea);
      if (result && result.title && result.description) {
         onApply({ title: result.title, description: result.description });
         setIsOpen(false);
         setIdea('');
      } else {
         setError('Received empty or misformatted JSON structure directly from AI.');
      }
    } catch (err) {
       setError(err.message);
    } finally {
       setLoading(false);
    }
  }

  // Visual layout if the button structure hasn't been engaged yet
  if (!isOpen) {
    return (
       <div className="mb-8">
           <button 
             type="button" 
             onClick={() => setIsOpen(true)}
             className="flex items-center justify-center gap-2 w-full py-4 bg-transparent outline-indigo-200 outline-dashed hover:bg-slate-50 text-indigo-600 rounded-xl font-semibold transition-colors shadow-sm"
           >
              <span className="text-xl leading-none">✨</span>
              Stuck on details? Try the AI Event Architect
           </button>
       </div>
    );
  }

  // Rendered interactive composition interface structurally expanded natively
  return (
    <div className="mb-8 bg-indigo-50/60 border border-indigo-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group transition-all">
       <button 
         type="button" 
         onClick={() => setIsOpen(false)}
         className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-white/50 hover:bg-white rounded-full transition-colors z-10"
         title="Close AI Architect"
       >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
       </button>

       {/* Visual header layer */}
       <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl leading-none">✨</span>
          <h3 className="text-lg font-bold text-indigo-900 tracking-tight">AI Event Architect</h3>
       </div>
       <p className="text-sm font-medium text-indigo-800/70 mb-5 pr-8 leading-relaxed">
          Briefly describe what you're trying to build, and watch our artificial intelligence parse it into a completely tailored formal plan title and comprehensive detailed group itinerary instantly.
       </p>

       {error && <div className="mb-4 text-xs font-semibold bg-red-50 text-red-600 p-3 rounded-xl border border-red-100">{error}</div>}

       <form onSubmit={handleGenerate} className="flex flex-col gap-4">
          <textarea
            className="w-full px-4 py-3.5 bg-white border border-indigo-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm outline-none transition-all resize-none shadow-sm placeholder-slate-400 text-slate-800 font-medium leading-relaxed"
            rows="3"
            placeholder="E.g. Setting up a 3-day weekend camping trip next month down to Yosemite with the entire college friend group..."
            value={idea}
            onChange={e => setIdea(e.target.value)}
            disabled={loading}
          />
          <button 
             type="submit" 
             disabled={loading || !idea.trim()}
             className="w-full flex justify-center items-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow hover:shadow-md disabled:hover:shadow-none hover:-translate-y-0.5 tracking-wide uppercase"
          >
             {loading ? (
                <>
                   <svg className="animate-spin h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Mapping Itinerary Details...
                </>
             ) : 'Generate Output'}
          </button>
       </form>
    </div>
  );
}
