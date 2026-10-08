import React, { useState, useEffect } from 'react';
import { getPlans, togglePlan } from '../api';

export default function PlannerPage({ user, onNavigateToAdd, onLogout }) {
  const [plans, setPlans] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await getPlans(user.id);
      setPlans(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [user.id]);

  const handleToggle = async (planId) => {
    // Optimistic UI update
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, is_completed: !p.is_completed } : p))
    );

    try {
      await togglePlan(planId);
    } catch (err) {
      // Revert if error
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, is_completed: !p.is_completed } : p))
      );
      setError('Could not update status: ' + err.message);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (filter === 'pending') return !p.is_completed;
    if (filter === 'completed') return p.is_completed;
    return true;
  });

  const totalMinutes = plans.reduce((acc, p) => acc + (p.duration_minutes || 0), 0);
  const completedCount = plans.filter((p) => p.is_completed).length;

  return (
    <div className="page-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">📖</span>
          <span className="brand-name">Study Planner</span>
        </div>
        <div className="user-profile">
          <span className="user-badge">
            👤 {user.name} <small>({user.phone})</small>
          </span>
          <button onClick={onLogout} className="btn-logout" title="Log out">
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Banner with stats */}
        <section className="dashboard-summary">
          <div className="summary-card">
            <span className="summary-label">Total Sessions</span>
            <span className="summary-value">{plans.length}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Completed</span>
            <span className="summary-value highlight-green">{completedCount}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Focus Time</span>
            <span className="summary-value highlight-blue">{totalMinutes}m</span>
          </div>
        </section>

        {/* Action & Filter Bar */}
        <div className="action-bar">
          <div className="filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({plans.length})
            </button>
            <button
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({plans.length - completedCount})
            </button>
            <button
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({completedCount})
            </button>
          </div>

          <button onClick={onNavigateToAdd} className="btn btn-primary btn-add">
            + Plan New Session
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Plans List */}
        <section className="plans-section">
          {loading ? (
            <div className="empty-state">Loading your study schedule...</div>
          ) : filteredPlans.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">
                {filter === 'completed'
                  ? 'No completed sessions yet. Keep studying!'
                  : 'No study plans found.'}
              </p>
              <p className="empty-sub">
                Click "+ Plan New Session" to schedule your next study target.
              </p>
            </div>
          ) : (
            <div className="plans-grid">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`plan-card ${plan.is_completed ? 'completed' : ''}`}
                  onClick={() => handleToggle(plan.id)}
                >
                  <div className="plan-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={plan.is_completed}
                      onChange={() => handleToggle(plan.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="custom-checkbox"
                    />
                  </div>

                  <div className="plan-details">
                    <div className="plan-meta">
                      <span
                        className="subject-pill"
                        style={{ backgroundColor: plan.subject_color }}
                      >
                        {plan.subject_name}
                      </span>
                      <span className="duration-pill">⏱ {plan.duration_minutes}m</span>
                      <span className="date-pill">📅 {plan.target_date}</span>
                    </div>
                    <h3 className="plan-title">{plan.title}</h3>
                  </div>

                  <div className="status-indicator">
                    {plan.is_completed ? (
                      <span className="status-badge done">Done ✓</span>
                    ) : (
                      <span className="status-badge pending">To Do</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
