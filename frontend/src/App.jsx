import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import PlannerPage from './pages/PlannerPage';
import AddPlanPage from './pages/AddPlanPage';
import './App.css';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('study_planner_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentPage, setCurrentPage] = useState('planner'); // 'planner' | 'add'

  useEffect(() => {
    if (user) {
      localStorage.setItem('study_planner_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('study_planner_user');
    }
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('planner');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('planner');
  };

  // If not logged in, render Page 1 (AuthPage)
  if (!user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // If logged in, switch between Page 2 (PlannerPage) and Page 3 (AddPlanPage)
  if (currentPage === 'add') {
    return (
      <AddPlanPage
        user={user}
        onPlanCreated={() => setCurrentPage('planner')}
        onCancel={() => setCurrentPage('planner')}
      />
    );
  }

  return (
    <PlannerPage
      user={user}
      onNavigateToAdd={() => setCurrentPage('add')}
      onLogout={handleLogout}
    />
  );
}
