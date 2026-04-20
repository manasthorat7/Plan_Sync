import React, { useState } from 'react';
import { usePlanContext } from '../context/PlanContext';
import useDebounce from '../hooks/useDebounce';
import useToggle from '../hooks/useToggle';

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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col max-h-[400px]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-800">Final Itinerary</h3>
          {hasContent && (
            <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
              Published
            </span>
          )}
        </div>
        {permissions.canFinalize && !editing && (
          <button
            onClick={() => { setContent(plan?.itinerary || ''); toggleEditing(); }}
            className="text-xs font-semibold text-primary hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
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
              className="flex-1 w-full px-4 py-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 focus:bg-white resize-none font-medium text-slate-700 leading-relaxed"
              placeholder={`Write the final itinerary here...\n\nExample:\n📅 Day 1 — Arrival\n• Check into hotel by 3 PM\n• Evening beach walk\n• Dinner at 8 PM\n\n📅 Day 2 — Explore\n• Morning trek at 7 AM\n• Lunch at local café\n• Sunset viewpoint visit`}
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={toggleEditing}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm bg-primary hover:bg-indigo-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? 'Publishing...' : 'Publish Itinerary'}
              </button>
            </div>
          </div>
        ) : hasContent ? (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-medium">
              {plan.itinerary}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
            <p className="text-sm font-medium">No itinerary published yet.</p>
            {permissions.canFinalize ? (
              <p className="text-xs mt-1">Click "Write" above to create one.</p>
            ) : (
              <p className="text-xs mt-1">The plan owner will publish the itinerary here.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
