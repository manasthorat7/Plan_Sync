import { useState, useCallback } from 'react';

/**
 * useToggle returns a stateful value and a function to toggle it.
 * @param {boolean} initialState
 * @returns {[boolean, () => void]}
 */
export default function useToggle(initialState = false) {
  const [state, setState] = useState(initialState);
  const toggle = useCallback(() => setState((prev) => !prev), []);
  return [state, toggle];
}
