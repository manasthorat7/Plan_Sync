import React from 'react';
import { usePlanContext } from '../context/PlanContext';
import { arrayRemove } from 'firebase/firestore';
import GlassCard from './GlassCard';

export default function MemberManager() {
  const { plan, updatePlan, participantsInfo, currentUserUid, permissions } = usePlanContext();

  async function handleRoleChange(uid, newRole) {
    try {
      await updatePlan({
        [`roles.${uid}`]: newRole
      });
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  }

  async function handleRemoveMember(uid) {
    try {
      const updatedRoles = { ...plan.roles };
      delete updatedRoles[uid];

      await updatePlan({
        participants: arrayRemove(uid),
        roles: updatedRoles
      });
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-white/20 dark:border-white/10 pb-3 flex items-center justify-between">
        Team
        <span className="bg-gradient-to-r from-primary to-purple-600 text-white text-xs px-2.5 py-0.5 rounded-full shadow-sm">
          {plan?.participants?.length || 0}
        </span>
      </h3>

      <ul className="space-y-2">
        {plan?.participants?.map(uid => {
          const info = participantsInfo[uid];
          const email = info?.displayName || info?.email || uid;
          const roleString = plan.roles?.[uid] || 'viewer';
          
          // Helper to fetch badges locally since we have context inside components
          const getBadge = (r) => {
             switch (r) {
                case 'head_owner': return { label: 'Head Owner', className: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30' };
                case 'owner': return { label: 'Owner', className: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30' };
                case 'editor': return { label: 'Editor', className: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30' };
                default: return { label: 'Viewer', className: 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30' };
             }
          };
          const badge = getBadge(roleString);
          
          const isSelf = uid === currentUserUid;
          const isOwnerUser = roleString === 'owner';

          return (
            <li key={uid} className="flex items-center justify-between gap-2 p-2.5 hover:bg-white/40 dark:hover:bg-white/5 rounded-xl border border-transparent hover:border-white/20 transition-all shadow-sm">
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                {info?.photoURL ? (
                  <img
                    src={info.photoURL}
                    alt=""
                    className="w-8 h-8 rounded-full border border-white/20 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-8 w-8 bg-gradient-to-tr from-primary to-purple-500 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 uppercase shadow-sm">
                    {email.substring(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate drop-shadow-sm">
                    {email}
                    {isSelf && <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">(You)</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {permissions.canManageMembers && !isOwnerUser && !isSelf ? (
                  <>
                    <select
                      value={roleString}
                      onChange={(e) => handleRoleChange(uid, e.target.value)}
                      className="text-xs font-bold border border-white/30 dark:border-white/10 rounded-lg px-2 py-1 bg-white/50 dark:bg-black/20 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(uid)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors bg-white/50 dark:bg-black/30 hover:bg-white dark:hover:bg-black/60 rounded-md shadow-sm"
                      title="Remove member"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </>
                ) : (
                  <span className={`text-[10px] border px-2.5 py-1 rounded-md uppercase font-extrabold tracking-wider shadow-sm ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
