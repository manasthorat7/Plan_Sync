import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function PlanDetails() {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPlan() {
      try {
        const docRef = doc(db, 'plans', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const planData = docSnap.data();
          // Security check constraint: Protect document against unauthorized direct UUID links
          if (!planData.participants?.includes(currentUser.uid)) {
             setError("You do not have permission to view this plan.");
             setPlan(null);
          } else {
             setPlan({ id: docSnap.id, ...planData });
             setError('');
          }
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
      fetchPlan();
    }
  }, [id, currentUser]);

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

      {/* Grid Architecture Implementation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Main Interface Window */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[300px]">
              <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Itinerary Overview</h3>
              <div className="flex flex-col items-center justify-center text-slate-400 py-12">
                 <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                 </svg>
                 <p>Modular logic mapping layout will reside here.</p>
              </div>
           </div>
        </div>

        {/* Sidebar Attributes Layer */}
        <div className="space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">
                Participants
                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{plan.participants.length}</span>
              </h3>
              <ul className="space-y-3">
                 {plan.participants.map(uid => (
                    <li key={uid} className="flex items-center gap-3">
                       <div className="h-8 w-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                          {uid.substring(0, 2).toUpperCase()}
                       </div>
                       <div className="text-sm font-medium text-slate-700 truncate">
                          {uid === currentUser.uid ? 'You (Creator)' : uid}
                       </div>
                    </li>
                 ))}
              </ul>
              
              <button className="mt-5 w-full flex justify-center items-center gap-2 py-2 border border-dashed border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:text-primary hover:border-primary hover:bg-indigo-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  Invite Members
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
