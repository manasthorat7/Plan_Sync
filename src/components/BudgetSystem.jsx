import React, { useState } from 'react';
import { usePlanContext } from '../context/PlanContext';
import useBudget from '../hooks/useBudget';
import GlassCard from './GlassCard';

const CATEGORIES = [
  'Travel',
  'Stay',
  'Food',
  'Sightseeing',
  'Local Transport',
  'Miscellaneous'
];

export default function BudgetSystem() {
  const { plan, updatePlan, permissions } = usePlanContext();
  
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const expenses = plan?.budget || [];
  const participants = plan?.participants || [];
  
  // Custom hook for math abstraction
  const { totalCost, perPersonCost, memberCount } = useBudget(expenses, participants);

  // Formatting currency safely
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  async function handleAddExpense(e) {
    e.preventDefault();
    if (!permissions.canEditBudget || !amount || Number(amount) < 0) return;

    setIsSaving(true);
    try {
      const newExpense = {
        id: Date.now().toString(),
        category,
        amount: Number(amount)
      };

      const updatedBudget = [...expenses, newExpense];
      await updatePlan({ budget: updatedBudget });
      setAmount('');
    } catch (err) {
      console.error("Failed to add expense:", err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteExpense(expenseId) {
    if (!permissions.canEditBudget) return;
    try {
      const updatedBudget = expenses.filter(e => e.id !== expenseId);
      await updatePlan({ budget: updatedBudget });
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  }

  return (
    <GlassCard className="flex flex-col h-full max-h-[600px]">
      <div className="p-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>Smart Budget</span>
        </h3>
        <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
          {memberCount} Member{memberCount !== 1 ? 's' : ''} Split
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Total Trip Cost</span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white drop-shadow-sm">{formatCurrency(totalCost)}</span>
           </div>
           <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1">Cost Per Person</span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-800 dark:text-emerald-400 drop-shadow-sm">{formatCurrency(perPersonCost)}</span>
           </div>
        </div>

        <div>
           <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider border-b border-white/20 dark:border-white/10 pb-2">Expense Breakdown</h4>
           {expenses.length === 0 ? (
             <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm font-medium">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                No expenses logged yet.
             </div>
           ) : (
             <ul className="space-y-2">
               {expenses.map((exp) => (
                 <li key={exp.id} className="flex items-center justify-between bg-white/40 dark:bg-white/10 backdrop-blur border border-white/30 dark:border-white/5 px-3 py-2.5 rounded-xl group transition-all hover:scale-[1.02] shadow-sm">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{exp.category}</span>
                    <div className="flex items-center gap-3">
                       <span className="text-sm font-extrabold text-slate-800 dark:text-white drop-shadow-sm">{formatCurrency(exp.amount)}</span>
                       {permissions.canEditBudget && (
                         <button 
                           onClick={() => handleDeleteExpense(exp.id)}
                           className="text-slate-400 hover:text-red-500 transition-colors bg-white/50 dark:bg-black/30 hover:bg-white dark:hover:bg-black/60 rounded-md p-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 shadow-sm"
                           title="Remove Expense"
                         >
                           <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                         </button>
                       )}
                    </div>
                 </li>
               ))}
             </ul>
           )}
        </div>
      </div>

      {permissions.canEditBudget && (
        <div className="p-4 bg-white/20 dark:bg-black/30 backdrop-blur-md border-t border-white/20 dark:border-white/10 rounded-b-2xl">
           <form onSubmit={handleAddExpense} className="flex gap-2">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-1/3 px-3 py-2 bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-colors"
              >
                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="relative flex-1">
                 <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-500 dark:text-slate-400">₹</span>
                 <input 
                   type="number" 
                   min="0"
                   required
                   placeholder="Amount"
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   className="w-full pl-7 pr-3 py-2 bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-colors"
                 />
              </div>
              <button 
                type="submit"
                disabled={isSaving || !amount}
                className="bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-5 py-2 rounded-xl text-sm font-bold shadow-md transition-all hover:scale-105 disabled:opacity-50"
              >
                 Add
              </button>
           </form>
        </div>
      )}
    </GlassCard>
  );
}
