const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function sendOtp(phone) {
  const res = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send OTP');
  }
  return data;
}

export async function verifyOtp(phone, code, name) {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code, name }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to verify OTP');
  }
  return data;
}

export async function getPlans(userId) {
  const res = await fetch(`${API_BASE}/plans?user_id=${userId}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load plans');
  }
  return data.plans;
}

export async function createPlan(planData) {
  const res = await fetch(`${API_BASE}/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(planData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create plan');
  }
  return data;
}

export async function togglePlan(planId) {
  const res = await fetch(`${API_BASE}/plans/${planId}/toggle`, {
    method: 'PATCH',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to toggle plan');
  }
  return data;
}
