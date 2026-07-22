import React, { useState, useEffect, useRef } from 'react';
import { User, Calendar, Clipboard, Settings, Plus, Trash2, Check, X, Star, FileText, AlertCircle, Shield, CreditCard, Ticket, Edit3, Award, Users, DollarSign, MessageSquare, Send, ChevronLeft, ChevronRight, HelpCircle, Lock } from 'lucide-react';
import { api } from '../utils/api';
import { io } from 'socket.io-client';

export default function Dashboard({ user, setUser }) {
  const [activeTab, setActiveTab] = useState(
    user.role === 'admin' ? 'overview' : user.role === 'provider' ? 'profile' : 'bookings'
  );
  
  // Client States
  const [bookings, setBookings] = useState([]);
  const [savedQuotes, setSavedQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');

  // Invoice Print State
  const [activeInvoice, setActiveInvoice] = useState(null);

  // Provider States
  const [profileData, setProfileData] = useState({
    category: 'volunteer',
    businessName: '',
    description: '',
    basePrice: 1000,
    location: 'Delhi',
    contactPhone: '',
    servicesOffered: '',
    bannerImage: '',
    gstNumber: '',
    panNumber: '',
    aadhaarNumber: '',
    yearsExperience: 0,
    workingHours: '09:00 AM - 07:00 PM',
    website: ''
  });
  const [portfolios, setPortfolios] = useState([]);
  const [providerStatus, setProviderStatus] = useState('pending');
  
  // New Portfolio Form
  const [newPortTitle, setNewPortTitle] = useState('');
  const [newPortDesc, setNewPortDesc] = useState('');
  const [newPortImg, setNewPortImg] = useState('');
  const [newPortPrice, setNewPortPrice] = useState('');

  // Admin States
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminProviders, setAdminProviders] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);
  const [adminTickets, setAdminTickets] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminSettings, setAdminSettings] = useState([]);
  const [replyTicketId, setReplyTicketId] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [platformFeeInput, setPlatformFeeInput] = useState('');

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ success: null, error: null });

  // WebSockets Chat States
  const [socket, setSocket] = useState(null);
  const [activeChatBooking, setActiveChatBooking] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Stripe checkout states
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Review states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Calendar States (Provider Scheduler)
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [blockedDates, setBlockedDates] = useState([]); // Array of 'YYYY-MM-DD' strings

  // Timeline Editor States
  const [editingTimeline, setEditingTimeline] = useState([]);
  const [isSavingTimeline, setIsSavingTimeline] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Initialize socket.io connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:5000');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Listen for socket events when chat room is active
  useEffect(() => {
    if (!socket || !activeChatBooking) return;

    socket.emit('join_room', { bookingId: activeChatBooking.id });

    const handleReceiveMessage = (msg) => {
      if (msg.bookingId === activeChatBooking.id) {
        setChatMessages(prev => [...prev, msg]);
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    // Scroll to bottom
    scrollToBottom();

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, activeChatBooking]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Handle redirect Stripe Payment status verification
  useEffect(() => {
    const checkPaymentRedirect = async () => {
      const hash = window.location.hash;
      if (hash.includes('payment_status=success')) {
        const queryParams = new URLSearchParams(hash.split('?')[1]);
        const bookingId = queryParams.get('bookingId');
        const session_id = queryParams.get('session_id');
        if (bookingId) {
          try {
            setLoading(true);
            await api.confirmStripePayment(bookingId, session_id);
            setFeedback({ success: 'Stripe transaction authorized! Your invoice is marked as PAID.', error: null });
            // Clean hash URL
            window.location.hash = '#dashboard';
          } catch (e) {
            setFeedback({ success: null, error: e.message || 'Payment verification failed' });
          } finally {
            setLoading(false);
            loadDashboardData();
          }
        }
      } else if (hash.includes('payment_status=cancel')) {
        setFeedback({ success: null, error: 'Checkout cancelled. Escrow booking remains unpaid.' });
        window.location.hash = '#dashboard';
      }
    };
    checkPaymentRedirect();
  }, []);

  // Load client/provider/admin details
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (user.role === 'admin') {
        const usersList = await api.getAdminUsers();
        setAdminUsers(usersList);

        const provList = await api.getAdminProviders();
        setAdminProviders(provList);

        const bookList = await api.getAdminBookings();
        setAdminBookings(bookList);

        const ticketList = await api.getTickets();
        setAdminTickets(ticketList);

        const statsData = await api.getAdminStats();
        setAdminStats(statsData);
        setPlatformFeeInput(statsData.platformFeeRate || 100);

        const settingsData = await api.getAdminSettings();
        setAdminSettings(settingsData);
      } else if (user.role === 'provider') {
        const details = await api.getMe();
        if (details.providerProfile) {
          setProfileData({
            category: details.providerProfile.category || 'volunteer',
            businessName: details.providerProfile.business_name || '',
            description: details.providerProfile.description || '',
            basePrice: details.providerProfile.base_price || 1000,
            location: details.providerProfile.location || 'Delhi',
            contactPhone: details.providerProfile.contact_phone || '',
            servicesOffered: details.providerProfile.services_offered || '',
            bannerImage: details.providerProfile.banner_image || '',
            gstNumber: details.providerProfile.gst_number || '',
            panNumber: details.providerProfile.pan_number || '',
            aadhaarNumber: details.providerProfile.aadhaar_number || '',
            yearsExperience: details.providerProfile.years_experience || 0,
            workingHours: details.providerProfile.working_hours || '09:00 AM - 07:00 PM',
            website: details.providerProfile.website || ''
          });
          setProviderStatus(details.providerProfile.status || 'pending');
          
          // Get specific portfolios
          const provDetail = await api.getProviderDetails(details.providerProfile.id);
          setPortfolios(provDetail.portfolios || []);
        }
        const bList = await api.getBookings();
        setBookings(bList);
        
        // Mock some initial blocked dates for provider demo
        setBlockedDates(['2026-07-25', '2026-07-26', '2026-08-15']);
      } else {
        // Customer User
        const quotes = await api.getMyQuotes();
        setSavedQuotes(quotes);

        const bList = await api.getBookings();
        setBookings(bList);

        const ticketList = await api.getTickets();
        setTickets(ticketList);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Handle provider onboarding/update form submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ success: null, error: null });
    try {
      await api.onboardProvider(profileData);
      setFeedback({ success: 'Provider profile updated successfully!', error: null });
      loadDashboardData();
    } catch (err) {
      setFeedback({ success: null, error: err.message || 'Failed to update profile.' });
    }
  };

  // Add Portfolio Item
  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    if (!newPortTitle || !newPortImg) {
      alert('Portfolio Title and Image URL are required.');
      return;
    }
    try {
      await api.addPortfolioItem({
        title: newPortTitle,
        description: newPortDesc,
        imageUrl: newPortImg,
        price: newPortPrice
      });
      setNewPortTitle('');
      setNewPortDesc('');
      setNewPortImg('');
      setNewPortPrice('');
      loadDashboardData();
      alert('Portfolio item added successfully!');
    } catch (err) {
      alert(err.message || 'Error adding portfolio item.');
    }
  };

  // Delete Portfolio Item
  const handleDeletePortfolio = async (id) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;
    try {
      await api.deletePortfolioItem(id);
      loadDashboardData();
      alert('Portfolio item deleted.');
    } catch (err) {
      alert(err.message || 'Error deleting portfolio item.');
    }
  };

  // Update Booking Status (Accept/Cancel)
  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateBookingStatus(id, newStatus);
      loadDashboardData();
      alert(`Booking status changed to ${newStatus}.`);
    } catch (err) {
      alert(err.message || 'Error updating status.');
    }
  };

  // Submit Support Ticket (Customer only)
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketSubject || !newTicketMessage) {
      alert('Subject and Message are required.');
      return;
    }
    try {
      await api.createTicket(newTicketSubject, newTicketMessage);
      setNewTicketSubject('');
      setNewTicketMessage('');
      loadDashboardData();
      alert('Support ticket raised successfully!');
    } catch (err) {
      alert(err.message || 'Error raising ticket.');
    }
  };

  // Respond Support Ticket (Admin only)
  const handleRespondTicket = async (e) => {
    e.preventDefault();
    if (!replyMessage) return;
    try {
      await api.respondTicket(replyTicketId, replyMessage);
      setReplyTicketId(null);
      setReplyMessage('');
      loadDashboardData();
      alert('Ticket answered and resolved.');
    } catch (err) {
      alert(err.message || 'Error responding to ticket.');
    }
  };

  // Admin Approve/Reject Provider
  const handleAdminProviderStatus = async (providerId, status) => {
    try {
      await api.updateProviderStatus(providerId, status);
      loadDashboardData();
      alert(`Provider profile ${status}.`);
    } catch (err) {
      alert(err.message || 'Error changing status.');
    }
  };

  // Admin Delete User
  const handleAdminDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to permanently delete this user? All their bookings, tickets, and profile data will be lost.')) return;
    try {
      await api.deleteAdminUser(userId);
      loadDashboardData();
      alert('User deleted.');
    } catch (err) {
      alert(err.message || 'Error deleting user.');
    }
  };

  // Admin Update Settings
  const handleAdminSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateAdminSettings(platformFeeInput);
      loadDashboardData();
      alert('Platform settings updated.');
    } catch (err) {
      alert(err.message || 'Error updating platform fee.');
    }
  };

  const getFriendlyStatus = (status) => {
    const statusMap = {
      pending: <span className="badge badge-gold">Pending</span>,
      approved: <span className="badge badge-success">Approved</span>,
      completed: <span className="badge badge-primary">Completed</span>,
      cancelled: <span className="badge badge-danger">Cancelled</span>
    };
    return statusMap[status] || status;
  };

  const getFriendlyCategory = (cat) => {
    const mapping = {
      event_manager: 'Event Manager',
      decorator: 'Decorator',
      caterer: 'Caterer',
      invitation_printer: 'Invitation Printer',
      venue: 'Venue Owner',
      salon: 'Salon Expert',
      barber: 'Barber',
      laundry: 'Laundry Service',
      tailor: 'Tailor',
      clothing_brand: 'Clothing Brand',
      jewellery_shop: 'Jewellery Shop',
      lighting: 'Lighting Provider',
      sound: 'Sound System Provider',
      music_artist: 'Music Artist',
      dance_artist: 'Dance Artist',
      dance_group: 'Dance Group',
      choreographer: 'Choreographer',
      volunteers: 'Family Volunteer',
      security_guards: 'Security Guard',
      bouncers: 'Bouncer'
    };
    return mapping[cat] || cat;
  };

  // Redirect to Stripe checkout session URL
  const redirectToStripePayment = async (booking) => {
    setIsProcessingPayment(true);
    try {
      const response = await api.createStripeCheckoutSession(booking.id);
      if (response && response.url) {
        // Redirect browser to checkout page
        window.location.href = response.url;
      } else {
        alert('Stripe redirect URL not found.');
      }
    } catch (err) {
      alert(err.message || 'Checkout connection error.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCompleteCashPayment = async (bookingId) => {
    if (!confirm("Are you sure you want to mark this Cash payment as completed?")) return;
    try {
      await api.markBookingCashPaid(bookingId);
      loadDashboardData();
      alert("Cash payment updated in database.");
    } catch (err) {
      alert(err.message || "Failed to mark cash payment completed.");
    }
  };

  const getFriendlyPaymentStatus = (booking) => {
    if (booking.payment_status === 'paid') {
      const details = booking.payment_method === 'upi'
        ? `UPI (ref: ${booking.transaction_ref})`
        : booking.payment_method === 'credit_card' || booking.payment_method === 'debit_card'
          ? `Card ending in ${booking.card_last4}`
          : 'Cash Received';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="badge badge-success">Paid</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{details}</span>
          {booking.review_rating && (
            <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600 }}>Reviewed: {booking.review_rating} ⭐</span>
          )}
        </div>
      );
    }
    if (booking.payment_status === 'refunded') {
      return <span className="badge badge-danger">Refunded</span>;
    }
    if (booking.payment_method === 'cash') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="badge badge-gold">Cash Pending</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pay at Venue</span>
        </div>
      );
    }
    return <span className="badge badge-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Unpaid</span>;
  };

  const openReviewModal = (booking) => {
    setSelectedBookingForReview(booking);
    setReviewRating(5);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      await api.submitReview(
        selectedBookingForReview.provider_id,
        reviewRating,
        reviewComment,
        selectedBookingForReview.id
      );
      alert("Review submitted successfully!");
      setReviewModalOpen(false);
      loadDashboardData();
    } catch (err) {
      alert(err.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Open chat overlay drawer
  const openChatWithPartner = async (booking) => {
    setActiveChatBooking(booking);
    setChatMessages([]);
    try {
      const history = await api.getMessages(booking.id);
      setChatMessages(history);
    } catch (err) {
      console.warn("Could not fetch chat history, starting new room:", err);
    }
  };

  const handleSendChatSubmit = (e) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !socket || !activeChatBooking) return;

    const senderId = user.id;
    // receiver is opposite of current user
    const receiverId = user.role === 'provider' ? activeChatBooking.user_id : activeChatBooking.provider_user_id || activeChatBooking.user_id;

    socket.emit('send_message', {
      bookingId: activeChatBooking.id,
      senderId,
      receiverId,
      message: newChatMessage
    });

    setNewChatMessage('');
  };

  // HTML5 drag and drop handlers for timeline re-ordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newList = [...editingTimeline];
    const draggedItem = newList[draggedIndex];
    newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, draggedItem);
    
    setEditingTimeline(newList);
    setDraggedIndex(null);
  };

  // Arrow buttons timeline re-ordering
  const moveTimelineItem = (index, direction) => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= editingTimeline.length) return;

    const newList = [...editingTimeline];
    const temp = newList[index];
    newList[index] = newList[target];
    newList[target] = temp;
    setEditingTimeline(newList);
  };

  const deleteTimelineItem = (index) => {
    const newList = [...editingTimeline];
    newList.splice(index, 1);
    setEditingTimeline(newList);
  };

  const addTimelineItem = () => {
    setEditingTimeline([...editingTimeline, 'New timeline step description']);
  };

  const updateTimelineItemText = (index, text) => {
    const newList = [...editingTimeline];
    newList[index] = text;
    setEditingTimeline(newList);
  };

  const saveTimelineEdits = async () => {
    setIsSavingTimeline(true);
    try {
      const updatedBreakdown = {
        ...selectedQuote.itemized_breakdown,
        timeline: editingTimeline
      };
      await api.saveEditedQuotation(selectedQuote.id, updatedBreakdown);
      
      setSelectedQuote({
        ...selectedQuote,
        itemized_breakdown: updatedBreakdown,
        itemized_breakdown_json: JSON.stringify(updatedBreakdown)
      });
      setSavedQuotes(prev => prev.map(q => q.id === selectedQuote.id ? {
        ...q,
        itemized_breakdown: updatedBreakdown,
        itemized_breakdown_json: JSON.stringify(updatedBreakdown)
      } : q));
      alert('Event timeline saved successfully!');
    } catch (e) {
      alert(e.message || 'Error saving timeline modifications.');
    } finally {
      setIsSavingTimeline(false);
    }
  };

  // Setup initial state when quote details modal is loaded
  const handleSelectQuoteModal = (quote) => {
    setSelectedQuote(quote);
    setEditingTimeline(quote.itemized_breakdown?.timeline || []);
  };

  // Calendar Day block toggling helper
  const handleToggleBlockedDay = (dateStr) => {
    if (blockedDates.includes(dateStr)) {
      setBlockedDates(prev => prev.filter(d => d !== dateStr));
    } else {
      setBlockedDates(prev => [...prev, dateStr]);
    }
  };

  // Month Schedulers Calculations
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstWeekday = (y, m) => new Date(y, m, 1).getDay();

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  const renderSchedulerCalendarGrid = () => {
    const daysCount = getDaysInMonth(calendarYear, calendarMonth);
    const startOffset = getFirstWeekday(calendarYear, calendarMonth);
    const cells = [];

    // Weekdays headers
    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Blanks offset
    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`blank-${i}`} style={{ border: '1px solid rgba(255,255,255,0.02)', minHeight: '90px', background: 'rgba(255,255,255,0.01)' }}></div>);
    }

    // Days cells
    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isBlocked = blockedDates.includes(dateStr);
      
      // Match active bookings on this date
      const matchingBookings = bookings.filter(b => b.event_date === dateStr && b.status !== 'cancelled');

      cells.push(
        <div
          key={`day-${day}`}
          onClick={() => handleToggleBlockedDay(dateStr)}
          style={{
            border: '1px solid var(--border-color)',
            minHeight: '95px',
            padding: '8px',
            cursor: 'pointer',
            background: isBlocked 
              ? 'repeating-linear-gradient(45deg, rgba(244,63,94,0.1) 0px, rgba(244,63,94,0.1) 8px, rgba(244,63,94,0.15) 8px, rgba(244,63,94,0.15) 16px)' 
              : 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            position: 'relative',
            transition: 'background 0.2s',
            zIndex: 1
          }}
          className="calendar-cell-hover"
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isBlocked ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}>
            {day}
          </span>

          {isBlocked && (
            <span style={{ fontSize: '0.65rem', background: 'rgba(244,63,94,0.2)', color: 'var(--accent-secondary)', width: 'fit-content', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(244,63,94,0.3)', fontWeight: 600 }}>
              Blocked
            </span>
          )}

          {matchingBookings.map(b => (
            <div
              key={b.id}
              onClick={(e) => {
                e.stopPropagation(); // prevent toggling blocked status
                setActiveInvoice(b); // load billing invoice summary
              }}
              style={{
                background: b.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.15)',
                border: b.status === 'approved' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(251,191,36,0.3)',
                color: b.status === 'approved' ? '#34d399' : '#fbbf24',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                fontWeight: 600,
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={`${b.client_name} - ${b.status}`}
            >
              💼 {b.client_name?.split(' ')[0] || 'Client'}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Weekday header label grids */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          {weekdayLabels.map(l => <span key={l}>{l}</span>)}
        </div>
        
        {/* Cells grids */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {cells}
        </div>
      </div>
    );
  };

  const getMonthName = (m) => {
    const list = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return list[m];
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ border: '4px solid var(--border-color)', borderTop: '4px solid var(--accent-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'pulseGlow 1s linear infinite', margin: '0 auto 20px auto' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Syncing platform database session...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Provider approval alert banners */}
      {user.role === 'provider' && providerStatus === 'pending' && (
        <div style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', padding: '16px', borderRadius: 'var(--border-radius-sm)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle style={{ color: '#fbbf24', flexShrink: 0 }} />
          <p style={{ color: '#fbbf24', fontSize: '0.9rem', margin: 0 }}>
            <strong>Verification Pending:</strong> Your partner profile is currently awaiting administrator verification. Your services will appear on the public search index once Aadhaar details are approved.
          </p>
        </div>
      )}
      {user.role === 'provider' && providerStatus === 'rejected' && (
        <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', padding: '16px', borderRadius: 'var(--border-radius-sm)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <X style={{ color: '#f43f5e', flexShrink: 0 }} />
          <p style={{ color: '#f43f5e', fontSize: '0.9rem', margin: 0 }}>
            <strong>Account Rejected:</strong> Your partner profile was rejected by administration. Please update your onboarding details or contact support at support@eventlux.com.
          </p>
        </div>
      )}

      {/* Global alert feedback banner */}
      {feedback.success && (
        <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', padding: '16px', borderRadius: 'var(--border-radius-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check style={{ color: '#10b981', flexShrink: 0 }} />
          <span style={{ color: '#10b981', fontSize: '0.9rem' }}>{feedback.success}</span>
        </div>
      )}
      {feedback.error && (
        <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', padding: '16px', borderRadius: 'var(--border-radius-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle style={{ color: '#f43f5e', flexShrink: 0 }} />
          <span style={{ color: '#f43f5e', fontSize: '0.9rem' }}>{feedback.error}</span>
        </div>
      )}

      {/* Profile Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem' }}>Welcome, {user.fullName || user.full_name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Portal Mode:{' '}
            <span style={{ color: 'white', fontWeight: 600 }}>
              {user.role === 'admin' ? 'Administrator' : user.role === 'provider' ? 'Service Partner' : 'Client Profile'}
            </span>
          </p>
        </div>
        <span className="badge badge-primary" style={{ padding: '8px 16px' }}>{user.email}</span>
      </div>

      {/* Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* Navigation Sidebar */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {user.role === 'admin' ? (
            <>
              <button
                onClick={() => setActiveTab('overview')}
                className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px' }}
              >
                <Award style={{ width: '18px' }} /> Overview Stats
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`btn ${activeTab === 'verification' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px' }}
              >
                <Check style={{ width: '18px' }} /> Partner Approvals ({adminProviders.filter(p => p.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px' }}
              >
                <Users style={{ width: '18px' }} /> User Directory
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px' }}
              >
                <Calendar style={{ width: '18px' }} /> All Bookings ({adminBookings.length})
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`btn ${activeTab === 'tickets' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px' }}
              >
                <Ticket style={{ width: '18px' }} /> Help Tickets ({adminTickets.filter(t => t.status === 'open').length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px' }}
              >
                <Settings style={{ width: '18px' }} /> Platform Fees
              </button>
            </>
          ) : user.role === 'provider' ? (
            <>
              <button
                onClick={() => setActiveTab('profile')}
                className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px' }}
              >
                <Settings style={{ width: '18px' }} /> Partner Profile
              </button>
              <button
                onClick={() => setActiveTab('portfolios')}
                className={`btn ${activeTab === 'portfolios' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px' }}
              >
                <Clipboard style={{ width: '18px' }} /> Portfolios Gallery
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px' }}
              >
                <Calendar style={{ width: '18px' }} /> Booking Orders ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`btn ${activeTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px' }}
              >
                <Calendar style={{ width: '18px' }} /> Scheduling Calendar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px' }}
              >
                <Calendar style={{ width: '18px' }} /> My Event Bookings
              </button>
              <button
                onClick={() => setActiveTab('quotations')}
                className={`btn ${activeTab === 'quotations' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px' }}
              >
                <FileText style={{ width: '18px' }} /> AI Recommendations
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`btn ${activeTab === 'tickets' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px' }}
              >
                <Ticket style={{ width: '18px' }} /> My Support Tickets ({tickets.length})
              </button>
            </>
          )}
        </div>

        {/* Content Sidebar panel */}
        <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* ========================================================== */}
          {/* ADMIN TABS                                                 */}
          {/* ========================================================== */}
          
          {user.role === 'admin' && activeTab === 'overview' && adminStats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                  <DollarSign style={{ color: 'var(--accent-primary)', width: '32px', height: '32px', margin: '0 auto 10px auto' }} />
                  <h4 style={{ color: 'var(--text-secondary)' }}>Paid Revenue</h4>
                  <h2 style={{ fontSize: '2rem', marginTop: '6px' }}>₹{adminStats.totalRevenue.toLocaleString()}</h2>
                </div>
                <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                  <Award style={{ color: 'var(--accent-secondary)', width: '32px', height: '32px', margin: '0 auto 10px auto' }} />
                  <h4 style={{ color: 'var(--text-secondary)' }}>Platform Fees</h4>
                  <h2 style={{ fontSize: '2rem', marginTop: '6px' }}>₹{adminStats.platformFeesEarned.toLocaleString()}</h2>
                </div>
                <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                  <Users style={{ color: '#10b981', width: '32px', height: '32px', margin: '0 auto 10px auto' }} />
                  <h4 style={{ color: 'var(--text-secondary)' }}>Users Registered</h4>
                  <h2 style={{ fontSize: '2rem', marginTop: '6px' }}>{adminStats.totalUsers} Users</h2>
                </div>
                <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                  <Check style={{ color: '#fbbf24', width: '32px', height: '32px', margin: '0 auto 10px auto' }} />
                  <h4 style={{ color: 'var(--text-secondary)' }}>Pending Reviews</h4>
                  <h2 style={{ fontSize: '2rem', marginTop: '6px' }}>{adminStats.pendingProviders} Partners</h2>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '30px' }}>
                <h3 style={{ marginBottom: '20px' }}>Category Transaction Report</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Service Department</th>
                        <th style={{ padding: '12px' }}>Bookings volume</th>
                        <th style={{ padding: '12px' }}>Total Transaction volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminStats.categoryStats && adminStats.categoryStats.length > 0 ? (
                        adminStats.categoryStats.map((stat, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '12px', fontWeight: 600 }}>{getFriendlyCategory(stat.category)}</td>
                            <td style={{ padding: '12px' }}>{stat.booking_count} Bookings</td>
                            <td style={{ padding: '12px' }}>₹{stat.revenue.toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No category booking data compiled yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {user.role === 'admin' && activeTab === 'verification' && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '24px' }}>Partner Verification Panel</h2>
              {adminProviders.filter(p => p.status === 'pending').length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>All registered service providers are approved. Zero pending validations.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Business Partner</th>
                        <th style={{ padding: '12px' }}>Category</th>
                        <th style={{ padding: '12px' }}>Verification IDs</th>
                        <th style={{ padding: '12px' }}>Experience</th>
                        <th style={{ padding: '12px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminProviders.filter(p => p.status === 'pending').map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 600 }}>{p.business_name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Owner: {p.full_name} ({p.email})</div>
                          </td>
                          <td style={{ padding: '12px' }}>{getFriendlyCategory(p.category)}</td>
                          <td style={{ padding: '12px', fontSize: '0.8rem' }}>
                            <div>Aadhaar: <strong>{p.aadhaar_number}</strong></div>
                            {p.pan_number && <div>PAN: <strong>{p.pan_number}</strong></div>}
                            {p.gst_number && <div>GST: <strong>{p.gst_number}</strong></div>}
                          </td>
                          <td style={{ padding: '12px' }}>{p.years_experience} Years</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleAdminProviderStatus(p.id, 'approved')}
                                className="btn btn-primary"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#10b981' }}
                              >
                                <Check style={{ width: '12px' }} /> Approve
                              </button>
                              <button
                                onClick={() => handleAdminProviderStatus(p.id, 'rejected')}
                                className="btn btn-danger"
                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                              >
                                <X style={{ width: '12px' }} /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {user.role === 'admin' && activeTab === 'users' && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '24px' }}>User Directory</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Name / ID</th>
                      <th style={{ padding: '12px' }}>Email Address</th>
                      <th style={{ padding: '12px' }}>Role</th>
                      <th style={{ padding: '12px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{u.full_name}</td>
                        <td style={{ padding: '12px' }}>{u.email}</td>
                        <td style={{ padding: '12px' }}>
                          <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'provider' ? 'badge-primary' : 'badge-gold'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleAdminDeleteUser(u.id)}
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            >
                              <Trash2 style={{ width: '12px' }} /> Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {user.role === 'admin' && activeTab === 'bookings' && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '24px' }}>Global Bookings Registry</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Client</th>
                      <th style={{ padding: '12px' }}>Partner Business</th>
                      <th style={{ padding: '12px' }}>Event Date</th>
                      <th style={{ padding: '12px' }}>Total Amount</th>
                      <th style={{ padding: '12px' }}>Booking Status</th>
                      <th style={{ padding: '12px' }}>Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminBookings.map((b) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600 }}>{b.client_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.client_email}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600 }}>{b.business_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Category: {getFriendlyCategory(b.category)}</div>
                        </td>
                        <td style={{ padding: '12px' }}>{b.event_date}</td>
                        <td style={{ padding: '12px' }}>₹{b.total_price.toLocaleString()}</td>
                        <td style={{ padding: '12px' }}>{getFriendlyStatus(b.status)}</td>
                        <td style={{ padding: '12px' }}>{getFriendlyPaymentStatus(b)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {user.role === 'admin' && activeTab === 'tickets' && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '24px' }}>Help tickets center</h2>
              {adminTickets.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Zero support tickets raised on the platform.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {adminTickets.map((t) => (
                    <div key={t.id} className="glass-card" style={{ background: 'rgba(25,28,48,0.4)', padding: '24px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span className={`badge ${t.status === 'open' ? 'badge-gold' : 'badge-success'}`}>
                          {t.status}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Ticket ID: #{t.id} | Raised: {new Date(t.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3>Subject: {t.subject}</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '12px', borderRadius: '4px', marginTop: '10px' }}>
                        <strong>Customer Message:</strong> {t.message}
                      </p>
                      
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Customer Name: <strong>{t.client_name}</strong> | Email: <strong>{t.client_email}</strong>
                      </div>

                      {t.admin_response ? (
                        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '16px' }}>
                          <span className="badge badge-primary" style={{ marginBottom: '8px', fontSize: '0.65rem' }}>Admin Response</span>
                          <p style={{ fontSize: '0.9rem', color: '#10b981' }}>{t.admin_response}</p>
                        </div>
                      ) : (
                        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '16px' }}>
                          {replyTicketId === t.id ? (
                            <form onSubmit={handleRespondTicket} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <textarea
                                className="form-control"
                                placeholder="Type answer for the customer..."
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                rows="3"
                                required
                              />
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                                  Send Reply
                                </button>
                                <button type="button" onClick={() => setReplyTicketId(null)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              onClick={() => {
                                setReplyTicketId(t.id);
                                setReplyMessage('');
                              }}
                              className="btn btn-primary"
                              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                            >
                              <Edit3 style={{ width: '12px' }} /> Reply Ticket
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {user.role === 'admin' && activeTab === 'settings' && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '24px' }}>System Settings Configuration</h2>
              <form onSubmit={handleAdminSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
                <div className="form-group">
                  <label>Platform Booking Fee (INR)</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    min="100"
                    placeholder="100"
                    value={platformFeeInput}
                    onChange={(e) => setPlatformFeeInput(e.target.value)}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    This fee is deducted automatically per completed/paid booking request. Minimum is ₹100.
                  </p>
                </div>
                <button type="submit" className="btn btn-primary">
                  Save settings
                </button>
              </form>
            </div>
          )}

          {/* ========================================================== */}
          {/* PROVIDER TABS                                              */}
          {/* ========================================================== */}

          {user.role === 'provider' && activeTab === 'profile' && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '24px' }}>Configure Business Partner Profile</h2>
              
              <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                  <label>Business Partner Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={profileData.businessName}
                    onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Service Category *</label>
                  <select
                    value={profileData.category}
                    onChange={(e) => setProfileData({ ...profileData, category: e.target.value })}
                    className="form-control"
                  >
                    <option value="event_manager">Event Manager</option>
                    <option value="decorator">Decorator</option>
                    <option value="caterer">Caterer</option>
                    <option value="invitation_printer">Invitation Printer</option>
                    <option value="venue">Venue Owner</option>
                    <option value="salon">Salon Expert</option>
                    <option value="barber">Barber</option>
                    <option value="laundry">Laundry Service</option>
                    <option value="tailor">Tailor</option>
                    <option value="clothing_brand">Clothing Brand</option>
                    <option value="jewellery_shop">Jewellery Shop</option>
                    <option value="lighting">Lighting Provider</option>
                    <option value="sound">Sound System Provider</option>
                    <option value="music_artist">Music Artist</option>
                    <option value="dance_artist">Dance Artist</option>
                    <option value="dance_group">Dance Group</option>
                    <option value="choreographer">Choreographer</option>
                    <option value="volunteers">Family Volunteer</option>
                    <option value="security_guards">Security Guard</option>
                    <option value="bouncers">Bouncer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Base Price Rate (INR) *</label>
                  <input
                    type="number"
                    required
                    value={profileData.basePrice}
                    onChange={(e) => setProfileData({ ...profileData, basePrice: parseFloat(e.target.value) })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>City Location *</label>
                  <select
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    className="form-control"
                  >
                    <option value="Delhi">Delhi</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Jaipur">Jaipur</option>
                    <option value="Udaipur">Udaipur</option>
                    <option value="Goa">Goa</option>
                    <option value="Kolkata">Kolkata</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Years of Experience *</label>
                  <input
                    type="number"
                    required
                    value={profileData.yearsExperience}
                    onChange={(e) => setProfileData({ ...profileData, yearsExperience: parseInt(e.target.value) })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Aadhaar Verification Number *</label>
                  <input
                    type="text"
                    required
                    value={profileData.aadhaarNumber}
                    onChange={(e) => setProfileData({ ...profileData, aadhaarNumber: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>PAN Card (Optional)</label>
                  <input
                    type="text"
                    value={profileData.panNumber}
                    onChange={(e) => setProfileData({ ...profileData, panNumber: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>GST Registration (Optional)</label>
                  <input
                    type="text"
                    value={profileData.gstNumber}
                    onChange={(e) => setProfileData({ ...profileData, gstNumber: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={profileData.contactPhone}
                    onChange={(e) => setProfileData({ ...profileData, contactPhone: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Working Hours</label>
                  <input
                    type="text"
                    value={profileData.workingHours}
                    onChange={(e) => setProfileData({ ...profileData, workingHours: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Cover Banner Image URL</label>
                  <input
                    type="text"
                    value={profileData.bannerImage}
                    onChange={(e) => setProfileData({ ...profileData, bannerImage: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Services Offered (Comma separated)</label>
                  <input
                    type="text"
                    value={profileData.servicesOffered}
                    onChange={(e) => setProfileData({ ...profileData, servicesOffered: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Narrative Description</label>
                  <textarea
                    value={profileData.description}
                    onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                    className="form-control"
                    rows="3"
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', padding: '12px' }}>
                  Save Profile Settings
                </button>
              </form>
            </div>
          )}

          {user.role === 'provider' && activeTab === 'portfolios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div className="glass-card" style={{ padding: '30px' }}>
                <h2 style={{ marginBottom: '20px' }}>Upload Gallery Portfolio</h2>
                <form onSubmit={handleAddPortfolio} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  <div className="form-group">
                    <label>Portfolio Title</label>
                    <input
                      type="text"
                      required
                      placeholder="Bridal Stage Work"
                      value={newPortTitle}
                      onChange={(e) => setNewPortTitle(e.target.value)}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Showcase price (INR)</label>
                    <input
                      type="number"
                      placeholder="Optional pricing details"
                      value={newPortPrice}
                      onChange={(e) => setNewPortPrice(e.target.value)}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Image URL</label>
                    <input
                      type="text"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={newPortImg}
                      onChange={(e) => setNewPortImg(e.target.value)}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Description</label>
                    <textarea
                      placeholder="Brief details about the styles, design themes, flower materials..."
                      value={newPortDesc}
                      onChange={(e) => setNewPortDesc(e.target.value)}
                      className="form-control"
                      rows="2"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}>
                    <Plus style={{ width: '18px' }} /> Upload to Live Portfolio
                  </button>
                </form>
              </div>

              <div className="glass-card" style={{ padding: '30px' }}>
                <h2 style={{ marginBottom: '24px' }}>Existing Portfolios</h2>
                {portfolios.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No portfolios found. Add one above to start building.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                    {portfolios.map((item) => (
                      <div key={item.id} className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '140px' }}>
                          <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '8px' }}>
                          <h4 style={{ fontSize: '1rem' }}>{item.title}</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flexGrow: 1 }}>{item.description}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>INR {item.price.toLocaleString()}</span>
                            <button
                              onClick={() => handleDeletePortfolio(item.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-secondary)' }}
                            >
                              <Trash2 style={{ width: '16px' }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {user.role === 'provider' && activeTab === 'calendar' && (
            <div className="glass-card animate-fade-in" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2>Scheduler Calendar</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                    Click a date slot below to block/unblock availability for event requests.
                  </p>
                </div>
                
                {/* Navigation */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button onClick={handlePrevMonth} className="btn btn-secondary" style={{ padding: '8px' }}>
                    <ChevronLeft style={{ width: '16px' }} />
                  </button>
                  <span style={{ fontWeight: 'bold', fontSize: '1.05rem', minWidth: '130px', textAlign: 'center' }}>
                    {getMonthName(calendarMonth)} {calendarYear}
                  </span>
                  <button onClick={handleNextMonth} className="btn btn-secondary" style={{ padding: '8px' }}>
                    <ChevronRight style={{ width: '16px' }} />
                  </button>
                </div>
              </div>

              {renderSchedulerCalendarGrid()}
            </div>
          )}

          {/* ========================================================== */}
          {/* SHARED / CUSTOMER TABS                                     */}
          {/* ========================================================== */}

          {activeTab === 'bookings' && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '20px' }}>Event Bookings Database</h2>
              {bookings.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No bookings found in the database.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Event Info</th>
                        <th style={{ padding: '12px' }}>Event Date</th>
                        <th style={{ padding: '12px' }}>Amount</th>
                        <th style={{ padding: '12px' }}>Booking Status</th>
                        <th style={{ padding: '12px' }}>Payment</th>
                        <th style={{ padding: '12px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px' }}>
                            {user.role === 'provider' ? (
                              <div>
                                <h4 style={{ fontWeight: 600 }}>{b.client_name}</h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.client_email}</span>
                              </div>
                            ) : (
                              <div>
                                <h4 style={{ fontWeight: 600 }}>{b.business_name}</h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category: {getFriendlyCategory(b.category)}</span>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>{b.event_date}</td>
                          <td style={{ padding: '12px' }}>₹{b.total_price.toLocaleString()}</td>
                          <td style={{ padding: '12px' }}>{getFriendlyStatus(b.status)}</td>
                          <td style={{ padding: '12px' }}>{getFriendlyPaymentStatus(b)}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              <button
                                onClick={() => openChatWithPartner(b)}
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', gap: '4px', alignItems: 'center' }}
                              >
                                <MessageSquare style={{ width: '12px' }} /> Chat
                              </button>
                              {user.role === 'provider' && b.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(b.id, 'approved')}
                                    className="btn btn-primary"
                                    style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#10b981' }}
                                  >
                                    <Check style={{ width: '12px' }} /> Accept
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(b.id, 'cancelled')}
                                    className="btn btn-danger"
                                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                  >
                                    <X style={{ width: '12px' }} /> Decline
                                  </button>
                                </>
                              )}
                              {user.role === 'provider' && b.payment_method === 'cash' && b.payment_status === 'unpaid' && b.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleCompleteCashPayment(b.id)}
                                  className="btn btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#3b82f6' }}
                                >
                                  Mark Cash Paid
                                </button>
                              )}
                              {user.role === 'user' && b.payment_status === 'unpaid' && b.status !== 'cancelled' && (
                                <button
                                  onClick={() => redirectToStripePayment(b)}
                                  disabled={isProcessingPayment}
                                  className="btn btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--accent-primary)', display: 'flex', gap: '4px', alignItems: 'center' }}
                                >
                                  <CreditCard style={{ width: '12px' }} /> Pay (Stripe Escrow)
                                </button>
                              )}
                              {user.role === 'user' && b.payment_status === 'paid' && (
                                <button
                                  onClick={() => setActiveInvoice(b)}
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', gap: '4px', alignItems: 'center' }}
                                >
                                  <FileText style={{ width: '12px' }} /> Invoice
                                </button>
                              )}
                              {user.role === 'user' && b.payment_status === 'paid' && (b.status === 'approved' || b.status === 'completed') && !b.review_id && (
                                <button
                                  onClick={() => openReviewModal(b)}
                                  className="btn btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--gradient-gold)', color: 'black' }}
                                >
                                  ⭐ Write Review
                                </button>
                              )}
                              {user.role === 'user' && b.status === 'pending' && b.payment_status !== 'paid' && (
                                <button
                                  onClick={() => handleStatusChange(b.id, 'cancelled')}
                                  className="btn btn-danger"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                >
                                  Cancel Request
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {user.role === 'user' && activeTab === 'quotations' && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '20px' }}>Your Saved AI Proposals</h2>
              {savedQuotes.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No saved AI recommendations found. Go to 'AI Recommendation' in the menu to generate a quote.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                  {savedQuotes.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => handleSelectQuoteModal(q)}
                      className="glass-card"
                      style={{
                        padding: '20px',
                        cursor: 'pointer',
                        background: 'rgba(25, 28, 48, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.04)'
                      }}
                    >
                      <span className="badge badge-primary" style={{ marginBottom: '8px' }}>{q.event_type}</span>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Quotation #{q.id}</h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>Target Budget: <strong>INR {q.budget.toLocaleString()}</strong></span>
                        <span>AI Total Cost: <strong>INR {q.total_cost.toLocaleString()}</strong></span>
                        <span>Destination: {q.destination}</span>
                        <span>Guests: {q.guests}</span>
                      </div>
                      
                      <button
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '8px', fontSize: '0.85rem', marginTop: '16px' }}
                      >
                        Inspect & Edit Timeline
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {user.role === 'user' && activeTab === 'tickets' && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '24px' }}>Raise support ticket</h2>
              
              <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', maxWidth: '500px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Subject / Issue topic *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Invoice print error, Booking double charge"
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Message details *</label>
                  <textarea
                    required
                    placeholder="Please write transaction refs or specify details..."
                    value={newTicketMessage}
                    onChange={(e) => setNewTicketMessage(e.target.value)}
                    className="form-control"
                    rows="3"
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                  Submit Support Ticket
                </button>
              </form>

              <h3 style={{ marginBottom: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>Ticket History</h3>
              {tickets.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>You have not submitted any support tickets yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {tickets.map(t => (
                    <div key={t.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: 'var(--border-radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className={`badge ${t.status === 'open' ? 'badge-gold' : 'badge-success'}`}>
                          {t.status}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Ticket ID: #{t.id} | Raised: {new Date(t.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4>Subject: {t.subject}</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        <strong>My Message:</strong> {t.message}
                      </p>
                      {t.admin_response ? (
                        <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', color: '#34d399', padding: '12px', borderRadius: '4px', marginTop: '12px', fontSize: '0.9rem' }}>
                          <strong>Admin Reply:</strong> {t.admin_response}
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px', fontStyle: 'italic' }}>
                          Awaiting Admin response...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Invoice Print Overlay Modal */}
      {activeInvoice && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setActiveInvoice(null)}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              maxWidth: '650px',
              width: '100%',
              background: '#ffffff',
              color: '#0f172a',
              padding: '40px',
              borderRadius: '8px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
              fontFamily: 'sans-serif'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Invoice Design */}
            <div id="invoice-print-area">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px' }}>
                <div>
                  <h1 style={{ color: '#6366f1', margin: 0, fontSize: '1.8rem', fontFamily: 'Outfit' }}>EventLux</h1>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Enterprise Booking Invoice</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ margin: 0 }}>INVOICE</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>ID: INV-B{activeInvoice.id}-{activeInvoice.transaction_ref?.slice(4, 9)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0', fontSize: '0.85rem' }}>
                <div>
                  <h5 style={{ color: '#64748b', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Billed To:</h5>
                  <strong>{user.role === 'provider' ? activeInvoice.client_name : (user.fullName || user.full_name)}</strong><br />
                  {user.role === 'provider' ? activeInvoice.client_email : user.email}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h5 style={{ color: '#64748b', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Partner Service:</h5>
                  <strong>{activeInvoice.business_name}</strong><br />
                  Category: {getFriendlyCategory(activeInvoice.category)}<br />
                  Phone: {activeInvoice.contact_phone || 'N/A'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '4px', margin: '20px 0', fontSize: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Event Scheduled:</span>
                    <div style={{ fontWeight: 'bold', marginTop: '4px' }}>{activeInvoice.event_date}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Payment Mode:</span>
                    <div style={{ fontWeight: 'bold', marginTop: '4px', textTransform: 'uppercase' }}>{activeInvoice.payment_method}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Reference ID:</span>
                    <div style={{ fontWeight: 'bold', marginTop: '4px', wordBreak: 'break-all' }}>{activeInvoice.transaction_ref || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', margin: '20px 0' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '8px 0', textAlign: 'left' }}>Item Description</th>
                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 0' }}>
                      <strong>{getFriendlyCategory(activeInvoice.category)} Package</strong><br />
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Provided by {activeInvoice.business_name}</span>
                    </td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>₹{activeInvoice.total_price.toLocaleString()}.00</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 0', color: '#64748b' }}>
                      Platform Orchestration Fee (Included)
                    </td>
                    <td style={{ padding: '12px 0', textAlign: 'right', color: '#64748b' }}>₹100.00</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', maxWidth: '300px' }}>
                  Secure payment verified by EventLux. All bookings are locked in escrow and subject to 100% refund policy in case of cancellation.
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Paid:</span>
                  <h2 style={{ color: '#6366f1', margin: '4px 0 0 0', fontSize: '1.8rem' }}>₹{activeInvoice.total_price.toLocaleString()}.00</h2>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  const printContents = document.getElementById('invoice-print-area').innerHTML;
                  const originalContents = document.body.innerHTML;
                  document.body.innerHTML = printContents;
                  window.print();
                  document.body.innerHTML = originalContents;
                  window.location.reload(); 
                }}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
              >
                Print Invoice
              </button>
              <button
                onClick={() => setActiveInvoice(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 20px', fontSize: '0.85rem', color: '#0f172a', borderColor: '#cbd5e1' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quotation Detail Modal overlay with Drag & Drop Timeline Editor */}
      {selectedQuote && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setSelectedQuote(null)}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-secondary)',
              padding: '30px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-primary">{selectedQuote.event_type} Proposal</span>
                <h2 style={{ fontSize: '1.4rem', marginTop: '6px' }}>Interactive Quotation Breakdown #{selectedQuote.id}</h2>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--border-radius-sm)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Destination</span>
                  <p style={{ fontWeight: 'bold' }}>{selectedQuote.destination}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Guest Count</span>
                  <p style={{ fontWeight: 'bold' }}>{selectedQuote.guests} Pax</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Theme Style</span>
                  <p style={{ fontWeight: 'bold' }}>{selectedQuote.theme}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Event Duration</span>
                  <p style={{ fontWeight: 'bold' }}>{selectedQuote.duration || '1'} Days</p>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '8px' }}>AI Planning Narrative:</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {selectedQuote.itemized_breakdown?.summaryNarrative}
                </p>
              </div>

              {/* Draggable HTML5 Event Timeline Editor */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Edit3 style={{ width: '16px', color: 'var(--accent-primary)' }} /> Edit Event Timeline (Drag & Drop to reorder)
                  </h4>
                  <button
                    type="button"
                    onClick={addTimelineItem}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', gap: '4px', alignItems: 'center' }}
                  >
                    <Plus style={{ width: '12px' }} /> Add Step
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {editingTimeline.map((step, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      style={{
                        background: 'rgba(25, 28, 48, 0.6)',
                        borderLeft: '4px solid var(--accent-primary)',
                        padding: '10px 14px',
                        borderRadius: '4px',
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        border: '1px solid var(--border-color)',
                        opacity: draggedIndex === idx ? 0.4 : 1
                      }}
                    >
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => updateTimelineItemText(idx, e.target.value)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-primary)',
                          width: '100%',
                          fontSize: '0.85rem'
                        }}
                      />

                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => moveTimelineItem(idx, 'up')}
                          disabled={idx === 0}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTimelineItem(idx, 'down')}
                          disabled={idx === editingTimeline.length - 1}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTimelineItem(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', marginLeft: '6px' }}
                        >
                          <Trash2 style={{ width: '14px' }} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {editingTimeline.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '10px' }}>
                      No timeline steps. Click "Add Step" to begin.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={saveTimelineEdits}
                  disabled={isSavingTimeline}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.85rem', marginTop: '16px', background: '#10b981' }}
                >
                  {isSavingTimeline ? 'Saving Timeline...' : 'Save Timeline Changes'}
                </button>
              </div>

              <div>
                <h4 style={{ marginBottom: '12px' }}>Heuristic Budget Allocations:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedQuote.itemized_breakdown?.vendors?.map((v, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '4px', fontSize: '0.85rem' }}>
                      <div>
                        <span className="badge badge-primary" style={{ fontSize: '0.6rem', padding: '2px 6px', marginBottom: '4px' }}>{getFriendlyCategory(v.category)}</span>
                        <div style={{ fontWeight: 600 }}>{v.businessName}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allocation:</span>
                        <div style={{ fontWeight: 'bold' }}>INR {v.estimatedPrice.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Aggregate Quotation Value:</span>
                <h2 style={{ color: 'var(--accent-primary)' }}>INR {selectedQuote.total_cost.toLocaleString()}</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setReviewModalOpen(false)}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              maxWidth: '480px',
              width: '100%',
              background: 'var(--bg-secondary)',
              padding: '30px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '16px' }}>Submit Partner Review</h3>
            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Rating (1 to 5 Stars)</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(parseInt(e.target.value))}
                  className="form-control"
                >
                  <option value="5">5 Stars (Excellent)</option>
                  <option value="4">4 Stars (Good)</option>
                  <option value="3">3 Stars (Average)</option>
                  <option value="2">2 Stars (Poor)</option>
                  <option value="1">1 Star (Very Poor)</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Review Commentary</label>
                <textarea
                  required
                  placeholder="Share details of your experience with this partner..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="form-control"
                  rows="3"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" disabled={isSubmittingReview} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                  {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                </button>
                <button type="button" onClick={() => setReviewModalOpen(false)} className="btn btn-secondary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WebSockets Live Chat Sidebar drawer overlay */}
      {activeChatBooking && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 4000,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setActiveChatBooking(null)}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              maxWidth: '450px',
              width: '100%',
              height: '100vh',
              background: 'var(--bg-secondary)',
              borderLeft: '1px solid var(--border-color)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 0,
              boxShadow: '-10px 0 25px -5px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>
                  {user.role === 'provider' ? activeChatBooking.client_name : activeChatBooking.business_name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Live booking chat | ID: #{activeChatBooking.id}
                </span>
              </div>
              <button
                onClick={() => setActiveChatBooking(null)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* Chat Body messages list */}
            <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', marginBottom: '16px' }}>
              {chatMessages.map((msg, index) => {
                const isMine = msg.senderId === user.id;
                return (
                  <div
                    key={index}
                    style={{
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      background: isMine ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: 'white',
                      padding: '10px 14px',
                      borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      maxWidth: '85%',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>{msg.message}</p>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', alignSelf: 'flex-end', display: 'block', textAlign: 'right', marginTop: '2px' }}>
                      {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef}></div>
            </div>

            {/* Input form */}
            <form onSubmit={handleSendChatSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="Type message here..."
                className="form-control"
                style={{ padding: '12px' }}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
                <Send style={{ width: '16px', height: '16px' }} />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
