'use client';

// Import essential React context hooks and state hooks
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
// Import dynamic router hook from Next.js for client redirects
import { useRouter } from 'next/navigation';

// Instantiate the Authentication React context object
const AuthContext = createContext();

// Create the top-level AuthProvider component to wrap our layouts
export function AuthProvider({ children }) {
  // Unified state to store authentication details
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    loading: true,
  });
  // State to record any authentication requests exceptions text
  const [error, setError] = useState(null);
  // Instantiate the Next.js client router controller
  const router = useRouter();

  // Configure the API base endpoint dynamically from environment variables
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // Define credentials logout cleanup helper with useCallback
  const logout = useCallback(() => {
    // Delete token from browser storage
    localStorage.removeItem("haqms_token");
    // Delete user profile payload from browser storage
    localStorage.removeItem("haqms_user");
    // Purge credentials context state atomically
    setAuthState({
      token: null,
      user: null,
      loading: false,
    });
    // Redirect unauthenticated user back to Sign In page
    router.push("/login");
  }, [router]);

  // Check for existing cached credentials on layout mounts asynchronously to prevent cascading renders
  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (!isMounted) return;
      const savedToken = localStorage.getItem("haqms_token");
      const savedUser = localStorage.getItem("haqms_user");
      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setAuthState({
            token: savedToken,
            user: parsedUser,
            loading: false,
          });
          return;
        } catch (e) {
          console.error("Failed to parse user details from localStorage", e);
          logout();
          return;
        }
      }
      setAuthState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
    });

    return () => {
      isMounted = false;
    };
  }, [logout]);

  // Define authentication submission method handler
  const login = async (email, password) => {
    // Flag authenticating loader
    setAuthState((prev) => ({ ...prev, loading: true }));
    // Purge previous validation errors
    setError(null);
    try {
      // POST user credentials to backend auth API endpoint
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      // Extract response payload
      const data = await response.json();
      // Throw descriptive error if status code is non-200
      if (!response.ok) throw new Error(data.error || "Authentication failed");

      // Extract token and user details from successful payload
      const userToken = data.data.token;
      const userData = data.data.user;

      // Cache details in persistent browser localStorage
      localStorage.setItem("haqms_token", userToken);
      localStorage.setItem("haqms_user", JSON.stringify(userData));
      
      // Update local context states atomically
      setAuthState({
        token: userToken,
        user: userData,
        loading: false,
      });
      
      // Redirect authenticated user to Dashboard view
      router.push("/dashboard");
      return { success: true };
    } catch (e) {
      // Print login error trace to console
      console.error("[AUTH-ERROR] Login request failed:", e);
      // Update context validation error state
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      // Release client loading flag
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Define registration API submission handler
  const register = async (name, email, password, role = "RECEPTIONIST") => {
    // Flag client authentication loading indicator
    setAuthState((prev) => ({ ...prev, loading: true }));
    // Purge previous state errors
    setError(null);
    try {
      // POST new profile data to backend registration API endpoint
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
      });
      // Extract response data
      const data = await response.json();
      // Throw exception if backend returns registration validation failures
      if (!response.ok) throw new Error(data.error || "Registration failed");
      // Seamlessly log the user in immediately after successful registration
      return login(email, password);
    } catch (e) {
      // Cache registration exception details
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      // Release loading flag
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    // Expose authentication states and handlers context-wide
    <AuthContext.Provider value={{ 
      user: authState.user, 
      token: authState.token, 
      loading: authState.loading, 
      error, 
      login, 
      register, 
      logout, 
      API_BASE_URL 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Expose custom hook for simple context consumption in child components
export function useAuth() {
  return useContext(AuthContext);
}