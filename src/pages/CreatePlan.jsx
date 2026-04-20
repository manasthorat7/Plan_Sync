import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import AIHelperModal from '../components/AIHelperModal';

export default function CreatePlan() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleAIApply = useCallback(({ title: aiTitle, description: aiDesc }) => {
    setTitle(aiTitle);
    setDescription(aiDesc);
  }, []);

  // Debug function — test raw Firestore connectivity
  async function testFirestore() {
    console.log("🧪 Testing Firestore connection...");
    console.log("🧪 db object:", db);
    console.log("🧪 auth.currentUser:", auth.currentUser);
    try {
      const ref = await addDoc(collection(db, "test"), {
        message: "Firestore connectivity test",
        time: new Date(),
        uid: auth.currentUser?.uid || "no-user",
      });
      console.log("✅ Test write SUCCESS — doc ID:", ref.id);
      alert("✅ Firestore works! Doc ID: " + ref.id);
    } catch (e) {
      console.error("❌ Test write FAILED:", e);
      console.error("❌ Error code:", e.code);
      console.error("❌ Error message:", e.message);
      alert("❌ Firestore test failed: " + e.code + " — " + e.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      return setError('Plan title is required.');
    }

    if (!currentUser) {
      return setError('You must be logged in to create a plan.');
    }

    console.log("📝 Starting plan creation...");
    console.log("📝 currentUser.uid:", currentUser.uid);
    console.log("📝 db instance:", db);

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

      console.log("📝 Plan payload:", JSON.stringify(planData, null, 2));
      console.log("📝 Calling addDoc now...");

      const docRef = await addDoc(collection(db, 'plans'), planData);

      console.log("✅ Plan created successfully! ID:", docRef.id);
      navigate('/');
    } catch (err) {
      console.error("🔥 FIRESTORE WRITE ERROR:", err);
      console.error("🔥 Error code:", err.code);
      console.error("🔥 Error message:", err.message);
      console.error("🔥 Full error object:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
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

        {/* Generative Intelligence UI Drop Block */}
        <AIHelperModal onApply={handleAIApply} />

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        {/* Debug button — remove after confirming Firestore works */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700 font-medium mb-2">🛠️ Debug: Test if Firestore can accept writes</p>
          <button
            type="button"
            onClick={testFirestore}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Test Firestore Write
          </button>
        </div>

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
