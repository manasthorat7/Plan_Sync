import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlanProvider, usePlanContext } from '../context/PlanContext';
import AvailabilityGrid from '../components/AvailabilityGrid';
import PlanDiscussions from '../components/PlanDiscussions';
import MemberManager from '../components/MemberManager';
import Itinerary from '../components/Itinerary';
import BudgetSystem from '../components/BudgetSystem';
import GlassCard from '../components/GlassCard';

function PlanDetailsInner() {
  const { 
    plan, 
    loading, 
    error, 
    deletePlanDb, 
    leavePlan, 
    inviteUser, 
    permissions,
    isFinalized
  } = usePlanContext();
  
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState('availability');

  // Invitation State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState({ type: '', msg: '' });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="max-w-5xl mx-auto p-6 mt-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 mb-6 flex flex-col items-start gap-4">
          <h3 className="text-lg font-bold">Unauthorized / Not Found</h3>
          <p>{error || "Plan could not be loaded."}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-red-100 text-red-800 rounded font-medium hover:bg-red-200 transition-colors shadow-sm">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  async function handleDeletePlan() {
    if (!window.confirm('Are you sure you want to permanently delete this plan? This cannot be undone.')) return;
    try {
      await deletePlanDb();
      navigate('/');
    } catch (err) {
      console.error('Delete plan error:', err);
    }
  }

  async function handleLeaveGroup() {
    if (!window.confirm('Are you sure you want to leave this plan?')) return;
    try {
      await leavePlan();
      navigate('/');
    } catch (err) {
      console.error('Leave group error:', err);
    }
  }

  async function handleInviteSubmit(e) {
    e.preventDefault();
    setInviteFeedback({ type: '', msg: '' });
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    const res = await inviteUser(inviteEmail.trim(), inviteRole);
    setInviteLoading(false);

    if (res.error) {
       setInviteFeedback({ type: 'error', msg: res.error });
    } else if (res.success) {
       setInviteFeedback({ type: 'success', msg: res.message });
       setInviteEmail('');
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 mt-4">
      <div className="mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="text-sm font-medium text-purple-200 dark:text-slate-400 hover:text-white flex items-center transition-colors mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Dashboard
        </button>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
             <div className="flex items-center gap-3 mb-2 flex-wrap">
                 <h2 className="text-4xl font-extrabold text-white drop-shadow-sm">{plan.title}</h2>
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap mt-1 shadow-sm border ${
                    isFinalized ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' :
                    'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                 }`}>
                    {isFinalized ? 'Locked' : 'Draft'}
                 </span>
                 {isFinalized && plan.finalSlot && (
                    <span className="text-sm bg-gradient-to-r from-primary to-purple-600 text-white font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-md">
                       🎯 {plan.finalSlot}
                    </span>
                 )}
             </div>
             {plan.description && <p className="text-purple-200 dark:text-slate-400 mt-2 text-lg font-medium">{plan.description}</p>}
           </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <GlassCard className="flex flex-wrap gap-2 mb-6 p-2 !rounded-xl !border-0 bg-white/20 dark:bg-black/20">
         <button onClick={() => setActiveTab('availability')} className={`flex-1 text-center py-2 px-3 text-sm font-semibold rounded-lg shadow-sm border transition-colors ${activeTab === 'availability' ? 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border-indigo-500/30' : 'bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10 border-transparent'}`}>Availability</button>
         <button onClick={() => setActiveTab('budget')} className={`flex-1 text-center py-2 px-3 text-sm font-semibold rounded-lg shadow-sm border transition-colors ${activeTab === 'budget' ? 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border-indigo-500/30' : 'bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10 border-transparent'}`}>Budget</button>
         <button onClick={() => setActiveTab('discussion')} className={`flex-1 text-center py-2 px-3 text-sm font-semibold rounded-lg shadow-sm border transition-colors ${activeTab === 'discussion' ? 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border-indigo-500/30' : 'bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10 border-transparent'}`}>Discussion</button>
         <button onClick={() => setActiveTab('team')} className={`flex-1 text-center py-2 px-3 text-sm font-semibold rounded-lg shadow-sm border transition-colors ${activeTab === 'team' ? 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border-indigo-500/30' : 'bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10 border-transparent'}`}>Team & Itinerary</button>
      </GlassCard>

      <div className="mt-8">
        
        {activeTab === 'availability' && (
           <GlassCard className="p-6 min-h-[300px]">
              {/* Components will now extract what they need via usePlanContext() internally */}
              <AvailabilityGrid />
           </GlassCard>
        )}
           
        {activeTab === 'budget' && (
           <div className="max-w-3xl mx-auto">
             <BudgetSystem />
           </div>
        )}
           
        {activeTab === 'discussion' && (
           <div className="max-w-3xl mx-auto">
             <PlanDiscussions planId={plan.id} />
           </div>
        )}

        {activeTab === 'team' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6 lg:col-span-1">
                 <MemberManager />

                 {/* Invite Form */}
                 {permissions.canInvite && (
                    <GlassCard className="p-6">
                       <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Invite User</h4>
                       
                       {inviteFeedback.type === 'error' && <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-3 bg-red-500/20 p-2 rounded-lg border border-red-500/30">{inviteFeedback.msg}</p>}
                       {inviteFeedback.type === 'success' && <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-3 bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">{inviteFeedback.msg}</p>}
                       
                       <form onSubmit={handleInviteSubmit} className="flex flex-col gap-2.5">
                          <input 
                            type="email" 
                            required
                            placeholder="user@example.com" 
                            className="w-full px-3 py-2 text-sm border border-white/30 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/50 dark:bg-black/20 text-slate-800 dark:text-slate-100 placeholder-slate-500 transition-colors"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            disabled={inviteLoading}
                          />
                          <div className="flex gap-2">
                            <select 
                              className="flex-1 px-3 py-2 text-sm border border-white/30 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white/50 dark:bg-black/20 text-slate-800 dark:text-slate-100 font-medium transition-colors"
                              value={inviteRole}
                              onChange={(e) => setInviteRole(e.target.value)}
                              disabled={inviteLoading}
                            >
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <button 
                              type="submit" 
                              disabled={inviteLoading}
                              className="bg-gradient-to-r from-primary to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-md disabled:opacity-50 whitespace-nowrap"
                            >
                              {inviteLoading ? 'Wait...' : 'Invite'}
                            </button>
                          </div>
                       </form>
                    </GlassCard>
                 )}

                 {/* Actions */}
                 <GlassCard className="p-6">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Actions</h4>
                    {permissions.isOwner ? ( // Since permissions hook encapsulates logic, useOwner equivalent
                      <button
                        onClick={handleDeletePlan}
                        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-700 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-4 py-2.5 rounded-xl transition-all hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Delete Plan
                      </button>
                    ) : (
                      <button
                        onClick={handleLeaveGroup}
                        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-4 py-2.5 rounded-xl transition-all hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        Leave Group
                      </button>
                    )}
                 </GlassCard>
              </div>
              
              <div className="lg:col-span-2">
                 <Itinerary />
              </div>
           </div>
        )}
      </div>
    </div>
  );
}

export default function PlanDetails() {
   const { id } = useParams();
   const { currentUser } = useAuth();

   // Boundary wrap inside provider so children can safely use usePlanContext
   return (
      <PlanProvider planId={id} currentUserUid={currentUser?.uid}>
         <PlanDetailsInner />
      </PlanProvider>
   );
}
