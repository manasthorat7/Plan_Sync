import React, { useState } from 'react';
import { usePlanContext } from '../context/PlanContext';
import useBudget from '../hooks/useBudget';

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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full max-h-[600px]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span>Smart Budget</span>
        </h3>
        <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
          {memberCount} Member{memberCount !== 1 ? 's' : ''} Split
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Trip Cost</span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-800">{formatCurrency(totalCost)}</span>
           </div>
           <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Cost Per Person</span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-700">{formatCurrency(perPersonCost)}</span>
           </div>
        </div>

        <div>
           <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider border-b border-slate-100 pb-2">Expense Breakdown</h4>
           {expenses.length === 0 ? (
             <div className="text-center py-6 text-slate-400 text-sm">
                <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                No expenses logged yet.
             </div>
           ) : (
             <ul className="space-y-2">
               {expenses.map((exp) => (
                 <li key={exp.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-lg group transition-colors hover:border-slate-200">
                    <span className="text-sm font-semibold text-slate-700">{exp.category}</span>
                    <div className="flex items-center gap-3">
                       <span className="text-sm font-bold text-slate-800">{formatCurrency(exp.amount)}</span>
                       {permissions.canEditBudget && (
                         <button 
                           onClick={() => handleDeleteExpense(exp.id)}
                           className="text-slate-300 hover:text-red-500 transition-colors bg-white hover:bg-red-50 rounded-md p-1 opacity-100 lg:opacity-0 group-hover:opacity-100"
                           title="Remove Expense"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl">
           <form onSubmit={handleAddExpense} className="flex gap-2">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-1/3 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              >
                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="relative flex-1">
                 <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-medium text-slate-400">₹</span>
                 <input 
                   type="number" 
                   min="0"
                   required
                   placeholder="Amount"
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:border-primary shadow-sm"
                 />
              </div>
              <button 
                type="submit"
                disabled={isSaving || !amount}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                 Add
              </button>
           </form>
        </div>
      )}
    </div>
  );
}
