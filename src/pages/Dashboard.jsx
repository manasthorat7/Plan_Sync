import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SkeletonCard from '../components/SkeletonCard';
import GlassCard from '../components/GlassCard';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Dashboard() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'head_owner': return { label: 'Head Owner', className: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30' };
      case 'owner': return { label: 'Owner', className: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30' };
      case 'editor': return { label: 'Editor', className: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30' };
      default: return { label: 'Viewer', className: 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30' };
    }
  };

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
          <h2 className="text-3xl font-extrabold text-white drop-shadow-sm">Your Plans</h2>
          <p className="text-purple-200 dark:text-slate-400 mt-1 font-medium">Manage and collaborate on your group itineraries.</p>
        </div>
        <Link to="/create-plan" className="flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl shadow-md font-medium transition-all hover:scale-105 hover:shadow-lg whitespace-nowrap">
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
           {/* Assume Skeleton remains consistent for now / we can glass it later */}
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : plans.length === 0 ? (
         <GlassCard className="p-12 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-white/20 dark:bg-black/20 rounded-full flex items-center justify-center mb-4 shadow-sm backdrop-blur">
                <svg className="h-8 w-8 text-purple-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">No plans yet</h3>
            <p className="text-purple-200 dark:text-slate-400 mb-6 font-medium">You aren't a part of any active plans right now.</p>
            <Link to="/create-plan" className="bg-gradient-to-r from-primary to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105 shadow-md">
              Create your first plan
            </Link>
         </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Link to={`/plan/${plan.id}`} key={plan.id} className="block group">
              <GlassCard className="overflow-hidden cursor-pointer flex flex-col h-full hover:-translate-y-1 hover:shadow-2xl hover:border-white/40 dark:hover:border-white/20">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white line-clamp-2 pr-2">{plan.title}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-sm border ${
                      plan.status === 'finalized' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' :
                      'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    }`}>
                      {plan.status === 'finalized' ? '🔒 Locked' : plan.status || 'Draft'}
                    </span>
                  </div>
                  {plan.description && <p className="text-purple-200 dark:text-slate-400 text-sm mb-4 line-clamp-2 font-medium">{plan.description}</p>}
                </div>
                <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md px-6 py-4 border-t border-white/20 dark:border-white/10 flex items-center justify-between transition-colors">
                  <div className="flex items-center text-purple-200 dark:text-slate-400 text-sm font-bold">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    {plan.participants?.length || 1} participant{plan.participants?.length !== 1 ? 's' : ''}
                  </div>
                  {(() => {
                    const role = plan.roles?.[currentUser.uid] || 'viewer';
                    const badge = getRoleBadge(role);
                    return (
                      <span className={`text-[10px] border px-2.5 py-1 rounded-md uppercase font-extrabold tracking-wider shadow-sm ${badge.className}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
