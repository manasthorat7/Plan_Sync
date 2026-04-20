import { useMemo } from 'react';

/**
 * useRole provides explicit permission boolean flags derived from user role.
 * @param {string} role 'owner' | 'editor' | 'viewer'
 * @param {boolean} isFinalized
 * @returns {object} Access flags
 */
export default function useRole(role, isFinalized) {
  return useMemo(() => {
    const isOwner = role === 'owner';
    const isEditor = role === 'editor';
    const isViewer = role === 'viewer';
    const hasBaseAccess = isOwner || isEditor || isViewer;

    return {
      canEditSlots: isOwner && !isFinalized,
      canFinalize: isOwner,
      canVote: hasBaseAccess && !isFinalized,
      canManageMembers: isOwner,
      canInvite: isOwner && !isFinalized,
      canDiscuss: hasBaseAccess && !isFinalized,
      canEditBudget: isOwner,
      isLocked: isFinalized,
      
      // Role UI info
      badge: (() => {
        switch (role) {
          case 'owner':
            return { label: 'Owner', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' };
          case 'editor':
            return { label: 'Editor', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' };
          case 'viewer':
            return { label: 'Viewer', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
          default:
            return { label: 'Member', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
        }
      })()
    };
  }, [role, isFinalized]);
}
