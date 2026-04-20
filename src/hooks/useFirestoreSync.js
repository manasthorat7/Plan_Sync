import { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';

/**
 * useFirestoreSync encapsulates onSnapshot logic for real-time reads.
 * @param {import('firebase/firestore').Query} queryRef 
 * @returns {{ data: Array, loading: boolean, error: string | null }}
 */
export default function useFirestoreSync(queryRef) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!queryRef) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(queryRef, 
      (snapshot) => {
        const docs = [];
        snapshot.forEach((doc) => {
          docs.push({ id: doc.id, ...doc.data() });
        });
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("useFirestoreSync Error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [queryRef]);

  return { data, loading, error };
}
