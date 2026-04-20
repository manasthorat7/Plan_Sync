import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();

  // If the user is missing, instantly divert to the Auth pages.
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // User is present, proceed rendering the secure component.
  return children;
}
