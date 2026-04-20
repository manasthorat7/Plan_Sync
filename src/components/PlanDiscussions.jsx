import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { usePlanContext } from '../context/PlanContext';
import useFirestoreSync from '../hooks/useFirestoreSync';
import GlassCard from './GlassCard';

export default function PlanDiscussions() {
  const { plan, currentUserUid, participantsInfo, permissions } = usePlanContext();
  
  const [newMessage, setNewMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Hooking up the custom Firestore Real-Time sync
  const queryRef = useMemo(() => {
     if (!plan?.id) return null;
     return query(
        collection(db, 'plans', plan.id, 'comments'),
        orderBy('createdAt', 'asc')
     );
  }, [plan?.id]);

  const { data: comments, loading } = useFirestoreSync(queryRef);

  // Autoscroll mechanics
  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newMessage.trim() || !plan?.id) return;

    try {
      await addDoc(collection(db, 'plans', plan.id, 'comments'), {
        text: newMessage.trim(),
        authorId: currentUserUid,
        createdAt: serverTimestamp()
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error posting comment securely:", err);
    }
  }

  async function handleUpdate(commentId) {
    if (!editMessage.trim() || !plan?.id) return;

    try {
      await updateDoc(doc(db, 'plans', plan.id, 'comments', commentId), {
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
      await deleteDoc(doc(db, 'plans', plan.id, 'comments', commentId));
    } catch (err) {
      console.error("Error executing comment destruction command:", err);
    }
  }

  return (
    <GlassCard className="flex flex-col h-[500px]">
      <div className="p-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Discussion</h3>
        <span className="text-xs text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 bg-white/40 dark:bg-white/10 rounded-full shadow-sm">{comments.length} Messages</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent">
        {loading ? (
           <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
           </div>
        ) : comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
             <svg className="w-10 h-10 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
             <p className="text-sm font-bold shadow-sm">No messages yet.</p>
             <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          comments.map(comment => {
            const isAuthor = comment.authorId === currentUserUid;
            const authorEmail = participantsInfo[comment.authorId]?.email || "Unknown User";

            return (
              <div key={comment.id} className={`flex flex-col ${isAuthor ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 drop-shadow-sm">
                    {isAuthor ? 'You' : authorEmail}
                  </span>
                  {comment.updatedAt && <span className="text-[10px] text-slate-500 dark:text-slate-500 italic">(edited)</span>}
                </div>

                {editingId === comment.id ? (
                  <div className="w-full max-w-[80%] bg-white/60 dark:bg-black/40 backdrop-blur-md border border-primary p-3 rounded-2xl shadow-md">
                    <textarea 
                      className="w-full text-sm outline-none resize-none mb-2 text-slate-800 dark:text-slate-200 font-bold bg-transparent placeholder-slate-500"
                      rows={2}
                      value={editMessage}
                      onChange={e => setEditMessage(e.target.value)}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                       <button onClick={() => setEditingId(null)} className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-colors">Cancel</button>
                       <button onClick={() => handleUpdate(comment.id)} className="text-xs bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-500/30 transition-all shadow-sm">Save Updates</button>
                    </div>
                  </div>
                ) : (
                  <div className={`group relative w-fit max-w-[85%] px-4 py-2.5 rounded-3xl text-sm shadow-md backdrop-blur-sm ${isAuthor ? 'bg-gradient-to-br from-primary to-purple-600 text-white rounded-br-sm' : 'bg-white/60 dark:bg-black/30 border border-white/40 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-bl-sm font-medium'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                    
                    {isAuthor && permissions.canDiscuss && (
                      <div className={`absolute top-0 flex gap-0.5 bg-white/70 dark:bg-black/50 backdrop-blur-md p-1 rounded-xl border border-white/30 dark:border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -mt-4 ${isAuthor ? '-left-14' : '-right-14'}`}>
                        <button 
                          onClick={() => { setEditingId(comment.id); setEditMessage(comment.text); }}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit Message"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(comment.id)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Message"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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

      <div className="p-3 bg-white/30 dark:bg-black/30 backdrop-blur-md border-t border-white/20 dark:border-white/10 rounded-b-2xl">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 bg-white/50 dark:bg-white/10 border border-white/40 dark:border-white/10 focus:border-primary dark:focus:border-primary focus:bg-white/80 dark:focus:bg-black/40 focus:ring-2 focus:ring-indigo-500/20 rounded-full text-sm outline-none transition-all placeholder-slate-500 font-bold text-slate-800 dark:text-slate-100 disabled:opacity-50 shadow-inner"
            placeholder={!permissions.canDiscuss ? "Discussion is locked." : "Write a message..."}
            value={newMessage}
            disabled={!permissions.canDiscuss}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || !permissions.canDiscuss}
            className="p-2.5 bg-gradient-to-r from-primary to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full transition-all shadow-md hover:scale-110 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 pl-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </button>
        </form>
      </div>
    </GlassCard>
  );
}
