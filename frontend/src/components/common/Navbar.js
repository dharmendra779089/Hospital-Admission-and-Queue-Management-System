'use client';

// Import useAuth custom context hook to access active user context
import { useAuth } from '@/context/AuthContext';
// Import next/link to handle SPA navigation links
import Link from 'next/link';
// Import Lucide icons for UI navigation and role badges
import { Activity, LogOut, LayoutDashboard, MonitorPlay, Shield, LogIn } from 'lucide-react';

// Define the global navigation bar component
export default function Navbar() {
  // Extract user details object and logout callback handler from authentication context
  const { user, logout } = useAuth();

  return (
    // Render navigation header styled with clean white background and crisp border
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Branding Home Link */}
        <Link href="/" className="flex items-center gap-2.5 text-indigo-600 font-black text-2xl tracking-tight">
          <Activity className="h-6 w-6 text-indigo-600 animate-pulse" />
          <span className="text-slate-900">HA<span className="text-teal-600">Q</span>MS</span>
        </Link>

        {/* Global Navigation Links */}
        <div className="flex items-center gap-6">
          {user && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-slate-500" />
              Dashboard
            </Link>
          )}
          {/* Live Queue Monitor Board Route */}
          <Link
            href="/queue"
            className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors"
          >
            <MonitorPlay className="h-4 w-4 text-slate-500" />
            Live Queue
          </Link>
        </div>

        {/* User Info & Actions Panel */}
        {user ? (
          <div className="flex items-center gap-4">
            {/* Render active user profile metadata */}
            <div className="hidden sm:flex flex-col items-end">
              {/* Display user full name */}
              <span className="text-sm font-extrabold text-slate-900">{user.name}</span>
              {/* Display active user role badge pill */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-extrabold tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Shield className="h-3 w-3 text-indigo-600" />
                {user.role}
              </span>
            </div>

            {/* Logout Action Button */}
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all duration-200 border border-rose-200 focus:outline-none"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5" />
              Staff Sign In
            </Link>
          </div>
        )}

      </div>
    </nav>
  );
}
