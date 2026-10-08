import React, { useState } from 'react';
import { createPlan } from '../api';

const COLOR_PALETTE = [
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Purple', hex: '#9333ea' },
];

const PRESET_DURATIONS = [25, 45, 60, 90];

export default function AddPlanPage({ user, onPlanCreated, onCancel }) {
  const today = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectColor, setSubjectColor] = useState(COLOR_PALETTE[0].hex);
  const [targetDate, setTargetDate] = useState(today);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !subjectName.trim() || !targetDate) {
      setError('Please provide title, subject, and target date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createPlan({
        user_id: user.id,
        title: title.trim(),
        subject_name: subjectName.trim(),
        subject_color: subjectColor,
        target_date: targetDate,
        duration_minutes: Number(durationMinutes) || 30,
      });
      onPlanCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Top Bar */}
      <header className="navbar">
        <div className="nav-brand">
          <button onClick={onCancel} className="btn-back">
            ← Back to Schedule
          </button>
        </div>
        <div className="user-profile">
          <span className="user-badge">👤 {user.name}</span>
        </div>
      </header>

      <main className="main-content">
        <div className="form-card">
          <div className="form-header">
            <h2 className="form-title">Plan New Study Session</h2>
            <p className="form-subtitle">
              Set a focused goal, choose your subject, and block out time.
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="form-group">
            {/* Title */}
            <div>
              <label className="input-label" htmlFor="plan-title">
                Session Goal / Topic *
              </label>
              <input
                id="plan-title"
                type="text"
                className="input-field"
                placeholder="e.g. Chapter 4 Practice Questions"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Subject */}
            <div>
              <label className="input-label" htmlFor="subject-name">
                Subject / Course *
              </label>
              <input
                id="subject-name"
                type="text"
                className="input-field"
                placeholder="e.g. Physics, Calculus, Literature"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Color Swatch */}
            <div>
              <label className="input-label">Subject Color Tag</label>
              <div className="color-swatches">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    className={`color-dot ${subjectColor === c.hex ? 'active' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setSubjectColor(c.hex)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Target Date & Duration Row */}
            <div className="form-row">
              <div className="form-col">
                <label className="input-label" htmlFor="target-date">
                  Target Date *
                </label>
                <input
                  id="target-date"
                  type="date"
                  className="input-field"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-col">
                <label className="input-label" htmlFor="duration">
                  Duration (Minutes)
                </label>
                <div className="duration-picker">
                  {PRESET_DURATIONS.map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      className={`dur-chip ${durationMinutes === dur ? 'active' : ''}`}
                      onClick={() => setDurationMinutes(dur)}
                    >
                      {dur}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving Plan...' : 'Save Study Plan ✓'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
