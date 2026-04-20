import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SkeletonCard from '../components/SkeletonCard';
import { getRoleBadge } from '../utils/permissions';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Dashboard() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    async function fetchPlans() {
      try {
        const plansRef = collection(db, 'plans');
        // Fetch plans where the current user is listed inside the participants array
        const q = query(plansRef, where('participants', 'array-contains', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const fetchedPlans = [];
        querySnapshot.forEach((doc) => {
          fetchedPlans.push({ id: doc.id, ...doc.data() });
        });
        
        setPlans(fetchedPlans);
      } catch (err) {
        console.error("Failed to fetch plans:", err);
        setError("Could not load your plans. Make sure your Firestore database rules are configured.");
      } finally {
        setLoading(false);
      }
    }

    if (currentUser) {
      fetchPlans();
    }
  }, [currentUser]);

  return (
    <div className="max-w-5xl mx-auto p-6 mt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Your Plans</h2>
          <p className="text-slate-600 mt-1">Manage and collaborate on your group itineraries.</p>
        </div>
        <Link to="/create-plan" className="flex items-center gap-2 bg-primary hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-sm font-medium transition-colors whitespace-nowrap">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Create Plan
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : plans.length === 0 ? (
         <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No plans yet</h3>
            <p className="text-slate-500 mb-6">You aren't a part of any active plans right now.</p>
            <Link to="/create-plan" className="bg-primary hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm inline-block">
              Create your first plan
            </Link>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Link to={`/plan/${plan.id}`} key={plan.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-800 line-clamp-2 pr-2">{plan.title}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                    plan.status === 'finalized' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {plan.status === 'finalized' ? '🔒 Locked' : plan.status || 'Draft'}
                  </span>
                </div>
                {plan.description && <p className="text-slate-600 text-sm mb-4 line-clamp-2">{plan.description}</p>}
              </div>
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center text-slate-500 text-sm font-medium">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  {plan.participants?.length || 1} participant{plan.participants?.length !== 1 ? 's' : ''}
                </div>
                {(() => {
                  const role = plan.roles?.[currentUser.uid] || 'viewer';
                  const badge = getRoleBadge(role);
                  return (
                    <span className={`text-[10px] ${badge.bg} border ${badge.border} ${badge.text} px-2 py-0.5 rounded-md uppercase font-semibold tracking-wider`}>
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
