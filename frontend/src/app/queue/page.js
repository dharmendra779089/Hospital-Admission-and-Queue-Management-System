// Enable client-side rendering mode for the public monitor in Next.js App Router
'use client';

// Import essential React hooks for state and side-effects
import { useState, useEffect } from 'react';
// Import the shared navigation bar component
import Navbar from '@/components/common/Navbar';
// Import necessary Lucide icons for styling headers and notifications
import { Bell, Monitor, RefreshCw, AlertCircle } from 'lucide-react';

// Main QueueMonitor component definition
export default function QueueMonitor() {
  // State hook to store the active list of queue tokens fetched from the backend
  const [tokens, setTokens] = useState([]);
  // State hook to manage loading spinner visibility
  const [loading, setLoading] = useState(true);
  // State hook to store fetch validation or network error descriptions
  const [error, setError] = useState('');
  // State hook to keep track of the number of API poll requests completed
  const [refreshCount, setRefreshCount] = useState(0);

  // Retrieve the public backend URL from environment variables, fallback to local dev server
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Set up polling side effect with proper lifecycle cleanup and cancellation guard
  useEffect(() => {
    let isMounted = true;

    const fetchQueueData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/queue`);
        if (!res.ok) throw new Error('Failed to retrieve active token queue.');
        const data = await res.json();
        if (isMounted) {
          setTokens(Array.isArray(data) ? data : []);
          setError('');
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Queue poll fetch error:', err);
          setError(err.message || 'Unable to connect to live queue service');
          setLoading(false);
        }
      }
    };

    fetchQueueData();

    // Poll every 3 seconds
    const intervalId = setInterval(() => {
      fetchQueueData();
      if (isMounted) {
        setRefreshCount((prev) => prev + 1);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [API_BASE_URL]);

  // Transform flat list of active tokens into grouped segments structured by doctor
  const groupedTokens = tokens.reduce((groups, token) => {
    const docId = token.doctorId;
    if (!groups[docId]) {
      groups[docId] = {
        doctorName: token.doctor?.name || 'Practitioner',
        specialization: token.doctor?.specialization || 'General Practice',
        calling: null, // Stores the token currently in consultation
        waiting: [],   // Stores upcoming tokens waiting in queue
      };
    }
    // Assign token to calling slot or append to waiting list based on current status
    if (token.status === 'CALLING') {
      groups[docId].calling = token;
    } else if (token.status === 'WAITING') {
      groups[docId].waiting.push(token);
    }
    return groups;
  }, {});

  return (
    // Main full height page container
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Render persistent top navigation bar */}
      <Navbar />
      {/* Content wrapper centered with max-width limits */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8">

        {/* Dashboard header panel styled with glassmorphism */}
        <div className="glass p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Brand header labels */}
          <div className="flex items-center gap-3">
            {/* Monitor icon container */}
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Monitor className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">Live Hospital Calling Monitor</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">Real-time public token monitor. Updates automatically.</p>
            </div>
          </div>

          {/* Sync indicator pill */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xxs font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed Connected
            </span>
            <span className="text-xxs font-mono text-slate-400 font-semibold hidden sm:inline">
              Polls: #{refreshCount}
            </span>
          </div>
        </div>

        {/* Error message alert card */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic rendering branches based on data state */}
        {loading && tokens.length === 0 ? (
          // Initial load spinner
          <div className="flex flex-col items-center justify-center py-24">
            <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="mt-4 text-xs font-bold text-slate-400">Connecting to queue dispatch stream...</p>
          </div>
        ) : Object.keys(groupedTokens).length === 0 ? (
          // Empty queue display card
          <div className="glass p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
            <Bell className="h-12 w-12 text-slate-400 mx-auto animate-bounce" />
            <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-100">No Active Tokens</h3>
            <p className="mt-2 text-slate-500 text-sm max-w-md mx-auto">No patient check-ins registered for today.</p>
          </div>
        ) : (
          // Grid panel listing all active physicians with token metrics
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Map over entries of the groupedTokens dictionary */}
            {Object.entries(groupedTokens).map(([docId, docInfo]) => (
              <div key={docId} className="glass rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                {/* Doctor profile headers */}
                <div className="bg-slate-500/5 p-5 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">{docInfo.doctorName}</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mt-0.5">{docInfo.specialization}</p>
                </div>
                {/* Board metrics section */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  {/* Current calling token card section */}
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Now Calling</h4>
                    {/* Check if a patient is actively being called by this doctor */}
                    {docInfo.calling ? (
                      // Big calling card styled with pulse highlight
                      <div className="bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-2xl text-center">
                        {/* Token Number */}
                        <span className="block text-5xl font-black text-indigo-600 dark:text-indigo-400 tracking-wider animate-pulse">#{docInfo.calling.tokenNumber}</span>
                        {/* Patient Name with safe optional chaining */}
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide mt-2">
                          Patient: {docInfo.calling.patient?.name || 'Unknown Patient'}
                        </span>
                      </div>
                    ) : (
                      // Idle block indicating no active check-in slot
                      <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center">
                        <span className="block text-2xl font-extrabold text-slate-400 italic">Idle</span>
                        <span className="block text-xs font-medium text-slate-400 mt-2">No active patients being called</span>
                      </div>
                    )}
                  </div>
                  {/* List of other checked-in patient tokens currently waiting in queue */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Queue List</h4>
                    {/* Check if doctor has other patients waiting */}
                    {docInfo.waiting.length > 0 ? (
                      // Display badges for each token in the list
                      <div className="flex flex-wrap gap-2">
                        {docInfo.waiting.map((token) => (
                          <div key={token.id} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                            #{token.tokenNumber}
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Empty placeholder
                      <span className="text-xs text-slate-400 italic block">No upcoming patients in queue</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}