// firebase/firestore/use-collection.tsx
'use client';
import { useState, useEffect } from 'react';
import {
  onSnapshot,
  query,
  type CollectionReference,
  type Query,
  type DocumentData,
} from 'firebase/firestore';

export function useCollection<T extends DocumentData>(
  q: Query | CollectionReference | null
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const memoizedQuery = q;

  useEffect(() => {
    if (!memoizedQuery) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (querySnapshot) => {
        const docs = querySnapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id } as T)
        );
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to collection:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery?.path]); // Use path for dependency to avoid object reference issues

  return { data, loading, error };
}
