'use client';

// Import useAuth custom context hook to access active user context
import { useAuth } from '@/context/AuthContext';
// Import next/link to handle SPA navigation links
import { Link } from 'next/link';
// Import Lucide icons for UI navigation and role badges
import { Activity, LogOut, LayoutDashboard, MonitorPlay, Shield } from 'lucide-react';

// Define the global navigation bar component
export default function Navbar() {
  // Extract user details object and logout callback handler from authentication context
  const { user, logout } = useAuth();

  // If the user context is unauthenticated, hide the navigation bar entirely
  if (!user) return null;

  return (
    // Render navigation header styled with custom glassmorphism styles
    <nav className="glass sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shadow-sm backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Branding Home Link */}
        <Link href="/" className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-2xl tracking-tight">
          <Activity className="h-6 w-6 animate-pulse" />
          <span>HAQMS</span>
        </Link>

        {/* Global Navigation Links */}
        <div className="flex items-center gap-6">
          {/* Dashboard Route */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          {/* Live Queue Monitor Board Route */}
          <Link
            href="/queue"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <MonitorPlay className="h-4 w-4" />
            Live Queue
          </Link>
        </div>

        {/* User Info & Actions Panel */}
        <div className="flex items-center gap-4">
          {/* Render active user profile metadata */}
          <div className="hidden sm:flex flex-col items-end">
            {/* Display user full name */}
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.name}</span>
            {/* Display active user role badge pill */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xxs font-extrabold tracking-wide uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Shield className="h-3 w-3" />
              {user.role}
            </span>
          </div>

          {/* Logout Action Button */}
          <button
            onClick={logout}
            className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300 focus:outline-none"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

      </div>
    </nav>
  );
}
