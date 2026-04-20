import React, { createContext, useContext } from 'react';
import usePlan from '../hooks/usePlan';
import useRole from '../hooks/useRole';

// Create internal Context
const PlanContext = createContext(null);

/**
 * PlanProvider manages the integration of usePlan and useRole globally for subchildren.
 */
export function PlanProvider({ planId, currentUserUid, children }) {
  const { plan, participantsInfo, loading, error, updatePlan, deletePlanDb, leavePlan, inviteUser } = usePlan(planId, currentUserUid);
  
  // Resolve role mapping based on fetched plan Data
  const roleString = plan?.roles?.[currentUserUid] || 'viewer';
  const isFinalized = plan?.status === 'finalized';
  
  const permissions = useRole(roleString, isFinalized);

  const contextValue = {
    plan,
    participantsInfo,
    loading,
    error,
    updatePlan,
    deletePlanDb,
    leavePlan,
    inviteUser,
    roleString,
    permissions,
    isFinalized,
    currentUserUid
  };

  return (
    <PlanContext.Provider value={contextValue}>
      {children}
    </PlanContext.Provider>
  );
}

// Hook shortcut
export const usePlanContext = () => {
    const ctx = useContext(PlanContext);
    if (!ctx) throw new Error("usePlanContext must be used within a PlanProvider");
    return ctx;
};
