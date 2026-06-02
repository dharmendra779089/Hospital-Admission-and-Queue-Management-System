// Enable client-side rendering mode for this component in the Next.js App Router
'use client';

// Import the client-side navigation component from Next.js
import Link from 'next/link';
// Import necessary modern iconography from the lucide-react icon pack
import { Activity, ShieldAlert, MonitorPlay, Users, CalendarDays, ArrowRight } from 'lucide-react';

// Define and export the main Home landing page component
export default function Home() {
  return (
    // Outer page container with flex layout, minimum full-screen height, spacing, and center alignment
    <div className="flex flex-col min-h-screen justify-between py-12 px-6 lg:px-8">
      {/* Content wrapper centered with max-width and vertical margin adaptations */}
      <div className="max-w-4xl mx-auto w-full text-center mt-12 sm:mt-20">
        {/* Dynamic status badge signifying the state of the active queue monitoring dashboard */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6 animate-pulse">
          {/* Activity pulse icon from lucide-react */}
          <Activity className="h-4 w-4" />
          Live Queue Tracking Enabled
        </div>
        
        {/* Main application title styled with vibrant, premium gradient text from Indigo to Cyan */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
          HAQMS
        </h1>
        {/* Sub-heading declaring the full project title with responsive dark-mode support */}
        <p className="text-xl sm:text-2xl font-bold mt-2 text-slate-700 dark:text-slate-200">
          Hospital Appointment & Queue Management System
        </p>
        
        {/* Descriptive context paragraph outlining the core pedagogical purpose of this application */}
        <p className="mt-6 text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Welcome to the HAQMS testing environment. This portal serves as a deliberately flawed, 
          fully functional reference application designed to evaluate software engineering candidates.
        </p>

        {/* Responsive grid container containing key workflow actions for application navigation */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 max-w-2xl mx-auto">
          {/* Card 1: Link wrapper mapping to the receptionist, doctor, and admin Login view */}
          <Link href="/login" className="group">
            {/* Interactive glassmorphic card component with hover transition translations and shadows */}
            <div className="glass p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 text-left hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1">
              {/* Icon container holding the Users symbol, shifting colors dynamically on group hover */}
              <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                <Users className="h-6 w-6" />
              </div>
              {/* Section header containing action text and an interactive sliding directional arrow */}
              <h2 className="mt-6 text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Staff Portal
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </h2>
              {/* Supporting info text explaining the access limits and roles of the login endpoint */}
              <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
                Access your specialized dashboard. Supports role-based workflows for Administrators, Doctors, and Receptionists.
              </p>
            </div>
          </Link>

          {/* Card 2: Link wrapper mapping to the live public-facing queue monitor component */}
          <Link href="/queue" className="group">
            {/* Interactive glassmorphic card mirroring the layout and micro-interactions of Card 1 */}
            <div className="glass p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 text-left hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1">
              {/* Icon container holding the MonitorPlay symbol, transitioning on hover */}
              <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                <MonitorPlay className="h-6 w-6" />
              </div>
              {/* Queue monitor header featuring an interactive sliding arrow */}
              <h2 className="mt-6 text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Live Public Monitor
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </h2>
              {/* Descriptive details outlining the real-time refresh behavior of the calling list */}
              <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
                Real-time active queue board tracking patient check-ins and calling tokens by physician. Built with live refresh.
              </p>
            </div>
          </Link>
        </div>

        {/* Attention container displaying important information regarding target evaluation bugs */}
        <div className="mt-16 glass max-w-xl mx-auto p-6 rounded-2xl border border-rose-500/20 shadow-md flex gap-4 text-left">
          {/* Rose-themed container enclosing the Alert alert symbol */}
          <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg h-fit">
            <ShieldAlert className="h-6 w-6" />
          </div>
          {/* Explanatory notes focusing on debugging goals */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Assessment Environment Notice</h3>
            <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
              This repository contains critical architectural, database performance, frontend memory, and security bugs. 
              Your evaluation criteria will measure your ability to identify, trace, profile, and fix these issues systematically.
            </p>
          </div>
        </div>
      </div>

      {/* Page footer containing copyright declaration and year helper */}
      <footer className="text-center text-slate-400 dark:text-slate-500 text-xs mt-12">
        HAQMS v1.0.0-deliberate-bugs &copy; {new Date().getFullYear()} Candidate Evaluation Framework.
      </footer>
    </div>
  );
}

