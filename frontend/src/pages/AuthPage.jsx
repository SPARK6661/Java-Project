import React, { useState } from 'react';
import { sendOtp, verifyOtp } from '../api';

export default function AuthPage({ onLoginSuccess }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const data = await sendOtp(phone);
      setStep(2);
      setInfo(data.message || 'OTP sent! Please check your WhatsApp/SMS.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the 6-digit OTP code');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await verifyOtp(phone, code, name);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-badge">📚 Workshop Edition</div>
          <h1 className="auth-title">Study Planner</h1>
          <p className="auth-subtitle">
            Minimalist study schedule powered by <strong>Minimoth OTP</strong> auth.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {info && <div className="alert alert-info">{info}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="form-group">
            <label className="input-label" htmlFor="phone-input">Phone Number</label>
            <div className="input-wrapper">
              <input
                id="phone-input"
                type="tel"
                className="input-field"
                placeholder="e.g. 9812345678 or +91..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
                disabled={loading}
              />
            </div>
            <p className="help-text">
              Minimoth delivers OTP via WhatsApp first, with SMS fallback.
            </p>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send Verification Code →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="form-group">
            <div className="phone-tag">
              <span>Code sent to <strong>{phone}</strong></span>
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setInfo('');
                }}
              >
                Change
              </button>
            </div>

            <label className="input-label" htmlFor="otp-input">6-Digit OTP</label>
            <input
              id="otp-input"
              type="text"
              maxLength={6}
              className="input-field code-input"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              disabled={loading}
            />

            <label className="input-label" htmlFor="name-input">Your Name (Optional)</label>
            <input
              id="name-input"
              type="text"
              className="input-field"
              placeholder="e.g. Aditi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Enter Planner →'}
            </button>

            <div className="sandbox-hint">
              💡 Workshop demo tip: If testing locally without SMS, enter <code>123456</code>.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
