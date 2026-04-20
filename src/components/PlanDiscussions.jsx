import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

export default function PlanDiscussions({ planId, currentUser, participantsInfo, isFinalized }) {
  const [comments, setComments] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Real-time synchronization layer maintaining premium feeling application scope via onSnapshot
  useEffect(() => {
    const q = query(
      collection(db, 'plans', planId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [planId]);

  // Autoscroll mechanics
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'plans', planId, 'comments'), {
        text: newMessage.trim(),
        authorId: currentUser.uid,
        createdAt: serverTimestamp()
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error posting comment securely:", err);
    }
  }

  async function handleUpdate(commentId) {
    if (!editMessage.trim()) return;

    try {
      await updateDoc(doc(db, 'plans', planId, 'comments', commentId), {
        text: editMessage.trim(),
        updatedAt: serverTimestamp()
      });
      setEditingId(null);
      setEditMessage("");
    } catch (err) {
      console.error("Error patching designated comment:", err);
    }
  }

  async function handleDelete(commentId) {
    if (!window.confirm("Are you sure you want to permanently delete this message?")) return;
    
    try {
      await deleteDoc(doc(db, 'plans', planId, 'comments', commentId));
    } catch (err) {
      console.error("Error executing comment destruction command:", err);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Discussion</h3>
        <span className="text-xs text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded-full">{comments.length} Messages</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
             <svg className="w-10 h-10 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
             <p className="text-sm font-medium">No messages yet.</p>
             <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          comments.map(comment => {
            const isAuthor = comment.authorId === currentUser.uid;
            const authorEmail = participantsInfo[comment.authorId]?.email || "Unknown User";

            return (
              <div key={comment.id} className={`flex flex-col ${isAuthor ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className="text-xs font-semibold text-slate-500">
                    {isAuthor ? 'You' : authorEmail}
                  </span>
                  {comment.updatedAt && <span className="text-[10px] text-slate-400 italic">(edited)</span>}
                </div>

                {editingId === comment.id ? (
                  <div className="w-full max-w-[80%] bg-white border border-primary p-3 rounded-xl shadow-sm">
                    <textarea 
                      className="w-full text-sm outline-none resize-none mb-2 text-slate-700 font-medium bg-transparent"
                      rows={2}
                      value={editMessage}
                      onChange={e => setEditMessage(e.target.value)}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                       <button onClick={() => setEditingId(null)} className="text-xs text-slate-500 hover:text-slate-700 font-medium">Cancel</button>
                       <button onClick={() => handleUpdate(comment.id)} className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1.5 rounded hover:bg-indigo-100 transition-colors">Save Updates</button>
                    </div>
                  </div>
                ) : (
                  <div className={`group relative w-fit max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isAuthor ? 'bg-primary text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                    
                    {/* Hover Operational Modals cleanly separated from main structure preventing layout disruptions */}
                    {isAuthor && !isFinalized && (
                      <div className={`absolute top-0 flex gap-0.5 bg-white backdrop-blur-sm p-1 rounded-lg border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity -mt-4 ${isAuthor ? '-left-14' : '-right-14'}`}>
                        <button 
                          onClick={() => { setEditingId(comment.id); setEditMessage(comment.text); }}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded transition-colors"
                          title="Edit Message"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(comment.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete Message"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Aesthetic messaging prompt mapped tightly into the flex-col constraints ensuring padding looks premium */}
      <div className="p-3 bg-white border-t border-slate-100 rounded-b-xl">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-full text-sm outline-none transition-all placeholder-slate-400 font-medium text-slate-700 disabled:opacity-50 disabled:bg-slate-100"
            placeholder={isFinalized ? "Plan is finalized. Discussion locked." : "Write a message..."}
            value={newMessage}
            disabled={isFinalized}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || isFinalized}
            className="p-2.5 bg-primary hover:bg-indigo-600 text-white rounded-full transition-all shadow-sm disabled:opacity-50 disabled:hover:bg-primary disabled:cursor-not-allowed hover:shadow hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 pl-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
