import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CreatePlan() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      return setError('Plan title is required.');
    }

    if (!currentUser) {
      return setError('You must be logged in to create a plan.');
    }

    try {
      setError('');
      setLoading(true);

      const planData = {
        title: title.trim(),
        description: description.trim(),
        participants: [currentUser.uid],
        roles: {
          [currentUser.uid]: 'owner'
        },
        status: 'draft',
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'plans'), planData);
      console.log("Plan created with ID:", docRef.id);
      navigate('/');
    } catch (err) {
      console.error("Firestore write error:", err);
      setError('Failed to create plan: ' + (err.code ? `[${err.code}] ` : '') + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 mt-4">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-medium text-purple-200 dark:text-slate-400 hover:text-white flex items-center transition-colors mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back
        </button>
        <h2 className="text-3xl font-bold text-white">Create New Plan</h2>
        <p className="text-purple-200 dark:text-slate-400 mt-1 font-medium">Set up the foundations for a new group itinerary.</p>
      </div>

      <div className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 p-8">
        {error && (
          <div className="bg-red-500/20 text-red-200 p-4 rounded-xl text-sm mb-6 border border-red-500/30 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-purple-200 dark:text-slate-400 mb-1" htmlFor="title">
              Plan Title
            </label>
            <input
              id="title"
              type="text"
              required
              className="w-full px-4 py-2.5 border border-white/20 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all bg-white/10 dark:bg-white/5 text-white placeholder-white/40 font-medium backdrop-blur"
              placeholder="e.g. Summer Road Trip 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 dark:text-slate-400 mb-1" htmlFor="description">
              Description (Optional)
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full px-4 py-2.5 border border-white/20 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all bg-white/10 dark:bg-white/5 text-white placeholder-white/40 font-medium backdrop-blur resize-none"
              placeholder="Brief overview of what this plan entails..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 text-purple-200 dark:text-slate-400 font-bold hover:bg-white/10 rounded-xl transition-all border border-white/10"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all shadow-lg hover:scale-[1.02]"
            >
              {loading ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
