import React, { useState, useMemo } from 'react';
import { arrayUnion } from 'firebase/firestore';
import { usePlanContext } from '../context/PlanContext';
import { calculateBestSlot } from '../utils/calculateBestSlot';
import useToggle from '../hooks/useToggle';

export default function AvailabilityGrid() {
  const { plan, updatePlan, currentUserUid, permissions, isFinalized } = usePlanContext();
  
  const [userSelections, setUserSelections] = useState(
    plan?.availabilities?.[currentUserUid] || {}
  );
  
  const [newSlotLabel, setNewSlotLabel] = useState("");
  const [isSaving, toggleSaving] = useToggle(false);
  const [isAddingSlot, toggleAddingSlot] = useToggle(false);
  const [error, setError] = useState("");

  const timeSlots = plan?.timeSlots || [];
  const availabilities = plan?.availabilities || {};

  const optimalTimeSlot = useMemo(() => {
    return calculateBestSlot(timeSlots, availabilities);
  }, [timeSlots, availabilities]);

  function calculateSlotStats(slotName) {
    let available = 0;
    let maybe = 0;
    let unavailable = 0;
    
    Object.values(availabilities).forEach(userVotes => {
      if (userVotes[slotName] === 'available') available++;
      if (userVotes[slotName] === 'maybe') maybe++;
      if (userVotes[slotName] === 'unavailable') unavailable++;
    });

    return { available, maybe, unavailable };
  }

  async function handleAddSlot(e) {
    e.preventDefault();
    if (!newSlotLabel.trim() || !permissions.canEditSlots) return;
    
    const slot = newSlotLabel.trim();
    if (timeSlots.includes(slot)) {
      setError("This time slot already exists!");
      return;
    }

    toggleAddingSlot();
    setError("");

    try {
      await updatePlan({
        timeSlots: arrayUnion(slot)
      });
      setNewSlotLabel("");
    } catch (err) {
      console.error(err);
      setError("Failed to add time slot.");
    } finally {
      toggleAddingSlot();
    }
  }

  async function saveAvailabilities() {
    if (!permissions.canVote) return;
    toggleSaving();
    setError("");
    
    try {
      await updatePlan({
        [`availabilities.${currentUserUid}`]: userSelections
      });
    } catch(err) {
       console.error(err);
       setError("Failed to save your votes.");
    } finally {
       toggleSaving();
    }
  }

  function toggleStatus(slotName, status) {
     if (!permissions.canVote) return;
     setUserSelections(prev => ({
        ...prev,
        [slotName]: prev[slotName] === status ? null : status
     }));
  }

  async function handleFinalize(slot) {
     if (!permissions.canFinalize) return;
     try {
        setError("");
        await updatePlan({
           status: 'finalized',
           finalSlot: slot
        });
     } catch (e) {
        console.error(e);
        setError("Failed to finalize plan.");
     }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-4 border-b border-surface-200 pb-3">
         <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Time Slot Availability</h3>
         {permissions.canVote && (
            <button 
               onClick={saveAvailabilities}
               disabled={isSaving || timeSlots.length === 0}
               className="text-sm bg-gradient-to-r from-primary to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-all shadow-md disabled:opacity-50 hover:scale-105"
            >
               {isSaving ? "Syncing..." : "Save My Votes"}
            </button>
         )}
      </div>

      {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm mb-4 font-semibold">{error}</div>}

      {timeSlots.length === 0 ? (
         <div className="bg-white/20 dark:bg-black/20 backdrop-blur border border-white/20 dark:border-white/10 rounded-xl p-8 text-center text-slate-600 dark:text-slate-400 mb-6 shadow-inner">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p className="font-bold text-slate-700 dark:text-slate-200">No time slots proposed yet.</p>
            {permissions.canEditSlots && <p className="text-xs mt-1">Add one below to get started.</p>}
         </div>
      ) : (
         <div className="overflow-x-auto mb-6">
           <table className="w-full text-left border-collapse min-w-[500px]">
             <thead>
               <tr className="bg-white/30 dark:bg-black/30 backdrop-blur-md text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider border-y border-white/20 dark:border-white/10">
                 <th className="py-3 px-4 w-1/3">Proposed Slot</th>
                 <th className="py-3 px-4 w-1/3">Your Availability</th>
                 <th className="py-3 px-4 text-center w-1/3">Group Trend</th>
                 {permissions.canFinalize && !isFinalized && <th className="py-3 px-4 text-center w-32">Action</th>}
               </tr>
             </thead>
             <tbody>
               {timeSlots.map(slot => {
                 const stats = calculateSlotStats(slot);
                 const sum = stats.available + stats.maybe + stats.unavailable;
                 const myVote = userSelections[slot];
                 const isPickedFinal = isFinalized && plan.finalSlot === slot;

                 return (
                   <tr key={slot} className={`border-b border-slate-100 transition-colors ${
                      isPickedFinal ? 'bg-emerald-50 border-l-4 border-l-emerald-500' :
                      (optimalTimeSlot === slot && !isFinalized) ? 'bg-indigo-50/70 hover:bg-indigo-100/70 border-l-4 border-l-primary' : 'hover:bg-slate-50/50'
                   }`}>
                     <td className="py-4 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                           {slot}
                           {isPickedFinal ? (
                              <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold shadow-sm whitespace-nowrap shrink-0">
                                Locked
                              </span>
                           ) : optimalTimeSlot === slot && !isFinalized && (
                              <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold shadow-sm whitespace-nowrap shrink-0">
                                Top Pick
                              </span>
                           )}
                        </div>
                     </td>
                     <td className="py-4 px-4">
                       <div className="flex gap-2 text-xs font-semibold">
                         <button 
                           onClick={() => toggleStatus(slot, 'available')}
                           disabled={!permissions.canVote}
                           className={`px-3 py-1.5 rounded-full border transition-colors ${myVote === 'available' ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                         >
                           Available
                         </button>
                         <button 
                           onClick={() => toggleStatus(slot, 'maybe')}
                           disabled={!permissions.canVote}
                           className={`px-3 py-1.5 rounded-full border transition-colors ${myVote === 'maybe' ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-white border-slate-200 text-slate-500 hover:border-amber-200 hover:text-amber-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                         >
                           Maybe
                         </button>
                         <button 
                           onClick={() => toggleStatus(slot, 'unavailable')}
                           disabled={!permissions.canVote}
                           className={`px-3 py-1.5 rounded-full border transition-colors ${myVote === 'unavailable' ? 'bg-red-100 border-red-200 text-red-800' : 'bg-white border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                         >
                           No
                         </button>
                       </div>
                     </td>
                     <td className="py-4 px-4 text-center">
                        {sum === 0 ? (
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white/20 dark:bg-black/20 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Awaiting</span>
                        ) : (
                            <div className="flex items-center justify-center gap-2 text-sm font-bold bg-white/30 dark:bg-black/30 py-1.5 rounded-lg border border-white/20 dark:border-white/10 shadow-sm backdrop-blur">
                               <span className="text-emerald-700 dark:text-emerald-400">{stats.available} Yay</span> <span className="text-slate-400 dark:text-slate-600">|</span>
                               <span className="text-amber-600 dark:text-amber-400">{stats.maybe} TBD</span> <span className="text-slate-400 dark:text-slate-600">|</span>
                               <span className="text-red-600 dark:text-red-400">{stats.unavailable} Nay</span>
                            </div>
                        )}
                     </td>
                     {permissions.canFinalize && !isFinalized && (
                         <td className="py-4 px-4 text-center">
                             <button onClick={() => handleFinalize(slot)} className="text-xs font-bold uppercase tracking-wider text-primary dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg transition-all hover:scale-105 whitespace-nowrap shadow-sm">
                                Lock
                             </button>
                         </td>
                     )}
                   </tr>
                 )
               })}
             </tbody>
           </table>
         </div>
      )}

      {/* Add Slot — Owner only */}
      {permissions.canEditSlots && (
         <div className="mt-auto pt-4 border-t border-white/20 dark:border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Add Time Slot</h4>
            <form onSubmit={handleAddSlot} className="flex gap-2 items-center">
               <input 
                 type="text" 
                 placeholder="E.g. July 12th @ 5 PM" 
                 required
                 value={newSlotLabel}
                 onChange={e => setNewSlotLabel(e.target.value)}
                 className="flex-1 px-3 py-2 text-sm border border-white/30 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-medium text-slate-800 dark:text-slate-100 bg-white/50 dark:bg-black/20 focus:bg-white/80 dark:focus:bg-black/40 transition-colors shadow-sm"
                 disabled={isAddingSlot}
               />
               <button 
                 type="submit" 
                 disabled={isAddingSlot}
                 className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-900 dark:hover:bg-slate-100 font-bold px-4 py-2 rounded-lg text-sm transition-all shadow-md disabled:opacity-50 hover:scale-105 whitespace-nowrap"
               >
                 {isAddingSlot ? 'Adding...' : 'Add Slot'}
               </button>
            </form>
         </div>
      )}
    </div>
  );
}
