// Enable client-side rendering for the main dashboard view in Next.js App Router
'use client';

// Import essential React hooks for state management, lifecycle side effects, and memoized callbacks
import { useState, useEffect, useCallback } from 'react';
// Import the custom authentication hook to manage session state and credential tokens
import { useAuth } from '@/context/AuthContext';
// Import the shared navigation bar component
import Navbar from '@/components/common/Navbar';
// Import router navigation handlers from Next.js
import { useRouter } from 'next/navigation';
// Import link wrappers for router transitions
import Link from 'next/link';
// Import modern iconography from Lucide React
import { 
  Users, CalendarDays, Activity, Search, Sparkles, UserPlus, 
  Trash2, ClipboardList, TrendingUp, DollarSign, Award, Clock,
  ArrowRight, ShieldAlert, CheckCircle, Volume2
} from 'lucide-react';

// Main Dashboard component definition
export default function Dashboard() {
  // Destructure session state, tokens, and API routes from our custom context hook
  const { user, token, loading, API_BASE_URL, logout } = useAuth();
  // Instantiate the client router helper
  const router = useRouter();

  // ==========================================
  // ALL STATE HOOKS — must come before any early return
  // ==========================================

  // State hook to track the active tab category layout
  const [activeTab, setActiveTab] = useState('dashboard');

  // State hook for storing raw search input characters
  const [patientSearchInput, setPatientSearchInput] = useState('');
  // State hook storing the debounced search string that triggers database queries
  const [patientSearch, setPatientSearch] = useState('');

  // STATE FOR RECEPTIONIST WORKFLOWS
  // State storing the paginated patients array
  const [patients, setPatients] = useState([]);
  // State tracking patient database fetch activity
  const [patientsLoading, setPatientsLoading] = useState(false);
  // State holding gender filters for search queries
  const [patientGender, setPatientGender] = useState('All');
  // State tracking pagination cursor page indexes and totals
  const [patientsPagination, setPatientsPagination] = useState({ page: 1, totalPages: 1 });

  // Registration Form Local States
  // State holding newly registered patient name
  const [regName, setRegName] = useState('');
  // State holding newly registered patient email
  const [regEmail, setRegEmail] = useState('');
  // State holding newly registered patient phone number
  const [regPhone, setRegPhone] = useState('');
  // State holding newly registered patient age
  const [regAge, setRegAge] = useState('');
  // State holding newly registered patient gender selection
  const [regGender, setRegGender] = useState('Male');
  // State holding newly registered patient anamnesis history details
  const [regHistory, setRegHistory] = useState('');
  // State holding form feedback validation messages
  const [regMessage, setRegMessage] = useState('');

  // Queue and Appointment Booking States
  // State array caching practitioner lists
  const [doctorsList, setDoctorsList] = useState([]);
  // State tracking patient ID for new scheduled bookings
  const [bookingPatientId, setBookingPatientId] = useState('');
  // State tracking doctor ID for new scheduled bookings
  const [bookingDoctorId, setBookingDoctorId] = useState('');
  // State tracking appointment timestamp scheduling string
  const [bookingDate, setBookingDate] = useState('');
  // State tracking clinical consultation reasoning text
  const [bookingReason, setBookingReason] = useState('');
  // State holding scheduled booking confirmation feedback
  const [bookingMessage, setBookingMessage] = useState('');
  // State holding token check-in feedback alerts
  const [checkinMessage, setCheckinMessage] = useState('');

  // STATE FOR DOCTOR WORKFLOWS
  // State tracking the doctor's scheduled appointments for today
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  // State tracking active calling and waiting queue tokens under this doctor
  const [doctorQueue, setDoctorQueue] = useState([]);
  // State storing the selected patient model for medical history detail modals
  const [selectedPatientHistory, setSelectedPatientHistory] = useState(null);

  // STATE FOR ADMIN WORKFLOWS
  // State storing audit analytics report metrics
  const [adminReportData, setAdminReportData] = useState(null);
  // State tracking admin report generation status
  const [adminReportLoading, setAdminReportLoading] = useState(false);
  // State storing search string input for administrative physician searches
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // ==========================================
  // EFFECTS — also before early return
  // ==========================================

  // Session guard effect ensuring unauthenticated guests are sent to login view
  useEffect(() => {
    // Reroute user if session is missing and session state is no longer loading
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Set default page dashboard tabs dynamically based on user role once loaded
  useEffect(() => {
    // Stop execution if user model is not loaded yet
    if (!user) return;
    // Map initial tab based on role properties
    if (user.role === 'ADMIN') setActiveTab('reports');
    else if (user.role === 'RECEPTIONIST') setActiveTab('patients');
    else setActiveTab('appointments');
  }, [user?.role]);

  // Debounce search effect to limit database fetch requests during user keystrokes
  useEffect(() => {
    // Instantiate 400ms delay timer
    const timer = setTimeout(() => {
      // Update debounced search state
      setPatientSearch(patientSearchInput);
    }, 400);
    // Return cleanup hook clearing active timers on keystroke changes
    return () => clearTimeout(timer);
  }, [patientSearchInput]);

  // Fetch patients array on change of debounced search or gender filters
  useEffect(() => {
    // Prevent fetches if user is unauthenticated
    if (!user || !token) return;
    // Restrict requests to receptionist or admin accounts
    if (user.role === 'RECEPTIONIST' || user.role === 'ADMIN') {
      fetchPatients(1);
    }
  }, [user, token, patientSearch, patientGender]);

  // Fetch doctor dropdown datasets on initial load
  useEffect(() => {
    // Prevent fetches if user is unauthenticated
    if (!user || !token) return;
    fetchDoctorsDropdown();
  }, [user, token]);

  // Fetch doctor active queue worklists on mount
  useEffect(() => {
    // Prevent fetches if user is unauthenticated
    if (!user || !token) return;
    // Limit calls to doctors when the list is populated
    if (user.role === 'DOCTOR' && doctorsList.length > 0) {
      fetchDoctorWorklist();
    }
  }, [user, token, doctorsList]);

  // Prevent UI rendering before user context resolves
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="text-center flex flex-col items-center">
          <div className="pulse-loader mb-4">
            <div></div>
            <div></div>
          </div>
          <p className="text-xs font-semibold text-slate-400 animate-pulse">
            Loading session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ==========================================
  // RECEPTIONIST FUNCTIONS
  // ==========================================

  // Fetch paginated patient records from the backend matching search query and gender filters
  const fetchPatients = async (page = 1) => {
    // Enable patient loading spinner
    setPatientsLoading(true);
    try {
      // Execute GET request with query params for pagination, search queries, and gender filters
      const res = await fetch(
        `${API_BASE_URL}/patients?page=${page}&limit=5&search=${patientSearch}&gender=${patientGender}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Decode JSON response
      const data = await res.json();
      // If response resolves successfully, map variables to react states
      if (data.success) {
        // Cache patient list
        setPatients(data.patients);
        // Record pagination metrics
        setPatientsPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          totalPatients: data.pagination.totalPatients,
        });
      }
    } catch (e) {
      // Log connection failures
      console.error(e);
    } finally {
      // Disable patient loading spinner
      setPatientsLoading(false);
    }
  };

  // Fetch all registered physicians for scheduling dropdown options
  const fetchDoctorsDropdown = async () => {
    try {
      // Send GET request to doctors endpoint
      const res = await fetch(`${API_BASE_URL}/doctors`, {
        // Pass bearer security credentials
        headers: { Authorization: `Bearer ${token}` },
      });
      // Parse physician array
      const data = await res.json();
      // Cache physician entries in local state
      setDoctorsList(data);
    } catch (e) {
      // Log errors
      console.error(e);
    }
  };

  // Register new patient records within the repository
  const handleRegisterPatient = async (e) => {
    // Prevent browser form submission reload action
    e.preventDefault();
    // Reset registration feedback message
    setRegMessage('');

    // Pre-flight check verifying required patient columns
    if (!regName || !regPhone || !regAge) {
      setRegMessage('Error: Name, Age and Phone number are required.');
      return;
    }

    // FIX: Verify phone formatting patterns using basic regex validation
    if (!/^\+?[\d\s\-()]{7,15}$/.test(regPhone)) {
      setRegMessage('Error: Please enter a valid phone number.');
      return;
    }

    try {
      // Post patient record to API server
      const res = await fetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phoneNumber: regPhone,
          age: regAge,
          gender: regGender,
          medicalHistory: regHistory,
        }),
      });

      // Parse JSON response body
      const data = await res.json();
      // Verify request resolved correctly
      if (res.ok) {
        // Render success notification
        setRegMessage('Success: Patient registered successfully!');
        // Clear input states
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegAge('');
        setRegHistory('');
        // Re-fetch patient list to update grid directory
        fetchPatients(1);
      } else {
        // Capture error explanation
        setRegMessage(`Error: ${data.error || 'Failed to register'}`);
      }
    } catch (err) {
      // Display exception errors
      setRegMessage(`Error: ${err.message}`);
    }
  };

  // Schedule a new consultation booking slot for patients
  const handleBookAppointment = async (e) => {
    // Prevent default form submittal
    e.preventDefault();
    // Clear booking status messages
    setBookingMessage('');

    // Pre-flight validation checks
    if (!bookingPatientId || !bookingDoctorId || !bookingDate) {
      setBookingMessage('Error: All booking fields are required.');
      return;
    }

    try {
      // Post scheduling payload details to endpoint
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: bookingPatientId,
          doctorId: bookingDoctorId,
          appointmentDate: bookingDate,
          reason: bookingReason,
        }),
      });

      // Parse JSON output
      const data = await res.json();
      // Verify appointment scheduling status
      if (res.ok) {
        // Display success response details
        setBookingMessage('Success: Appointment booked successfully!');
        // Clear objective reason text area
        setBookingReason('');
        // If logged-in user is a doctor, refresh current dashboard queues
        if (user.role === 'DOCTOR') fetchDoctorWorklist();
      } else {
        // Show validation errors
        setBookingMessage(`Error: ${data.error || 'Failed to book'}`);
      }
    } catch (err) {
      // Show connection exceptions
      setBookingMessage(`Error: ${err.message}`);
    }
  };

  // Remove registered patient entries from system database
  const handleDeletePatient = async (id) => {
    // Require explicit confirmation to prevent accidental patient record deletions
    if (!confirm('Are you sure you want to delete this patient record?')) return;
    try {
      // Send delete verb to matching dynamic endpoint ID
      const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Parse output
      const data = await res.json();
      // If deleted successfully, notify and refresh the page index
      if (res.ok) {
        alert(data.message || 'Patient deleted.');
        fetchPatients(patientsPagination.page);
      } else {
        alert(`Error: ${data.error || 'Deletion failed.'}`);
      }
    } catch (err) {
      // Alert connection errors
      alert(`Error: ${err.message}`);
    }
  };

  // Perform transaction check-in creating a live queue token number
  const handleQueueCheckin = async (patientId, doctorId, appointmentId = null) => {
    // Clear dynamic status message banners
    setCheckinMessage('');
    try {
      // Post request parameters to the check-in queue endpoint
      const res = await fetch(`${API_BASE_URL}/queue/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patientId, doctorId, appointmentId }),
      });
      // Parse JSON output
      const data = await res.json();
      // Verify success
      if (res.ok) {
        // Expose newly generated token metadata
        setCheckinMessage(`Checked in! Generated Token #${data.token.tokenNumber}`);
        // If practitioner is check-in operator, refresh queue dashboard views
        if (user.role === 'DOCTOR') fetchDoctorWorklist();
      } else {
        // Render checkin error feedback
        setCheckinMessage(`Error check-in: ${data.error}`);
      }
    } catch (err) {
      // Display connection exceptions
      setCheckinMessage(`Error: ${err.message}`);
    }
  };

  // ==========================================
  // DOCTOR WORKFLOW FUNCTIONS
  // ==========================================

  // Pull doctor-specific appointments and queue tokens in parallel
  const fetchDoctorWorklist = async () => {
    // Terminate check-in query operations if user is not a practitioner
    if (user.role !== 'DOCTOR') return;
    try {
      // Find matching physician primary key mapping user credentials ID
      const matchedDoc = doctorsList.find((d) => d.userId === user.id);
      // Stop execution if physician ID lookup returns empty
      if (!matchedDoc) return;

      // Run multiple async fetch operations in parallel via Promise.all
      const [appRes, queueRes] = await Promise.all([
        // Pull doctor appointments
        fetch(`${API_BASE_URL}/appointments?doctorId=${matchedDoc.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        // Pull doctor queues
        fetch(`${API_BASE_URL}/queue?doctorId=${matchedDoc.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Decode appointment query arrays
      const appData = await appRes.json();
      // Cache results in state
      if (appData.success) setDoctorAppointments(appData.appointments);

      // Decode queue lists
      const queueData = await queueRes.json();
      // Cache active queues in state
      setDoctorQueue(queueData);
    } catch (e) {
      // Log errors
      console.error(e);
    }
  };

  // Update status indicators on active queue tokens
  const handleUpdateQueueStatus = async (tokenId, newStatus) => {
    try {
      // Dispatch status patch payload
      const res = await fetch(`${API_BASE_URL}/queue/${tokenId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      // Refresh practitioner queues list if patch finishes successfully
      if (res.ok) fetchDoctorWorklist();
    } catch (e) {
      // Log errors
      console.error(e);
    }
  };

  // Mark pending appt records as complete
  const handleCompleteAppointment = async (appId) => {
    try {
      // Patch state indicator to COMPLETED status
      const res = await fetch(`${API_BASE_URL}/appointments/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      // Refresh doctor lists
      if (res.ok) fetchDoctorWorklist();
    } catch (e) {
      // Log errors
      console.error(e);
    }
  };

  // ==========================================
  // ADMIN SYSTEM WORKFLOWS
  // ==========================================

  // Compile system operations metrics for administrator
  const generateSystemReport = async () => {
    // Enable system reporting load indicator
    setAdminReportLoading(true);
    try {
      // GET doctor performance stats reports
      const res = await fetch(`${API_BASE_URL}/reports/doctor-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Decode output
      const data = await res.json();
      // Cache details in admin report states
      if (data.success) setAdminReportData(data);
    } catch (e) {
      // Log errors
      console.error(e);
    } finally {
      // Disable system reporting load indicator
      setAdminReportLoading(false);
    }
  };

  // Search doctors database for matches using name parameters
  const searchPhysiciansAdmin = async () => {
    try {
      // Request parameterized search listings
      const res = await fetch(
        `${API_BASE_URL}/doctors?search=${encodeURIComponent(adminSearchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Decode JSON response
      const data = await res.json();
      // If resolved array is valid, cache results
      if (Array.isArray(data)) {
        setDoctorsList(data);
      } else {
        // Expose error alerts
        alert(`API Error: ${data.error}`);
      }
    } catch (e) {
      // Log errors
      console.error(e);
    }
  };

  return (
    // Main container styling full height screen
    <div className="min-h-screen flex flex-col">
      {/* Top persistent navigation bar */}
      <Navbar />

      {/* Primary content area centered with maximum width restrictions */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8">

        {/* Navigation Tabs bar rendered based on the logged-in user's role */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto gap-4">
          {/* Admin specific tab buttons */}
          {user.role === 'ADMIN' && (
            <>
              {/* Tab 1: System Audit Reports */}
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-3.5 px-1 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'reports' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400'}`}
              >
                System Audit Reports
              </button>
              {/* Tab 2: Physician Registry */}
              <button
                onClick={() => setActiveTab('physicians')}
                className={`py-3.5 px-1 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'physicians' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400'}`}
              >
                Physician Registry
              </button>
            </>
          )}

          {/* Receptionist and Admin specific tab buttons */}
          {(user.role === 'RECEPTIONIST' || user.role === 'ADMIN') && (
            <>
              {/* Tab 3: Patient Registry Directory */}
              <button
                onClick={() => setActiveTab('patients')}
                className={`py-3.5 px-1 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'patients' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400'}`}
              >
                Patient Registry Directory
              </button>
              {/* Tab 4: Scheduling and checkin panel */}
              <button
                onClick={() => setActiveTab('book')}
                className={`py-3.5 px-1 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'book' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400'}`}
              >
                Scheduling / Check-in Portal
              </button>
            </>
          )}

          {/* Doctor specific tab buttons */}
          {user.role === 'DOCTOR' && (
            <>
              {/* Tab 5: Scheduled Bookings List */}
              <button
                onClick={() => setActiveTab('appointments')}
                className={`py-3.5 px-1 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'appointments' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400'}`}
              >
                My Scheduled Bookings
              </button>
              {/* Tab 6: Active Calling Queue Board */}
              <button
                onClick={() => setActiveTab('queue')}
                className={`py-3.5 px-1 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'queue' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400'}`}
              >
                Active Calling Queue
              </button>
            </>
          )}
        </div>

        {/* Global check-in notification alert */}
        {checkinMessage && (
          <div className="p-4 mb-6 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-between text-sm">
            <span>{checkinMessage}</span>
            {/* Dismiss action */}
            <button onClick={() => setCheckinMessage('')} className="font-bold underline text-xs">Dismiss</button>
          </div>
        )}

        {/* ==============================================================
            TAB: PATIENT REGISTRY (RECEPTIONIST & ADMIN)
            ============================================================== */}
        {activeTab === 'patients' && (
          <div className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Directory Section listing registered patients */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                    <ClipboardList className="h-5 w-5 text-indigo-600" />
                    Patient Lookup Directory
                  </h3>

                  {/* Filter controls containing search keywords and gender select dropdowns */}
                  <div className="flex gap-4 mb-6">
                    {/* Search keyword input wrapper */}
                    <div className="relative flex-1 rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="h-4 w-4" />
                      </div>
                      {/* Keyword input */}
                      <input
                        type="text"
                        value={patientSearchInput}
                        onChange={(e) => setPatientSearchInput(e.target.value)}
                        placeholder="Search by name, phone or email..."
                        className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {/* Gender select dropdown filter */}
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                    >
                      <option value="All">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Dynamic conditional patient list rendering block */}
                  {patientsLoading ? (
                    // Pulse loading spinner when query has not finished
                    <p className="text-center py-6 text-slate-400 animate-pulse text-sm">Synchronizing table data...</p>
                  ) : patients.length === 0 ? (
                    // Display placeholder message if no patient records match current filters
                    <p className="text-center py-6 text-slate-400 text-sm">No registered patients match this filter.</p>
                  ) : (
                    // Responsive table container
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm text-left">
                        <thead>
                          {/* Table column headers */}
                          <tr className="text-slate-400 uppercase tracking-widest text-xxs font-bold border-b border-slate-200 dark:border-slate-800">
                            <th className="pb-3">Name</th>
                            <th className="pb-3">Contact</th>
                            <th className="pb-3">Age/Sex</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        {/* Map over search result array rendering patient rows */}
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {patients.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-500/5 transition-colors">
                              {/* Column 1: Patient Name & Email */}
                              <td className="py-3.5 font-bold text-slate-800 dark:text-slate-200">
                                {p.name}
                                {p.email && <span className="block text-xxs text-slate-400 font-normal mt-0.5">{p.email}</span>}
                              </td>
                              {/* Column 2: Contact Phone */}
                              <td className="py-3.5 text-slate-500 dark:text-slate-400 font-medium">{p.phoneNumber}</td>
                              {/* Column 3: Age / Sex */}
                              <td className="py-3.5 text-slate-500 dark:text-slate-400">
                                {p.age} yrs / <span className="capitalize">{p.gender}</span>
                              </td>
                              {/* Column 4: Check-in / Delete Actions */}
                              <td className="py-3.5 text-right space-x-2">
                                {/* Direct checkin triggers active tokens generation */}
                                <button
                                  onClick={() => handleQueueCheckin(p.id, doctorsList[0]?.id)}
                                  className="text-xxs px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-500 hover:text-white transition-colors"
                                >
                                  Check In
                                </button>
                                {/* Delete patient profile button */}
                                <button
                                  onClick={() => handleDeletePatient(p.id)}
                                  className="text-xxs p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                                  title="Delete patient record"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination control footer bar */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">
                      Page {patientsPagination.page} of {patientsPagination.totalPages}
                    </span>
                    {/* Previous and Next button controls */}
                    <div className="flex gap-2">
                      {/* Prev Page Button */}
                      <button
                        disabled={patientsPagination.page <= 1}
                        onClick={() => fetchPatients(patientsPagination.page - 1)}
                        className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-indigo-500/10 disabled:opacity-50 text-xs font-semibold"
                      >
                        Prev
                      </button>
                      {/* Next Page Button */}
                      <button
                        disabled={patientsPagination.page >= patientsPagination.totalPages}
                        onClick={() => fetchPatients(patientsPagination.page + 1)}
                        className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-indigo-500/10 disabled:opacity-50 text-xs font-semibold"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Form container card */}
              <div className="glass p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 h-fit">
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                  New Registration
                </h3>

                {/* Form feedback status alerts */}
                {regMessage && (
                  <div className={`p-3 text-sm rounded-lg mb-4 ${regMessage.startsWith('Success') ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' : 'bg-rose-500/15 text-rose-500 border border-rose-500/20'}`}>
                    {regMessage}
                  </div>
                )}

                {/* Register Patient submission form */}
                <form onSubmit={handleRegisterPatient} className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {/* Name field */}
                  <div>
                    <label className="block mb-1">Patient Full Name*</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Bruce Wayne"
                      className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                    />
                  </div>

                  {/* Age and Gender selectors inline grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Age Input */}
                    <div>
                      <label className="block mb-1">Age (Years)*</label>
                      <input
                        type="number"
                        required
                        value={regAge}
                        onChange={(e) => setRegAge(e.target.value)}
                        placeholder="35"
                        className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                      />
                    </div>
                    {/* Gender select */}
                    <div>
                      <label className="block mb-1">Gender*</label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Phone field */}
                  <div>
                    <label className="block mb-1">Contact Phone*</label>
                    <input
                      type="text"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="9876543210"
                      className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                    />
                  </div>

                  {/* Email field */}
                  <div>
                    <label className="block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="bruce@wayne.com"
                      className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                    />
                  </div>

                  {/* Clinical anamnesis background field */}
                  <div>
                    <label className="block mb-1">Medical Anamnesis / History (Can be left blank)</label>
                    <textarea
                      value={regHistory}
                      onChange={(e) => setRegHistory(e.target.value)}
                      placeholder="E.g. cardiovascular risks, asthma..."
                      rows="3"
                      className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                    ></textarea>
                  </div>

                  {/* Submit registration details button */}
                  <button
                    type="submit"
                    className="glow-btn w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-lg shadow-md transition-colors duration-300 mt-2"
                  >
                    Register Patient Record
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB: SCHEDULING / BOOKING & CHECKIN (RECEPTIONIST & ADMIN)
            ============================================================== */}
        {activeTab === 'book' && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Book Appointment Card */}
            <div className="glass p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <CalendarDays className="h-5 w-5 text-indigo-600" />
                Schedule Appointment Slot
              </h3>

              {/* Form submit confirmation banners */}
              {bookingMessage && (
                <div className={`p-3 text-sm rounded-lg mb-4 ${bookingMessage.startsWith('Success') ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' : 'bg-rose-500/15 text-rose-500 border border-rose-500/20'}`}>
                  {bookingMessage}
                </div>
              )}

              {/* Book Appointment submission form */}
              <form onSubmit={handleBookAppointment} className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {/* Patient selection option list */}
                <div>
                  <label className="block mb-1">Select Registered Patient*</label>
                  <select
                    required
                    value={bookingPatientId}
                    onChange={(e) => setBookingPatientId(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.phoneNumber})</option>
                    ))}
                  </select>
                  <span className="text-xxs text-slate-400 block mt-1">If client is missing, register them in the Directory tab first.</span>
                </div>

                {/* Doctor selection options list */}
                <div>
                  <label className="block mb-1">Select Physician*</label>
                  <select
                    required
                    value={bookingDoctorId}
                    onChange={(e) => setBookingDoctorId(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                  >
                    <option value="">-- Choose Physician --</option>
                    {doctorsList.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} - {d.specialization} (${d.consultationFee})</option>
                    ))}
                  </select>
                </div>

                {/* Scheduling Date & Time Picker */}
                <div>
                  <label className="block mb-1">Appointment Date & Time*</label>
                  <input
                    type="datetime-local"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                  />
                </div>

                {/* Consultation Objective field */}
                <div>
                  <label className="block mb-1">Consultation Objective / Reason</label>
                  <input
                    type="text"
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    placeholder="Regular diagnostic review, suture removal..."
                    className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="glow-btn w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-lg shadow-md transition-colors duration-300 mt-2"
                >
                  Book Appointment Slot
                </button>
              </form>
            </div>

            {/* Quick Walkin Checkin Token Board Card */}
            <div className="glass p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-indigo-600" />
                Active Direct Queue Check-In
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-semibold">
                Generate an immediate waiting token for a direct walk-in patient. Allocates active positions under selected practitioners.
              </p>

              {/* Informative description highlights */}
              <div className="space-y-6">
                <div className="p-4 rounded-xl border border-indigo-500/25 bg-indigo-500/10 text-slate-700 dark:text-slate-300 text-xs leading-5">
                  <strong>Token Generation Engine Note:</strong> Direct arrivals bypass appointments. The token engine uses a database transaction to safely increment tokens.
                  <span className="block mt-1 font-bold text-indigo-600 uppercase tracking-wide">Race condition fixed — atomic transaction used.</span>
                </div>

                {/* Form fields for direct walk-in checkin operations */}
                <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {/* Select Patient */}
                  <div>
                    <label className="block mb-1">Select Walk-in Patient*</label>
                    <select
                      id="walkin-patient"
                      className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                    >
                      <option value="">-- Choose Patient --</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Practitioner */}
                  <div>
                    <label className="block mb-1">Assign Physician*</label>
                    <select
                      id="walkin-doctor"
                      className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                    >
                      <option value="">-- Choose Physician --</option>
                      {doctorsList.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                      ))}
                    </select>
                  </div>

                  {/* Call-to-action button to check patient directly into the live calling queues */}
                  <button
                    onClick={() => {
                      const pId = document.getElementById('walkin-patient').value;
                      const dId = document.getElementById('walkin-doctor').value;
                      if (!pId || !dId) {
                        alert('Select patient and doctor first');
                        return;
                      }
                      handleQueueCheckin(pId, dId);
                    }}
                    className="glow-btn w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-500 dark:text-slate-950 dark:hover:bg-indigo-400 font-extrabold text-sm rounded-lg shadow-md transition-colors duration-300 mt-2"
                  >
                    Generate Live Token
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB: DOCTOR WORKLIST - APPOINTMENTS (DOCTOR ROLE)
            ============================================================== */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <CalendarDays className="h-5 w-5 text-indigo-600" />
                Scheduled Daily Bookings List
              </h3>

              {/* Renders appointments table or empty placeholder */}
              {doctorAppointments.length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-sm">No appointments scheduled for you today.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm text-left">
                    <thead>
                      {/* Headers */}
                      <tr className="text-slate-400 uppercase tracking-widest text-xxs font-bold border-b border-slate-200 dark:border-slate-800">
                        <th className="pb-3">Time</th>
                        <th className="pb-3">Patient</th>
                        <th className="pb-3">Consultation Reason</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {doctorAppointments.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-500/5 transition-colors">
                          {/* Appt scheduled time */}
                          <td className="py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {new Date(app.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          {/* Clickable Patient profile trigger */}
                          <td className="py-3.5">
                            <button
                              onClick={() => setSelectedPatientHistory(app.patient)}
                              className="font-bold text-indigo-600 hover:underline hover:text-indigo-700 transition-colors"
                            >
                              {app.patient ? app.patient.name : 'Unknown Patient'}
                            </button>
                            <span className="block text-xxs text-slate-400 mt-0.5">Age: {app.patient?.age}</span>
                          </td>
                          {/* Reason */}
                          <td className="py-3.5 text-slate-500 dark:text-slate-400 font-semibold">{app.reason || 'None provided'}</td>
                          {/* Status Badge */}
                          <td className="py-3.5">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xxs font-extrabold tracking-wide uppercase ${app.status === 'COMPLETED' ? 'bg-indigo-500/10 text-indigo-600' : app.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              {app.status}
                            </span>
                          </td>
                          {/* Check in / complete buttons */}
                          <td className="py-3.5 text-right space-x-2">
                            {app.status === 'PENDING' && (
                              <>
                                {/* Check patient into live queue board */}
                                <button
                                  onClick={() => {
                                    const matchedDoc = doctorsList.find((d) => d.userId === user.id);
                                    if (matchedDoc) handleQueueCheckin(app.patientId, matchedDoc.id, app.id);
                                  }}
                                  className="text-xxs px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold hover:bg-indigo-500 hover:text-white transition-colors"
                                >
                                  Check In Patient
                                </button>
                                {/* Mark appointment complete */}
                                <button
                                  onClick={() => handleCompleteAppointment(app.id)}
                                  className="text-xxs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold hover:bg-indigo-500 hover:text-white transition-colors"
                                >
                                  Complete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Patient Clinical History Modal Display card */}
            {selectedPatientHistory && (
              <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                      Medical Records: {selectedPatientHistory.name}
                    </h3>
                    <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Gender: {selectedPatientHistory.gender} | Contact: {selectedPatientHistory.phoneNumber}
                    </p>
                  </div>
                  {/* Close details card click handler */}
                  <button
                    onClick={() => setSelectedPatientHistory(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>

                {/* Medical History details box */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider">Clinical Background Information</h4>
                  {/* Optional chaining check preventing react render crash when medicalHistory yields null */}
                  <p className="text-slate-700 dark:text-slate-300 leading-5 text-sm font-semibold">
                    {selectedPatientHistory.medicalHistory?.toUpperCase() ?? 'No medical history on record.'}
                  </p>
                </div>

                {/* Navigation link to legacy details view */}
                <div className="pt-2 flex justify-between items-center text-xs">
                  <Link
                    href={`/patients/${selectedPatientHistory.id}/history-records`}
                    className="text-indigo-600 font-extrabold hover:underline flex items-center gap-1"
                  >
                    View Diagnostic Reports Details (Legacy App)
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==============================================================
            TAB: DOCTOR ACTIVE CALLING QUEUE (DOCTOR ROLE)
            ============================================================== */}
        {activeTab === 'queue' && (
          <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-indigo-600" />
              Active Operations Queue Controller
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-semibold">
              Manage patient call sequences for live monitors. Update status from waiting to active calling.
            </p>

            {/* Renders queue tokens grid */}
            {doctorQueue.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-sm">No checked-in patients in queue today.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {doctorQueue.map((t) => (
                  <div
                    key={t.id}
                    className={`p-5 rounded-2xl border shadow-md relative overflow-hidden flex flex-col justify-between ${t.status === 'CALLING' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-200 dark:border-slate-800 bg-slate-500/5'}`}
                  >
                    {/* Token detail header info */}
                    <div className="flex justify-between items-start">
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-100">Token #{t.tokenNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xxs font-extrabold tracking-wide uppercase ${t.status === 'CALLING' ? 'bg-indigo-500 text-white' : t.status === 'COMPLETED' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-amber-500/10 text-amber-500'}`}>
                        {t.status}
                      </span>
                    </div>

                    {/* Patient summary details */}
                    <div className="mt-4">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.patient.name}</h4>
                      <p className="text-xxs text-slate-400 mt-0.5">Contact: {t.patient.phoneNumber}</p>
                    </div>

                    {/* Dynamic queue status update action buttons */}
                    <div className="mt-6 flex gap-2">
                      {/* Call Patient trigger */}
                      {t.status === 'WAITING' && (
                        <button
                          onClick={() => handleUpdateQueueStatus(t.id, 'CALLING')}
                          className="flex-1 py-1.5 bg-indigo-600 text-white font-bold text-xxs rounded hover:bg-indigo-700 transition-colors"
                        >
                          Call Patient
                        </button>
                      )}
                      {/* Consulted / Skip triggers */}
                      {t.status === 'CALLING' && (
                        <>
                          {/* Completed */}
                          <button
                            onClick={() => handleUpdateQueueStatus(t.id, 'COMPLETED')}
                            className="flex-1 py-1.5 bg-indigo-600 text-white font-bold text-xxs rounded hover:bg-indigo-700 transition-colors"
                          >
                            Consulted
                          </button>
                          {/* Skipped / No Show */}
                          <button
                            onClick={() => handleUpdateQueueStatus(t.id, 'SKIPPED')}
                            className="flex-1 py-1.5 bg-rose-500/10 text-rose-500 font-bold text-xxs rounded hover:bg-rose-500 hover:text-white transition-colors"
                          >
                            Skip / No Show
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==============================================================
            TAB: SYSTEM REPORTS (ADMIN ROLE)
            ============================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
              {/* Header card details and trigger buttons */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Doctor Revenue & Operations Report
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                    System-wide practitioner performance audits. Computes completed bookings and potential sales.
                  </p>
                </div>
                {/* Generation audit reports trigger button */}
                <button
                  onClick={generateSystemReport}
                  disabled={adminReportLoading}
                  className="glow-btn px-4 py-2 bg-indigo-600 text-white font-extrabold text-xs rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {adminReportLoading ? 'Aggregating...' : 'Load Doctor System Audit Report'}
                </button>
              </div>

              {/* Dynamic conditionally compiled report views */}
              {adminReportLoading ? (
                // Loading spinners
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="pulse-loader">
                    <div></div>
                    <div></div>
                  </div>
                  <p className="mt-4 text-xs font-semibold text-slate-400 animate-pulse">
                    Loading report data...
                  </p>
                </div>
              ) : !adminReportData ? (
                // Initial placeholder text prompting user interaction
                <div className="p-8 text-center bg-slate-100 dark:bg-slate-800/40 rounded-xl text-slate-400 text-xs font-semibold border border-dashed border-slate-200 dark:border-slate-700">
                  Click the button above to load the doctor performance report.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary widgets mapping aggregations */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Metric 1: Total Doctors */}
                    <div className="p-4 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Total Physicians</span>
                      <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{adminReportData.data.length}</h4>
                    </div>
                    {/* Metric 2: Sum Appointments */}
                    <div className="p-4 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Sum Appointments</span>
                      <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                        {adminReportData.data.reduce((sum, item) => sum + item.totalAppointments, 0)}
                      </h4>
                    </div>
                    {/* Metric 3: Total Revenue */}
                    <div className="p-4 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Total Revenue ($)</span>
                      <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                        ${adminReportData.data.reduce((sum, item) => sum + item.revenue, 0)}
                      </h4>
                    </div>
                  </div>

                  {/* Table details representing detailed performance parameters per physician */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm text-left">
                      <thead>
                        {/* Headers */}
                        <tr className="text-slate-400 uppercase tracking-widest text-xxs font-bold border-b border-slate-200 dark:border-slate-800">
                          <th className="pb-3">Doctor</th>
                          <th className="pb-3">Department</th>
                          <th className="pb-3 text-center">Consultations</th>
                          <th className="pb-3 text-center">Today Queue</th>
                          <th className="pb-3 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {adminReportData.data.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-500/5 transition-colors">
                            {/* Doctor specialization info */}
                            <td className="py-3.5 font-bold text-slate-800 dark:text-slate-200">
                              {item.name}
                              <span className="block text-xxs text-indigo-600 dark:text-indigo-400 font-semibold uppercase mt-0.5">{item.specialization}</span>
                            </td>
                            {/* Department */}
                            <td className="py-3.5 text-slate-500 dark:text-slate-400">{item.department}</td>
                            {/* Consultations completed */}
                            <td className="py-3.5 text-center text-slate-500 dark:text-slate-400">
                              {item.completedAppointments} Completed / {item.totalAppointments} Total
                            </td>
                            {/* Queue count */}
                            <td className="py-3.5 text-center font-bold text-slate-800 dark:text-slate-200">{item.todayQueueSize} in queue</td>
                            {/* Financial revenue generated */}
                            <td className="py-3.5 text-right font-bold text-indigo-600 dark:text-indigo-400">${item.revenue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB: PHYSICIAN REGISTRY (ADMIN ROLE)
            ============================================================== */}
        {activeTab === 'physicians' && (
          <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                Staff Physicians Registry Lookup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                Search the physician database using safe parameterized queries.
              </p>
            </div>

            {/* Keyword Search controls */}
            <div className="flex gap-4">
              {/* input wrapper */}
              <div className="relative flex-1 rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                {/* Search input field */}
                <input
                  type="text"
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  placeholder="Search physician by name..."
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Click handler searching database query */}
              <button
                onClick={searchPhysiciansAdmin}
                className="glow-btn px-5 py-2 bg-slate-900 text-white dark:bg-indigo-500 dark:text-slate-950 font-bold text-xs rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-400 transition-colors"
              >
                Search Physicians
              </button>
            </div>

            {/* Doctors Result List cards grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {doctorsList.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-500/5 flex flex-col justify-between"
                >
                  <div>
                    {/* Department badge */}
                    <span className="inline-flex px-2 py-0.5 rounded text-xxs font-extrabold tracking-wide uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-2">
                      {doc.department}
                    </span>
                    {/* Physician Name */}
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100">{doc.name}</h4>
                    {/* Specialization */}
                    <p className="text-xs text-slate-400 mt-0.5">{doc.specialization}</p>
                  </div>
                  {/* Experience and fees footer values */}
                  <div className="mt-6 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex justify-between items-center text-xs font-semibold text-slate-500">
                    <span>Exp: {doc.experience} yrs</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Fee: ${doc.consultationFee}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}