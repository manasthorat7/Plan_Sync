import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import AvailabilityGrid from '../components/AvailabilityGrid';

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
          // Security verify
          if (!planData.participants?.includes(currentUser.uid)) {
             setError("You do not have permission to view this plan.");
             setPlan(null);
             setLoading(false);
             return;
          } 
          
          setPlan({ id: docSnap.id, ...planData });
          setError('');

          // Fetch explicit participant emails across the mapped UIDs dynamically
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
        setError("Error loading plan details structure from database.");
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
      // 1. Traverse normalized users directory locating the mapping
      const q = query(collection(db, 'users'), where('email', '==', inviteEmail.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setInviteError("User not found across registered accounts.");
        setInviteLoading(false);
        return;
      }

      // Secure specific match
      let newUserId = null;
      let newUserEmail = null;
      querySnapshot.forEach((doc) => {
        newUserId = doc.data().uid;
        newUserEmail = doc.data().email;
      });

      // 2. Trap duplication
      if (plan.participants.includes(newUserId)) {
         setInviteError("User lies inside active participant array already.");
         setInviteLoading(false);
         return;
      }

      // 3. Sync changes backwards into global scope securely
      const planRef = doc(db, 'plans', id);
      await updateDoc(planRef, {
        participants: arrayUnion(newUserId),
        [`roles.${newUserId}`]: inviteRole
      });

      // 4. Clean frontend local mirroring perfectly smoothly
      setParticipantsInfo(prev => ({ ...prev, [newUserId]: { uid: newUserId, email: newUserEmail } }));
      
      const newPlanState = { ...plan };
      newPlanState.participants.push(newUserId);
      if (!newPlanState.roles) newPlanState.roles = {};
      newPlanState.roles[newUserId] = inviteRole;
      setPlan(newPlanState);

      setInviteSuccess(`${inviteEmail} added successfully!`);
      setInviteEmail('');  // Purge text
      
    } catch (err) {
       console.error("Encountered inviting exception:", err);
       setInviteError("Error transmitting invitation parameters to Firebase.");
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

  const isOwner = plan?.roles?.[currentUser.uid] === 'owner' || false;

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
             <div className="flex items-center gap-3 mb-2">
                 <h2 className="text-4xl font-extrabold text-slate-800">{plan.title}</h2>
                 <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap mt-1 ${
                    plan.status === 'upcoming' ? 'bg-amber-100 text-amber-800' :
                    plan.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-slate-100 text-slate-800'
                 }`}>
                    {plan.status || 'Draft'}
                 </span>
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
                  isOwner={isOwner} 
                  participantsInfo={participantsInfo} 
              />
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">
                Participants
                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{plan.participants?.length || 0}</span>
              </h3>
              
              <ul className="space-y-3">
                 {plan.participants?.map(uid => {
                    const info = participantsInfo[uid];
                    const email = info?.email || uid;
                    const role = plan.roles?.[uid] || 'participant';

                    return (
                        <li key={uid} className="flex items-center justify-between gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                           <div className="flex items-center gap-3 overflow-hidden">
                             <div className="h-8 w-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0 uppercase border border-indigo-200">
                                {email.substring(0, 2)}
                             </div>
                             <div className="text-sm font-medium text-slate-700 truncate min-w-0">
                                {email}
                                {uid === currentUser.uid && <span className="text-xs text-slate-400 font-normal ml-1">(You)</span>}
                             </div>
                           </div>
                           <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md uppercase font-semibold tracking-wider shrink-0">
                             {role}
                           </span>
                        </li>
                    )
                 })}
              </ul>
              
              {/* Conditional Inviting Tool restricted exclusively to owners */}
              {isOwner && (
                 <div className="mt-6 pt-5 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 mb-3">Invite User</h4>
                    
                    {inviteError && <p className="text-xs font-medium text-red-600 mb-3 bg-red-50 p-2 rounded">{inviteError}</p>}
                    {inviteSuccess && <p className="text-xs font-medium text-emerald-700 mb-3 bg-emerald-50 p-2 rounded">{inviteSuccess}</p>}
                    
                    <form onSubmit={handleInvite} className="flex flex-col gap-2.5 relative">
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
                           <option value="owner">Owner</option>
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
    </div>
  );
}
