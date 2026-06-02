// Specify that this component uses Next.js client-side rendering capabilities
'use client';

// Import next/link to handle fast client-side transitions between routes
import Link from 'next/link';
// Import modern iconography from the lucide-react package for UI indicators
import { Activity, MonitorPlay, Users, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';

/**
 * HaqmsLogo - Custom SVG component reproducing the logo from the hospital image.
 * Renders a gradient medical cross intersected by a rising trend line/arrow, 
 * alongside bar charts representing queue metrics and a top plus icon.
 */
function HaqmsLogo({ className = "h-20 w-20" }) {
  return (
    // Render the SVG canvas with fluid aspect ratio scaling
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Core color gradient mapping deep corporate navy to a vibrant medical teal/cyan */}
        <linearGradient id="logo-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0f4c81" />
          <stop offset="60%" stopColor="#1b9e9c" />
          <stop offset="100%" stopColor="#3cd1c4" />
        </linearGradient>
      </defs>
      
      {/* Draw the main medical cross outline with rounded corners and custom gradient stroke */}
      <path 
        d="M 38 18 H 62 V 38 H 82 V 62 H 62 V 82 H 38 V 62 H 18 V 38 H 38 Z" 
        stroke="url(#logo-grad)" 
        strokeWidth="6.5" 
        strokeLinejoin="round" 
        strokeLinecap="round"
      />
      
      {/* Draw the plus (+) sign representing healthcare in the top quadrant */}
      <path 
        d="M 50 25 V 31 M 47 28 H 53" 
        stroke="url(#logo-grad)" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />
      
      {/* Draw two vertical bars representing queue analytics in the left quadrant */}
      <line x1="26" y1="52" x2="26" y2="45" stroke="url(#logo-grad)" strokeWidth="3" strokeLinecap="round" />
      <line x1="31" y1="52" x2="31" y2="41" stroke="url(#logo-grad)" strokeWidth="3" strokeLinecap="round" />
      
      {/* Draw two vertical bars representing queue analytics in the right quadrant */}
      <line x1="69" y1="52" x2="69" y2="41" stroke="url(#logo-grad)" strokeWidth="3" strokeLinecap="round" />
      <line x1="74" y1="52" x2="74" y2="47" stroke="url(#logo-grad)" strokeWidth="3" strokeLinecap="round" />
      
      {/* Draw the rising trend curve charting performance through the center of the cross */}
      <path 
        d="M 23 54 C 28 54, 33 58, 38 52 C 43 46, 48 36, 53 40 C 58 44, 68 28, 77 19" 
        stroke="url(#logo-grad)" 
        strokeWidth="5" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Draw the arrowhead breaking out of the upper right quadrant of the cross */}
      <path 
        d="M 68 19 H 77 V 28" 
        stroke="url(#logo-grad)" 
        strokeWidth="5" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Define and export the main Home landing page component
export default function Home() {
  return (
    // Outer flex wrapper structured with full screen height and a subtle gradient background
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      
      {/* Split grid container: Single column on small viewports, 12-column grid on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center max-w-7xl mx-auto px-6 py-12 lg:py-24 w-full flex-grow">
        
        {/* Left Branding & Interactive Actions Panel (occupies 7 columns on desktop) */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
          
          {/* Logo and Typography Branding Block */}
          <div className="flex flex-col space-y-4">
            {/* Horizontal alignment of the custom SVG logo and styled system title */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Custom SVG logo utilizing the gradient definitions */}
              <HaqmsLogo className="h-20 w-20 sm:h-24 sm:w-24 drop-shadow-md flex-shrink-0 animate-fade-in" />
              {/* Large styled title block matching the color splits of the physical reception logo */}
              <div className="flex flex-col">
                <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none flex">
                  {/* HA letters in dark blue (light mode) or bright cyan (dark mode) */}
                  <span className="text-[#0f4c81] dark:text-[#3cd1c4] transition-colors">HA</span>
                  {/* Q letter in the signature teal color */}
                  <span className="text-[#1b9e9c]">Q</span>
                  {/* MS letters in deep slate (light mode) or clean white (dark mode) */}
                  <span className="text-slate-800 dark:text-slate-100 transition-colors">MS</span>
                </h1>
                {/* Uppercase description block with letter spacing matching the wall layout */}
                <span className="text-xs sm:text-sm font-extrabold tracking-widest text-[#0f4c81]/70 dark:text-slate-400 mt-2 uppercase">
                  Hospital Admission & Queue Management System
                </span>
              </div>
            </div>
          </div>

          {/* Introductory Narrative Paragraph detailing the platform utility */}
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
              Transforming patient workflows with modern queue management.
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Welcome to the HAQMS testing environment. This dashboard enables administrators, 
              doctors, and receptionists to coordinate admissions, structure real-time queues, 
              and display live token boards for patients.
            </p>
          </div>

          {/* Quick Informational Badges Row */}
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="h-4 w-4" />
              Secure Role-Based Access
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
              <HeartPulse className="h-4 w-4" />
              Real-Time Slot Scheduling
            </span>
          </div>

          {/* Action Cards Grid Section */}
          <div className="grid gap-6 sm:grid-cols-2 max-w-2xl pt-4">
            
            {/* Staff Portal Action Card */}
            <Link href="/login" className="group">
              <div className="glass p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 hover:border-[#1b9e9c]/50 hover:shadow-[#1b9e9c]/10 transition-all duration-300 transform hover:-translate-y-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                {/* Glowing Circle Icon Container for Staff Portal */}
                <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  <Users className="h-6 w-6" />
                </div>
                {/* Title Header with micro-animated directional arrow */}
                <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  Staff Portal
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-[#1b9e9c]" />
                </h3>
                {/* Subtext description of role-based credentials */}
                <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Log in to manage patient admissions, assign appointments, and control doctor consultation queues.
                </p>
              </div>
            </Link>

            {/* Live Public Monitor Action Card */}
            <Link href="/queue" className="group">
              <div className="glass p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 hover:border-[#1b9e9c]/50 hover:shadow-[#1b9e9c]/10 transition-all duration-300 transform hover:-translate-y-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                {/* Glowing Circle Icon Container for Live Board */}
                <div className="p-3 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl w-fit group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                  <MonitorPlay className="h-6 w-6" />
                </div>
                {/* Title Header with animated sliding arrow */}
                <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  Live Public Monitor
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-[#1b9e9c]" />
                </h3>
                {/* Subtext describing the real-time refresh queue board */}
                <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  View the active clinic queue. Patients can monitor live calling numbers and estimated wait times.
                </p>
              </div>
            </Link>

          </div>

        </div>

        {/* Right Reception Desk Visual Section (occupies 5 columns on desktop) */}
        <div className="lg:col-span-5 relative w-full h-[320px] sm:h-[450px] lg:h-[550px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800/80 group">
          
          {/* Main Visual Image representing the hospital reception environment */}
          <img 
            src="/hero-reception.png" 
            alt="HAQMS Hospital Reception Desk" 
            className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
          />

          {/* Floating live status badge placed at the top-right corner of the image card */}
          <div className="absolute top-4 right-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
            <Activity className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
            <span>Live System Active</span>
          </div>

          {/* Floating glassmorphic info bar placed at the bottom edge of the image card */}
          <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/10 text-white flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Location Code</span>
              <span className="text-sm font-semibold">Central Reception Desk A</span>
            </div>
            <div className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
          </div>

        </div>

      </div>

    </div>
  );
}
