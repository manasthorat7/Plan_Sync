import React from 'react';
import { db } from '../services/firebase';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { getRoleBadge, canManageMembers } from '../utils/permissions';

export default function MemberManager({ plan, setPlan, currentUser, participantsInfo, userRole }) {
  const isManager = canManageMembers(userRole);

  async function handleRoleChange(uid, newRole) {
    try {
      const planRef = doc(db, 'plans', plan.id);
      await updateDoc(planRef, {
        [`roles.${uid}`]: newRole
      });
      setPlan(prev => ({
        ...prev,
        roles: { ...prev.roles, [uid]: newRole }
      }));
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  }

  async function handleRemoveMember(uid) {
    try {
      const planRef = doc(db, 'plans', plan.id);
      
      // Build updated roles without this user
      const updatedRoles = { ...plan.roles };
      delete updatedRoles[uid];

      await updateDoc(planRef, {
        participants: arrayRemove(uid),
        roles: updatedRoles
      });

      setPlan(prev => {
        const newRoles = { ...prev.roles };
        delete newRoles[uid];
        return {
          ...prev,
          participants: prev.participants.filter(p => p !== uid),
          roles: newRoles
        };
      });
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">
        Team
        <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
          {plan.participants?.length || 0}
        </span>
      </h3>

      <ul className="space-y-2">
        {plan.participants?.map(uid => {
          const info = participantsInfo[uid];
          const email = info?.displayName || info?.email || uid;
          const role = plan.roles?.[uid] || 'viewer';
          const badge = getRoleBadge(role);
          const isSelf = uid === currentUser.uid;
          const isOwnerUser = role === 'owner';

          return (
            <li key={uid} className="flex items-center justify-between gap-2 p-2.5 hover:bg-slate-50 rounded-lg transition-colors">
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                {info?.photoURL ? (
                  <img
                    src={info.photoURL}
                    alt=""
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-8 w-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0 uppercase border border-indigo-200">
                    {email.substring(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-700 truncate">
                    {email}
                    {isSelf && <span className="text-xs text-slate-400 font-normal ml-1">(You)</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isManager && !isOwnerUser && !isSelf ? (
                  <>
                    <select
                      value={role}
                      onChange={(e) => handleRoleChange(uid, e.target.value)}
                      className="text-xs font-semibold border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(uid)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Remove member"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </>
                ) : (
                  <span className={`text-[10px] ${badge.bg} border ${badge.border} ${badge.text} px-2.5 py-1 rounded-md uppercase font-semibold tracking-wider`}>
                    {badge.label}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
