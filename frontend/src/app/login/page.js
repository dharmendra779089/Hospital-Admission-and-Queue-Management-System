// Enable client-side rendering mode for the login component in Next.js App Router
'use client';

// Import the useState hook from React to manage local state
import { useState } from 'react';
// Import the custom authentication hook to access session management functionality
import { useAuth } from '@/context/AuthContext';
// Import client-side router navigation linkages
import Link from 'next/link';
// Import required iconography from lucide-react
import { User, Lock, Activity, Eye, EyeOff } from 'lucide-react';

// Main Login component definition
export default function Login() {
  // Destructure login mutation handler, error state, and request loading state from the Auth context
  const { login, error: authError, loading } = useAuth();
  // State hook to store the current user email string
  const [email, setEmail] = useState('');
  // State hook to store the current user password string
  const [password, setPassword] = useState('');
  // State hook to toggle password visibility in the UI input field
  const [showPassword, setShowPassword] = useState(false);
  
  // State hook to manage local form validation feedback errors
  const [validationError, setValidationError] = useState('');

  // Form submission handler
  const handleSubmit = async (e) => {
    // Prevent the default browser form reload action
    e.preventDefault();
    // Clear any previous validation errors from the UI state
    setValidationError('');

    // INCONSISTENT VALIDATION BUG:
    // Simple basic regex that is flawed (e.g. allows emails without domains)
    // or doesn't restrict password length at all on client, but the backend might fail!
    // Regular expression pattern for basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+$/;
    // Check if the email field is empty
    if (!email) {
      // Set local validation warning message
      setValidationError('Please enter your email address.');
      // Stop execution
      return;
    }
    
    // Check if the entered email matches the regular expression pattern
    if (!emailRegex.test(email)) {
      // Set local validation warning message
      setValidationError('Please enter a valid email format.');
      // Stop execution
      return;
    }

    // Notice we do NOT check password length here (even though registration requires it),
    // causing inconsistent user experiences and letting brute force slide.
    
    // Execute login action within the authentication context
    const result = await login(email, password);
    // If the login request fails, update validation error state
    if (!result.success) {
      // Capture error description from the result payload or fallback to generic text
      setValidationError(result.error || 'Invalid credentials');
    }
  };

  return (
    // Centered flexbox container supporting dark mode text/background configurations
    <div className="flex flex-col min-h-screen justify-center items-center py-12 px-6 lg:px-8">
      {/* Brand headers with responsive grid sizes */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Clickable link pointing to the landing page */}
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-3xl">
          {/* Animated pulse activity icon */}
          <Activity className="h-8 w-8 animate-pulse" />
          HAQMS
        </Link>
        {/* Main form description heading */}
        <h2 className="mt-6 text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          Sign in to your account
        </h2>
        {/* Subtitle helper directing candidates to pre-seeded mock user profiles */}
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Or use one of the pre-seeded credentials in the README
        </p>
      </div>

      {/* Login container holding the glassmorphic form card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Premium glassmorphic container styled with subtle borders and shadows */}
        <div className="glass py-8 px-6 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800">
          {/* Main submit form executing the handleSubmit callback */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Conditional warning box rendered if local validation or authentication errors exist */}
            {(validationError || authError) && (
              <div className="p-3 text-sm bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg">
                {/* Print the active error value */}
                {validationError || authError}
              </div>
            )}

            {/* Email Input Field Group */}
            <div>
              {/* Field Label */}
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              {/* Input Wrapper containing inline icon spacing */}
              <div className="mt-1 relative rounded-lg shadow-sm">
                {/* Absolute positioned icon container */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                {/* Standard input field styled with focus glow effects */}
                <input
                  id="email"
                  name="email"
                  type="text" // Inconsistent: using text instead of email type to disable native validations
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  placeholder="admin@haqms.com"
                />
              </div>
            </div>

            {/* Password Input Field Group */}
            <div>
              {/* Field Label */}
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              {/* Input Wrapper containing inline icon and view toggle button spacing */}
              <div className="mt-1 relative rounded-lg shadow-sm">
                {/* Absolute positioned prefix Lock icon */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                {/* Password field dynamic type swapping */}
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  placeholder="••••••••"
                />
                {/* Suffix button allowing user to show/hide plaintext password digits */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {/* Swap icons depending on state */}
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Action submit button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="glow-btn w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 disabled:opacity-50"
              >
                {/* Render spinner state text when request is pending */}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Quick seeded login panel for convenient QA evaluations */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Seeded Demo Credentials</h4>
            {/* Grid containing preset credentials buttons */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Preset 1: Admin */}
              <button
                type="button"
                onClick={() => { setEmail('admin@haqms.com'); setPassword('password123'); }}
                className="text-left p-2 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-300"
              >
                <strong>Admin:</strong> admin@haqms.com
              </button>
              {/* Preset 2: Receptionist */}
              <button
                type="button"
                onClick={() => { setEmail('reception1@haqms.com'); setPassword('password123'); }}
                className="text-left p-2 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-300"
              >
                <strong>Receptionist:</strong> reception1@haqms.com
              </button>
              {/* Preset 3: Doctor */}
              <button
                type="button"
                onClick={() => { setEmail('doctor1@haqms.com'); setPassword('password123'); }}
                className="text-left p-2 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-600 dark:text-slate-300"
              >
                <strong>Doctor:</strong> doctor1@haqms.com
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

