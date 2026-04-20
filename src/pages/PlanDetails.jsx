import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import AvailabilityGrid from '../components/AvailabilityGrid';
import PlanDiscussions from '../components/PlanDiscussions';
import MemberManager from '../components/MemberManager';
import Itinerary from '../components/Itinerary';
import BudgetSystem from '../components/BudgetSystem';
import { canInvite } from '../utils/permissions';

export default function PlanDetails() {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [participantsInfo, setParticipantsInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab State
  const [activeTab, setActiveTab] = useState('availability');

  // Invitation State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPlanAndUsers() {
      try {
        const docRef = doc(db, 'plans', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const planData = docSnap.data();
          if (!planData.participants?.includes(currentUser.uid)) {
             setError("You do not have permission to view this plan.");
             setPlan(null);
             setLoading(false);
             return;
          } 
          
          setPlan({ id: docSnap.id, ...planData });
          setError('');

          const infoMap = {};
          await Promise.all((planData.participants || []).map(async (uid) => {
             const userSnap = await getDoc(doc(db, 'users', uid));
             if (userSnap.exists()) {
                infoMap[uid] = userSnap.data();
             } else {
                infoMap[uid] = { email: "Unknown User", uid };
             }
          }));

          setParticipantsInfo(infoMap);

        } else {
          setError("Plan not found. It may have been deleted.");
        }
      } catch (err) {
        console.error("Fetch Details Error:", err);
        setError("Error loading plan details from database.");
      } finally {
        setLoading(false);
      }
    }

    if (id && currentUser) {
      fetchPlanAndUsers();
    }
  }, [id, currentUser]);

  async function handleInvite(e) {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', inviteEmail.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setInviteError("User not found. They must sign up first.");
        setInviteLoading(false);
        return;
      }

      let newUserId = null;
      let newUserData = null;
      querySnapshot.forEach((d) => {
        newUserId = d.data().uid;
        newUserData = d.data();
      });

      if (plan.participants.includes(newUserId)) {
         setInviteError("User is already a participant.");
         setInviteLoading(false);
         return;
      }

      const planRef = doc(db, 'plans', id);
      await updateDoc(planRef, {
        participants: arrayUnion(newUserId),
        [`roles.${newUserId}`]: inviteRole
      });

      setParticipantsInfo(prev => ({ ...prev, [newUserId]: newUserData }));
      
      setPlan(prev => ({
        ...prev,
        participants: [...prev.participants, newUserId],
        roles: { ...prev.roles, [newUserId]: inviteRole }
      }));

      setInviteSuccess(`${inviteEmail} added as ${inviteRole}!`);
      setInviteEmail('');
      
    } catch (err) {
       console.error("Invite error:", err);
       setInviteError("Failed to invite user.");
    } finally {
       setInviteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 mt-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 mb-6 flex flex-col items-start gap-4">
          <h3 className="text-lg font-bold">Unauthorized / Not Found</h3>
          <p>{error}</p>
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
      await deleteDoc(doc(db, 'plans', id));
      navigate('/');
    } catch (err) {
      console.error('Delete plan error:', err);
    }
  }

  async function handleLeaveGroup() {
    if (!window.confirm('Are you sure you want to leave this plan?')) return;
    try {
      const planRef = doc(db, 'plans', id);
      const updatedRoles = { ...plan.roles };
      delete updatedRoles[currentUser.uid];

      await updateDoc(planRef, {
        participants: arrayRemove(currentUser.uid),
        roles: updatedRoles
      });
      navigate('/');
    } catch (err) {
      console.error('Leave group error:', err);
    }
  }

  const userRole = plan?.roles?.[currentUser.uid] || 'viewer';
  const isFinalized = plan?.status === 'finalized';
  const showInvite = canInvite(userRole, isFinalized);
  const isOwner = userRole === 'owner';

  return (
    <div className="max-w-5xl mx-auto p-6 mt-4">
      <div className="mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center transition-colors mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Dashboard
        </button>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
             <div className="flex items-center gap-3 mb-2 flex-wrap">
                 <h2 className="text-4xl font-extrabold text-slate-800">{plan.title}</h2>
                 <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap mt-1 ${
                    isFinalized ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    'bg-amber-100 text-amber-800'
                 }`}>
                    {isFinalized ? 'Locked' : 'Draft'}
                 </span>
                 {isFinalized && plan.finalSlot && (
                    <span className="text-sm bg-primary text-white font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-sm border border-indigo-500">
                       🎯 {plan.finalSlot}
                    </span>
                 )}
             </div>
             {plan.description && <p className="text-slate-600 mt-2 text-lg">{plan.description}</p>}
           </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 bg-slate-50 p-2 rounded-lg border border-slate-200">
         <button onClick={() => setActiveTab('availability')} className={`flex-1 text-center py-2 px-3 text-sm font-semibold rounded shadow-sm border transition-colors ${activeTab === 'availability' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'}`}>Availability</button>
         <button onClick={() => setActiveTab('budget')} className={`flex-1 text-center py-2 px-3 text-sm font-semibold rounded shadow-sm border transition-colors ${activeTab === 'budget' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'}`}>Budget</button>
         <button onClick={() => setActiveTab('discussion')} className={`flex-1 text-center py-2 px-3 text-sm font-semibold rounded shadow-sm border transition-colors ${activeTab === 'discussion' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'}`}>Discussion</button>
         <button onClick={() => setActiveTab('team')} className={`flex-1 text-center py-2 px-3 text-sm font-semibold rounded shadow-sm border transition-colors ${activeTab === 'team' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'}`}>Team & Itinerary</button>
      </div>

      <div className="mt-8">
        
        {activeTab === 'availability' && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[300px]">
              <AvailabilityGrid 
                  plan={plan} 
                  setPlan={setPlan} 
                  userRole={userRole}
                  participantsInfo={participantsInfo} 
                  isFinalized={isFinalized}
              />
           </div>
        )}
           
        {activeTab === 'budget' && (
           <div className="max-w-3xl mx-auto">
             <BudgetSystem plan={plan} setPlan={setPlan} userRole={userRole} />
           </div>
        )}
           
        {activeTab === 'discussion' && (
           <div className="max-w-3xl mx-auto">
             <PlanDiscussions 
                planId={plan.id}
                currentUser={currentUser}
                participantsInfo={participantsInfo}
                isFinalized={isFinalized}
                userRole={userRole}
             />
           </div>
        )}

        {activeTab === 'team' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6 lg:col-span-1">
                 <MemberManager
                   plan={plan}
                   setPlan={setPlan}
                   currentUser={currentUser}
                   participantsInfo={participantsInfo}
                   userRole={userRole}
                 />

                 {/* Invite Form — Owner only, when not finalized */}
                 {showInvite && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                       <h4 className="text-sm font-bold text-slate-800 mb-3">Invite User</h4>
                       
                       {inviteError && <p className="text-xs font-medium text-red-600 mb-3 bg-red-50 p-2 rounded">{inviteError}</p>}
                       {inviteSuccess && <p className="text-xs font-medium text-emerald-700 mb-3 bg-emerald-50 p-2 rounded">{inviteSuccess}</p>}
                       
                       <form onSubmit={handleInvite} className="flex flex-col gap-2.5">
                          <input 
                            type="email" 
                            required
                            placeholder="user@example.com" 
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-slate-400 bg-white"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            disabled={inviteLoading}
                          />
                          <div className="flex gap-2">
                            <select 
                              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white font-medium text-slate-700"
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
                              className="bg-primary hover:bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
                            >
                              {inviteLoading ? 'Wait...' : 'Invite'}
                            </button>
                          </div>
                       </form>
                    </div>
                 )}

                 {/* Actions: Delete (owner) or Leave (editor/viewer) */}
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h4 className="text-sm font-bold text-slate-800 mb-3">Actions</h4>
                    {isOwner ? (
                      <button
                        onClick={handleDeletePlan}
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2.5 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Delete Plan
                      </button>
                    ) : (
                      <button
                        onClick={handleLeaveGroup}
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-4 py-2.5 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        Leave Group
                      </button>
                    )}
                 </div>
              </div>
              
              <div className="lg:col-span-2">
                 {/* Final Itinerary */}
                 <Itinerary
                    plan={plan}
                    setPlan={setPlan}
                    userRole={userRole}
                 />
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
