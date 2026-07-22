const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

// Helper to handle response and errors
const handleResponse = async (res) => {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `API error (status: ${res.status})`);
  }
  return res.json();
};

// Helper for headers (adding JWT token if available)
const getHeaders = () => {
  const token = localStorage.getItem('event_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Authentication
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('event_token', data.token);
    }
    return data;
  },

  register: async (email, password, fullName, role) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, role })
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  forgotPassword: async (email) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  resetPassword: async (token, newPassword) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    return handleResponse(res);
  },

  logout: () => {
    localStorage.removeItem('event_token');
  },

  // Providers
  getProviders: async (filters = {}) => {
    const query = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) query.append(key, filters[key]);
    });
    const res = await fetch(`${API_BASE}/providers?${query.toString()}`);
    return handleResponse(res);
  },

  getProviderDetails: async (id) => {
    const res = await fetch(`${API_BASE}/providers/${id}`);
    return handleResponse(res);
  },

  onboardProvider: async (profileData) => {
    const res = await fetch(`${API_BASE}/providers/onboard`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(res);
  },

  // Portfolios
  addPortfolioItem: async (itemData) => {
    const res = await fetch(`${API_BASE}/portfolios`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(itemData)
    });
    return handleResponse(res);
  },

  deletePortfolioItem: async (id) => {
    const res = await fetch(`${API_BASE}/portfolios/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Bookings
  createBooking: async (bookingData) => {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bookingData)
    });
    return handleResponse(res);
  },

  getBookings: async () => {
    const res = await fetch(`${API_BASE}/bookings`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  updateBookingStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  payBooking: async (bookingId, paymentData) => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/pay`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(paymentData)
    });
    return handleResponse(res);
  },

  markBookingCashPaid: async (bookingId) => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/cash-paid`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getStats: async () => {
    const res = await fetch(`${API_BASE}/stats`);
    return handleResponse(res);
  },

  submitReview: async (providerId, rating, comment, bookingId) => {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ providerId, rating, comment, bookingId })
    });
    return handleResponse(res);
  },



  // AI Recommendations
  generateRecommendation: async (criteria) => {
    const res = await fetch(`${API_BASE}/recommendations/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(criteria)
    });
    return handleResponse(res);
  },

  getMyQuotes: async () => {
    const res = await fetch(`${API_BASE}/recommendations/my-quotes`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Support Tickets
  createTicket: async (subject, message) => {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ subject, message })
    });
    return handleResponse(res);
  },

  getTickets: async () => {
    const res = await fetch(`${API_BASE}/tickets`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  respondTicket: async (id, response) => {
    const res = await fetch(`${API_BASE}/tickets/${id}/respond`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ response })
    });
    return handleResponse(res);
  },

  // Admin Dashboard
  getAdminUsers: async () => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  deleteAdminUser: async (id) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getAdminProviders: async () => {
    const res = await fetch(`${API_BASE}/admin/providers`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  updateProviderStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/admin/providers/${id}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  getAdminBookings: async () => {
    const res = await fetch(`${API_BASE}/admin/bookings`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getAdminSettings: async () => {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  updateAdminSettings: async (platformFee) => {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ platformFee })
    });
    return handleResponse(res);
  },

  getAdminStats: async () => {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Live Chat API
  getMessages: async (bookingId) => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/messages`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Stripe Checkout API
  createStripeCheckoutSession: async (bookingId, successUrl, cancelUrl) => {
    const res = await fetch(`${API_BASE}/payments/create-checkout-session`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ bookingId, successUrl, cancelUrl })
    });
    return handleResponse(res);
  },

  confirmStripePayment: async (bookingId, session_id) => {
    const res = await fetch(`${API_BASE}/payments/confirm-payment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ bookingId, session_id })
    });
    return handleResponse(res);
  },

  // Timeline Update API
  saveEditedQuotation: async (quotationId, itemizedBreakdown) => {
    const res = await fetch(`${API_BASE}/recommendations/quotations/${quotationId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ itemizedBreakdown })
    });
    return handleResponse(res);
  }
};
