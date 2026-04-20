import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import AvailabilityGrid from '../components/AvailabilityGrid';
import PlanDiscussions from '../components/PlanDiscussions';
import MemberManager from '../components/MemberManager';
import { canInvite } from '../utils/permissions';

export default function PlanDetails() {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [participantsInfo, setParticipantsInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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

  const userRole = plan?.roles?.[currentUser.uid] || 'viewer';
  const isFinalized = plan?.status === 'finalized';
  const showInvite = canInvite(userRole, isFinalized);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[300px]">
              <AvailabilityGrid 
                  plan={plan} 
                  setPlan={setPlan} 
                  userRole={userRole}
                  participantsInfo={participantsInfo} 
                  isFinalized={isFinalized}
              />
           </div>
           
           <PlanDiscussions 
              planId={plan.id}
              currentUser={currentUser}
              participantsInfo={participantsInfo}
              isFinalized={isFinalized}
              userRole={userRole}
           />
        </div>

        <div className="space-y-6">
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
        </div>
      </div>
    </div>
  );
}
