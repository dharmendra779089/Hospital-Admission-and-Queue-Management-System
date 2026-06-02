'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/common/Navbar';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Activity, 
  FileText, 
  Printer, 
  HeartPulse, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function PatientHistoryRecords({ params }) {
  // In Next.js App Router, params is a Promise that must be unwrapped
  const unwrappedParams = use(params);
  const patientId = unwrappedParams.id;

  const { token, API_BASE_URL } = useAuth();
  const router = useRouter();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printSuccess, setPrintSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchPatientData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error('Failed to retrieve patient clinical records.');
        }
        const data = await res.json();
        setPatient(data);
      } catch (err) {
        console.error('History fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, token, API_BASE_URL, router]);

  const handlePrint = () => {
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 3000);
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Navbar />
      
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Registry Dashboard
          </button>
          
          {patient && (
            <button
              onClick={handlePrint}
              className="glow-btn flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-500 dark:text-slate-950 dark:hover:bg-indigo-400 font-extrabold text-xs rounded-xl shadow-md transition-all duration-300"
            >
              <Printer className="h-4 w-4" />
              Print Diagnostic History
            </button>
          )}
        </div>

        {printSuccess && (
          <div className="p-3 mb-6 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center gap-2 text-xs font-bold animate-pulse">
            <CheckCircle2 className="h-4 w-4" />
            Generating report printing payload...
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="pulse-loader">
              <div></div>
              <div></div>
            </div>
            <p className="mt-4 text-xs font-semibold text-slate-400 animate-pulse">
              Synchronizing clinical archive...
            </p>
          </div>
        ) : error ? (
          <div className="glass p-8 text-center rounded-2xl border border-rose-500/20 max-w-md mx-auto">
            <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Access Failure</h3>
            <p className="mt-2 text-slate-500 text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Patient Header Block */}
            <div className="glass p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 text-indigo-500">
                <HeartPulse className="h-24 w-24" />
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-inner">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <span className="text-xxs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      Legacy App Clinical File
                    </span>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2.5 leading-tight">
                      {patient.name}
                    </h1>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 text-xs text-center border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-4 sm:pt-0 sm:pl-8">
                  <div>
                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-xxs">Age</span>
                    <span className="block text-lg font-black text-slate-800 dark:text-slate-200 mt-1">{patient.age} yrs</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-xxs">Sex</span>
                    <span className="block text-lg font-black text-slate-800 dark:text-slate-200 mt-1 capitalize">{patient.gender}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase tracking-wider text-xxs">Contact</span>
                    <span className="block text-lg font-black text-slate-800 dark:text-slate-200 mt-1 font-mono">{patient.phoneNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Medical Archive Block */}
            <div className="grid gap-8 md:grid-cols-3">
              
              {/* Medical History Sidebar */}
              <div className="glass p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 h-fit space-y-4">
                <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-indigo-600" />
                  Clinical Anamnesis
                </h3>
                <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200 dark:border-slate-800/60">
                  <p className="text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
                    {patient.medicalHistory || 'No baseline medical history recorded on file.'}
                  </p>
                </div>
              </div>

              {/* Chronological Consultation Timeline */}
              <div className="md:col-span-2 glass p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 space-y-6">
                <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-indigo-600" />
                  Consultation Archive Timeline
                </h3>

                {!patient.appointments || patient.appointments.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs font-semibold text-slate-400">No appointments recorded for this patient.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-8">
                    {patient.appointments.map((appt) => (
                      <div key={appt.id} className="relative group">
                        
                        {/* Timeline Connector Dot */}
                        <span className={`absolute -left-9 top-1.5 p-1 rounded-full border bg-slate-50 dark:bg-slate-950 transition-all ${appt.status === 'COMPLETED' ? 'border-indigo-500 text-indigo-500' : appt.status === 'CANCELLED' ? 'border-rose-500 text-rose-500' : 'border-amber-500 text-amber-500'}`}>
                          <div className="h-2 w-2 rounded-full bg-current" />
                        </span>

                        <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 dark:hover:border-indigo-500/20 hover:shadow-md transition-all duration-300">
                          <div className="flex justify-between items-start gap-4 flex-wrap">
                            <span className="text-xxs font-mono font-bold text-slate-400 flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(appt.appointmentDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xxs font-extrabold uppercase tracking-wide ${appt.status === 'COMPLETED' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : appt.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              {appt.status}
                            </span>
                          </div>
                          
                          <div className="mt-4">
                            <span className="block text-slate-400 font-bold uppercase tracking-wider text-xxs">Objective / Clinical Reason</span>
                            <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {appt.reason || 'Routine general wellness review'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
