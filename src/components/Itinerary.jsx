import React, { useState } from 'react';
import { usePlanContext } from '../context/PlanContext';
import useDebounce from '../hooks/useDebounce';
import useToggle from '../hooks/useToggle';
import GlassCard from './GlassCard';

export default function Itinerary() {
  const { plan, updatePlan, permissions } = usePlanContext();
  
  // Custom Hooks implementation
  const [editing, toggleEditing] = useToggle(false);
  const [content, setContent] = useState(plan?.itinerary || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updatePlan({ itinerary: content.trim() });
      toggleEditing();
    } catch (err) {
      console.error("Failed to save itinerary:", err);
    } finally {
      setSaving(false);
    }
  }

  const hasContent = plan?.itinerary && plan.itinerary.trim().length > 0;

  return (
    <GlassCard className="flex flex-col h-full max-h-[600px] lg:max-h-none">
      <div className="p-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Final Itinerary</h3>
          {hasContent && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase font-extrabold tracking-wider shadow-sm">
              Published
            </span>
          )}
        </div>
        {permissions.canFinalize && !editing && (
          <button
            onClick={() => { setContent(plan?.itinerary || ''); toggleEditing(); }}
            className="text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all hover:scale-105 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
            {hasContent ? 'Edit' : 'Write'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {editing ? (
          <div className="flex flex-col h-full gap-3">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="flex-1 w-full min-h-[300px] px-4 py-3 text-sm border border-white/30 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white/50 dark:bg-black/20 focus:bg-white/80 dark:focus:bg-black/40 resize-none font-bold text-slate-800 dark:text-slate-200 leading-relaxed shadow-inner transition-colors"
              placeholder={`Write the final itinerary here...\n\nExample:\n📅 Day 1 — Arrival\n• Check into hotel by 3 PM\n• Evening beach walk\n• Dinner at 8 PM`}
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={toggleEditing}
                className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white font-bold px-4 py-2 rounded-xl bg-white/30 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/40 transition-all border border-white/30 dark:border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm bg-gradient-to-r from-primary to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-md hover:scale-105 disabled:opacity-50"
              >
                {saving ? 'Publishing...' : 'Publish Itinerary'}
              </button>
            </div>
          </div>
        ) : hasContent ? (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-semibold bg-white/30 dark:bg-black/20 p-4 rounded-xl border border-white/20 dark:border-white/5 shadow-inner">
              {plan.itinerary}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 py-12">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
            <p className="text-sm font-bold">No itinerary published yet.</p>
            {permissions.canFinalize ? (
              <p className="text-xs mt-1">Click "Write" above to create one.</p>
            ) : (
              <p className="text-xs mt-1">The plan owner will publish the itinerary here.</p>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
