import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * usePlan orchestrates the primary document fetching, participant hydration, and lifecycle functions.
 * @param {string} planId 
 * @param {string} currentUserUid 
 */
export default function usePlan(planId, currentUserUid) {
  const [plan, setPlan] = useState(null);
  const [participantsInfo, setParticipantsInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Primary Fetcher
  useEffect(() => {
    let isMounted = true;
    
    async function fetchPlan() {
      if (!planId || !currentUserUid) {
        if (isMounted) setLoading(false);
        return;
      }
      
      try {
        const docRef = doc(db, 'plans', planId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          if (isMounted) {
            setError("Plan not found. It may have been deleted.");
            setLoading(false);
          }
          return;
        }

        const planData = docSnap.data();
        if (!planData.participants?.includes(currentUserUid)) {
           if (isMounted) {
             setError("You do not have permission to view this plan.");
             setPlan(null);
             setLoading(false);
           }
           return;
        } 
        
        if (isMounted) {
          setPlan({ id: docSnap.id, ...planData });
          setError('');
        }

        // Hydrate participant profile data
        const infoMap = {};
        await Promise.all((planData.participants || []).map(async (uid) => {
           const userSnap = await getDoc(doc(db, 'users', uid));
           if (userSnap.exists()) {
              infoMap[uid] = userSnap.data();
           } else {
              infoMap[uid] = { email: "Unknown User", uid };
           }
        }));

        if (isMounted) {
          setParticipantsInfo(infoMap);
        }
      } catch (err) {
        console.error("Fetch Details Error:", err);
        if (isMounted) setError("Error loading plan details from database.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPlan();
    
    return () => { isMounted = false; };
  }, [planId, currentUserUid]);


  // Direct Mutators (Proxy to Firestore)
  const updatePlan = async (updates) => {
    if (!planId) return;
    const planRef = doc(db, 'plans', planId);
    await updateDoc(planRef, updates);
    setPlan(prev => ({ ...prev, ...updates }));
  };

  const deletePlanDb = async () => {
    if (!planId) return;
    await deleteDoc(doc(db, 'plans', planId));
  };

  const leavePlan = async () => {
    if (!planId || !currentUserUid || !plan) return;
    const planRef = doc(db, 'plans', planId);
    const updatedRoles = { ...plan.roles };
    delete updatedRoles[currentUserUid];

    await updateDoc(planRef, {
      participants: arrayRemove(currentUserUid),
      roles: updatedRoles
    });
  };

  const inviteUser = async (email, role) => {
    if (!planId || !email) return { error: "No email provided." };
    
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { error: "User not found. They must sign up first." };
      }

      let newUserId = null;
      let newUserData = null;
      querySnapshot.forEach((d) => {
        newUserId = d.data().uid;
        newUserData = d.data();
      });

      if (plan.participants?.includes(newUserId)) {
         return { error: "User is already a participant." };
      }

      await updatePlan({
        participants: arrayUnion(newUserId),
        [`roles.${newUserId}`]: role
      });

      setParticipantsInfo(prev => ({ ...prev, [newUserId]: newUserData }));
      return { success: true, message: `${email} added as ${role}!` };
      
    } catch (err) {
       console.error("Invite error:", err);
       return { error: "Failed to invite user." };
    }
  };

  return { plan, participantsInfo, loading, error, updatePlan, deletePlanDb, leavePlan, inviteUser };
}
