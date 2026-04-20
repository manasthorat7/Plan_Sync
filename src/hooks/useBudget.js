import { useMemo } from 'react';

/**
 * useBudget calculates financial aggregates (total/split).
 * @param {Array} budget Array of expense objects { id, category, amount }
 * @param {Array} participants Array of participant strings (UIDs)
 * @returns {{ totalCost: number, perPersonCost: number, memberCount: number }}
 */
export default function useBudget(budget = [], participants = []) {
  return useMemo(() => {
    // Array guarantees
    const expenses = Array.isArray(budget) ? budget : [];
    const members = Array.isArray(participants) ? participants : [];

    const totalCost = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    // Prevent divide by zero edge case
    const memberCount = Math.max(1, members.length);
    const perPersonCost = totalCost / memberCount;

    return { totalCost, perPersonCost, memberCount };
  }, [budget, participants]);
}
