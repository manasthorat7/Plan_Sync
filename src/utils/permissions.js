/**
 * Centralized permission utilities for PlanSync role-based access control.
 * Roles: "owner" | "editor" | "viewer"
 */

export function canEditSlots(role, isFinalized) {
  return role === 'owner' && !isFinalized;
}

export function canFinalize(role) {
  return role === 'owner';
}

export function canVote(role, isFinalized) {
  return !isFinalized && ['owner', 'editor', 'viewer'].includes(role);
}

export function canManageMembers(role) {
  return role === 'owner';
}

export function canInvite(role, isFinalized) {
  return role === 'owner' && !isFinalized;
}

export function canDiscuss(role, isFinalized) {
  return !isFinalized && ['owner', 'editor', 'viewer'].includes(role);
}

export function getRoleBadge(role) {
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
}
