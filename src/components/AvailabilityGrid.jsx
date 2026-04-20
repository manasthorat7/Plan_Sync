import React, { useState, useMemo } from 'react';
import { db } from '../services/firebase';
import { updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { calculateBestSlot } from '../utils/calculateBestSlot';
import { canEditSlots, canFinalize, canVote } from '../utils/permissions';

export default function AvailabilityGrid({ plan, userRole, setPlan, participantsInfo, isFinalized }) {
  const { currentUser } = useAuth();
  
  const [userSelections, setUserSelections] = useState(
    plan.availabilities?.[currentUser.uid] || {}
  );
  
  const [newSlotLabel, setNewSlotLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [error, setError] = useState("");

  const timeSlots = plan.timeSlots || [];
  const availabilities = plan.availabilities || {};

  const optimalTimeSlot = useMemo(() => {
    return calculateBestSlot(timeSlots, availabilities);
  }, [timeSlots, availabilities]);

  const allowVote = canVote(userRole, isFinalized);
  const allowEditSlots = canEditSlots(userRole, isFinalized);
  const allowFinalize = canFinalize(userRole);

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
    if (!newSlotLabel.trim() || !allowEditSlots) return;
    
    const slot = newSlotLabel.trim();
    if (timeSlots.includes(slot)) {
      setError("This time slot already exists!");
      return;
    }

    setIsAddingSlot(true);
    setError("");

    try {
      const planRef = doc(db, 'plans', plan.id);
      await updateDoc(planRef, {
        timeSlots: arrayUnion(slot)
      });
      
      setPlan(prev => ({
        ...prev,
        timeSlots: [...(prev.timeSlots || []), slot]
      }));
      setNewSlotLabel("");
    } catch (err) {
      console.error(err);
      setError("Failed to add time slot.");
    } finally {
      setIsAddingSlot(false);
    }
  }

  async function saveAvailabilities() {
    if (!allowVote) return;
    setIsSaving(true);
    setError("");
    
    try {
      const planRef = doc(db, 'plans', plan.id);
      await updateDoc(planRef, {
        [`availabilities.${currentUser.uid}`]: userSelections
      });

      setPlan(prev => ({
        ...prev,
        availabilities: {
          ...(prev.availabilities || {}),
          [currentUser.uid]: userSelections
        }
      }));
    } catch(err) {
       console.error(err);
       setError("Failed to save your votes.");
    } finally {
       setIsSaving(false);
    }
  }

  function toggleStatus(slotName, status) {
     if (!allowVote) return;
     setUserSelections(prev => ({
        ...prev,
        [slotName]: prev[slotName] === status ? null : status
     }));
  }

  async function handleFinalize(slot) {
     if (!allowFinalize) return;
     try {
        setError("");
        const planRef = doc(db, 'plans', plan.id);
        await updateDoc(planRef, {
           status: 'finalized',
           finalSlot: slot
        });
        setPlan(prev => ({ ...prev, status: 'finalized', finalSlot: slot }));
     } catch (e) {
        console.error(e);
        setError("Failed to finalize plan.");
     }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
         <h3 className="text-xl font-bold text-slate-800">Time Slot Availability</h3>
         {allowVote && (
            <button 
               onClick={saveAvailabilities}
               disabled={isSaving || timeSlots.length === 0}
               className="text-sm bg-primary hover:bg-indigo-600 text-white font-medium px-4 py-2 rounded transition-colors shadow-sm disabled:opacity-50"
            >
               {isSaving ? "Syncing..." : "Save My Votes"}
            </button>
         )}
      </div>

      {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm mb-4 font-semibold">{error}</div>}

      {timeSlots.length === 0 ? (
         <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500 mb-6">
            <svg className="w-10 h-10 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p className="font-medium text-slate-600">No time slots proposed yet.</p>
            {allowEditSlots && <p className="text-xs text-slate-400 mt-1">Add one below to get started.</p>}
         </div>
      ) : (
         <div className="overflow-x-auto mb-6">
           <table className="w-full text-left border-collapse min-w-[500px]">
             <thead>
               <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-y border-slate-200">
                 <th className="py-3 px-4 w-1/3">Proposed Slot</th>
                 <th className="py-3 px-4 w-1/3">Your Availability</th>
                 <th className="py-3 px-4 text-center w-1/3">Group Trend</th>
                 {allowFinalize && !isFinalized && <th className="py-3 px-4 text-center w-32">Action</th>}
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
                           disabled={!allowVote}
                           className={`px-3 py-1.5 rounded-full border transition-colors ${myVote === 'available' ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                         >
                           Available
                         </button>
                         <button 
                           onClick={() => toggleStatus(slot, 'maybe')}
                           disabled={!allowVote}
                           className={`px-3 py-1.5 rounded-full border transition-colors ${myVote === 'maybe' ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-white border-slate-200 text-slate-500 hover:border-amber-200 hover:text-amber-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                         >
                           Maybe
                         </button>
                         <button 
                           onClick={() => toggleStatus(slot, 'unavailable')}
                           disabled={!allowVote}
                           className={`px-3 py-1.5 rounded-full border transition-colors ${myVote === 'unavailable' ? 'bg-red-100 border-red-200 text-red-800' : 'bg-white border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                         >
                           No
                         </button>
                       </div>
                     </td>
                     <td className="py-4 px-4 text-center">
                        {sum === 0 ? (
                            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">Awaiting Votes</span>
                        ) : (
                            <div className="flex items-center justify-center gap-2 text-sm font-bold bg-slate-50 py-1.5 rounded-lg border border-slate-100">
                               <span className="text-emerald-600">{stats.available} Yay</span> <span className="text-slate-300">|</span>
                               <span className="text-amber-500">{stats.maybe} TBD</span> <span className="text-slate-300">|</span>
                               <span className="text-red-500">{stats.unavailable} Nay</span>
                            </div>
                        )}
                     </td>
                     {allowFinalize && !isFinalized && (
                         <td className="py-4 px-4 text-center">
                             <button onClick={() => handleFinalize(slot)} className="text-xs font-bold uppercase tracking-wider text-primary bg-indigo-50 border border-indigo-100 hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
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
      {allowEditSlots && (
         <div className="mt-auto pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Add Time Slot</h4>
            <form onSubmit={handleAddSlot} className="flex gap-2 items-center">
               <input 
                 type="text" 
                 placeholder="E.g. July 12th @ 5 PM" 
                 required
                 value={newSlotLabel}
                 onChange={e => setNewSlotLabel(e.target.value)}
                 className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-medium text-slate-800 bg-slate-50 focus:bg-white transition-colors"
                 disabled={isAddingSlot}
               />
               <button 
                 type="submit" 
                 disabled={isAddingSlot}
                 className="bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
               >
                 {isAddingSlot ? 'Adding...' : 'Add Slot'}
               </button>
            </form>
         </div>
      )}
    </div>
  );
}
