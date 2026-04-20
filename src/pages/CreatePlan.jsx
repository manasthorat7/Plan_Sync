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

    try {
      setError('');
      setLoading(true);

      // Construct document payload strictly adhering to prompt specification requirements
      const planData = {
        title: title.trim(),
        description: description.trim(),
        participants: [currentUser.uid], // Include creator exclusively at init
        roles: {
          [currentUser.uid]: 'owner' // Assign the constructing user explicit ownership map mapping
        },
        status: 'draft',
        createdAt: serverTimestamp(), // Dynamically register server-side instantiation
      };

      await addDoc(collection(db, 'plans'), planData);
      
      // Dispatch securely back to Dashboard rendering timeline
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to create the plan: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 mt-4">
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center transition-colors mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back
        </button>
        <h2 className="text-3xl font-bold text-slate-800">Create New Plan</h2>
        <p className="text-slate-600 mt-1">Set up the foundations for a new group itinerary.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="title">
              Plan Title
            </label>
            <input
              id="title"
              type="text"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 focus:bg-white"
              placeholder="e.g. Summer Road Trip 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="description">
              Description (Optional)
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-slate-50 focus:bg-white resize-none"
              placeholder="Brief overview of what this plan entails..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
