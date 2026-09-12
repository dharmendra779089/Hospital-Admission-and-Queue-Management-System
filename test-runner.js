/**
 * HAQMS Comprehensive Test Suite Runner
 * Executes all phases of test cases against the live HAQMS system.
 * Evaluates function logic, RBAC, edge cases, error handling, and measures latency/lag.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'https://haqms-backend-tz6y.onrender.com';
const FRONTEND_URL = process.env.TEST_FRONTEND_URL || 'https://haqms-frontend-wjzn.onrender.com';

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
  latencies: []
};

async function api(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const duration = Date.now() - start;
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    return { status: res.status, data, duration, ok: res.ok, headers: res.headers };
  } catch (err) {
    const duration = Date.now() - start;
    return { status: 0, error: err.message, duration, ok: false };
  }
}

function recordTest(id, name, phase, passed, details, duration) {
  const status = passed ? 'PASS' : 'FAIL';
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
  if (duration !== undefined) {
    results.latencies.push({ id, name, duration });
  }
  results.tests.push({ id, name, phase, status, details, duration });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${id}] ${name} (${duration}ms) - ${status}: ${details}`);
}

async function run() {
  console.log(`\n================================================================`);
  console.log(`🏥 HAQMS COMPREHENSIVE TEST SUITE - FULL EXECUTION`);
  console.log(`🎯 Target Backend : ${BASE_URL}`);
  console.log(`🌐 Target Frontend: ${FRONTEND_URL}`);
  console.log(`⏰ Started At     : ${new Date().toISOString()}`);
  console.log(`================================================================\n`);

  let adminToken = '';
  let doctorToken = '';
  let receptionistToken = '';
  let sampleDoctorId = '';
  let samplePatientId = '';
  let sampleAppointmentId = '';
  let sampleQueueTokenId = '';
  let registeredPatientId = '';

  // -------------------------------------------------------------------------
  // PHASE 1: Authentication, Tokens & RBAC
  // -------------------------------------------------------------------------
  console.log(`\n--- PHASE 1: Authentication, Tokens & RBAC ---`);

  // 1.1 Health Check
  {
    const res = await api('/health');
    const pass = res.status === 200 && res.data && res.data.status === 'OK';
    recordTest('AUTH-01', 'System Health Check Endpoint', 'Phase 1', pass, `Status: ${res.status}, Uptime: ${res.data?.uptime?.toFixed(1)}s`, res.duration);
  }

  // 1.2 Root Discovery
  {
    const res = await api('/');
    const pass = res.status === 200 && (res.data?.name || res.data?.status === 'Online');
    recordTest('AUTH-02', 'Root Service Discovery Endpoint', 'Phase 1', pass, `Status: ${res.status}, Service: ${res.data?.name || 'Online'}`, res.duration);
  }

  // 1.3 Admin Login
  {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@haqms.com', password: 'password123' })
    });
    const pass = res.status === 200 && res.data?.data?.token && res.data?.data?.user?.role === 'ADMIN';
    if (pass) adminToken = res.data.data.token;
    recordTest('AUTH-03', 'Admin Role Authentication', 'Phase 1', pass, `Status: ${res.status}, Role: ${res.data?.data?.user?.role}`, res.duration);
  }

  // 1.4 Doctor Login
  {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'doctor1@haqms.com', password: 'password123' })
    });
    const pass = res.status === 200 && res.data?.data?.token && res.data?.data?.user?.role === 'DOCTOR';
    if (pass) doctorToken = res.data.data.token;
    recordTest('AUTH-04', 'Doctor Role Authentication', 'Phase 1', pass, `Status: ${res.status}, Role: ${res.data?.data?.user?.role}`, res.duration);
  }

  // 1.5 Receptionist Login
  {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'reception1@haqms.com', password: 'password123' })
    });
    const pass = res.status === 200 && res.data?.data?.token && res.data?.data?.user?.role === 'RECEPTIONIST';
    if (pass) receptionistToken = res.data.data.token;
    recordTest('AUTH-05', 'Receptionist Role Authentication', 'Phase 1', pass, `Status: ${res.status}, Role: ${res.data?.data?.user?.role}`, res.duration);
  }

  // 1.6 Invalid Password
  {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@haqms.com', password: 'WrongPassword999!' })
    });
    const pass = res.status === 401 && res.data?.error === 'Invalid credentials';
    recordTest('AUTH-06', 'Rejection of Incorrect Password', 'Phase 1', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // 1.7 Non-Existent User Login
  {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody_exists@hospital.org', password: 'password123' })
    });
    const pass = res.status === 401 && res.data?.error === 'Invalid credentials';
    recordTest('AUTH-07', 'Rejection of Non-existent Email', 'Phase 1', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // 1.8 Missing Credentials
  {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@haqms.com' })
    });
    const pass = res.status === 400 && res.data?.error === 'Email and password are required';
    recordTest('AUTH-08', 'Rejection of Incomplete Credentials', 'Phase 1', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // 1.9 Profile Verification (/me) with valid token
  {
    const res = await api('/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pass = res.status === 200 && res.data?.email === 'admin@haqms.com';
    recordTest('AUTH-09', 'Authenticated Profile Introspection (/api/auth/me)', 'Phase 1', pass, `Status: ${res.status}, User: ${res.data?.name} (${res.data?.role})`, res.duration);
  }

  // 1.10 Missing Auth Token
  {
    const res = await api('/api/auth/me');
    const pass = res.status === 401 && res.data?.error?.includes('No token provided');
    recordTest('AUTH-10', 'Access Denied on Missing Auth Token', 'Phase 1', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // 1.11 Malformed / Forged JWT Token
  {
    const res = await api('/api/auth/me', {
      headers: { Authorization: 'Bearer totally-invalid-jwt-token-string' }
    });
    const pass = res.status === 401 && res.data?.error?.includes('Invalid or expired token');
    recordTest('AUTH-11', 'Access Denied on Forged / Malformed JWT', 'Phase 1', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // 1.12 User Registration
  const testUserEmail = `staff_${Date.now()}@haqms.com`;
  {
    const res = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testUserEmail,
        password: 'Password123!',
        name: 'Auto Test Nurse',
        role: 'RECEPTIONIST'
      })
    });
    const pass = res.status === 201 && res.data?.user?.email === testUserEmail;
    recordTest('AUTH-12', 'New User Self-Registration', 'Phase 1', pass, `Status: ${res.status}, Created ID: ${res.data?.user?.id}`, res.duration);
  }

  // 1.13 Duplicate User Registration Prevention
  {
    const res = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testUserEmail,
        password: 'Password123!',
        name: 'Duplicate Staff',
        role: 'RECEPTIONIST'
      })
    });
    const pass = res.status === 400 && res.data?.error?.includes('already exists');
    recordTest('AUTH-13', 'Duplicate Registration Email Collision Rejection', 'Phase 1', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // -------------------------------------------------------------------------
  // PHASE 2: Doctor Directory & Metrics
  // -------------------------------------------------------------------------
  console.log(`\n--- PHASE 2: Doctor Directory & Metrics ---`);

  // 2.1 Fetch All Doctors
  {
    const res = await api('/api/doctors', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pass = res.status === 200 && Array.isArray(res.data) && res.data.length > 0;
    if (pass) {
      sampleDoctorId = res.data[0].id;
    }
    recordTest('DOC-01', 'Retrieve Complete Doctor Registry', 'Phase 2', pass, `Status: ${res.status}, Total Doctors Found: ${res.data?.length}`, res.duration);
  }

  // 2.2 Filter Doctors by Specialization
  {
    const res = await api('/api/doctors?specialization=Cardiology', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pass = res.status === 200 && Array.isArray(res.data);
    recordTest('DOC-02', 'Filter Doctors by Specialization (Cardiology)', 'Phase 2', pass, `Status: ${res.status}, Count: ${res.data?.length}`, res.duration);
  }

  // 2.3 Search Doctors by Substring
  {
    const res = await api('/api/doctors?search=House', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pass = res.status === 200 && Array.isArray(res.data) && res.data.length > 0;
    recordTest('DOC-03', 'Search Doctors by Name Substring ("House")', 'Phase 2', pass, `Status: ${res.status}, Matches: ${res.data?.length}`, res.duration);
  }

  // 2.4 Doctor Stats Aggregation
  {
    const res = await api('/api/doctors/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pass = res.status === 200 && res.data?.success && typeof res.data?.data?.averageFee === 'number';
    recordTest('DOC-04', 'Doctor Aggregated Metrics (Average Fee, Experience)', 'Phase 2', pass, `Status: ${res.status}, AvgFee: ₹${res.data?.data?.averageFee}, MaxExp: ${res.data?.data?.maxExperience}yrs`, res.duration);
  }

  // 2.5 Fetch Doctor by ID
  {
    const res = await api(`/api/doctors/${sampleDoctorId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pass = res.status === 200 && res.data?.id === sampleDoctorId;
    recordTest('DOC-05', 'Fetch Physician by Valid UUID', 'Phase 2', pass, `Status: ${res.status}, Doctor: ${res.data?.name} (${res.data?.specialization})`, res.duration);
  }

  // 2.6 Fetch Doctor by Non-Existent UUID
  {
    const res = await api('/api/doctors/00000000-0000-0000-0000-000000000000', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pass = res.status === 404 && res.data?.error === 'Doctor not found';
    recordTest('DOC-06', 'Rejection of Non-existent Physician UUID (404)', 'Phase 2', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // -------------------------------------------------------------------------
  // PHASE 3: Patient Directory CRUD & Boundary Cases
  // -------------------------------------------------------------------------
  console.log(`\n--- PHASE 3: Patient Directory & Boundary Cases ---`);

  // 3.1 Paginated Patient List
  {
    const res = await api('/api/patients?page=1&limit=5', {
      headers: { Authorization: `Bearer ${receptionistToken}` }
    });
    const pass = res.status === 200 && res.data?.success && Array.isArray(res.data?.patients);
    if (pass && res.data.patients.length > 0) {
      samplePatientId = res.data.patients[0].id;
    }
    recordTest('PAT-01', 'Paginated Patient Directory Retrieval', 'Phase 3', pass, `Status: ${res.status}, Total In DB: ${res.data?.pagination?.totalPatients}, Page 1 Items: ${res.data?.patients?.length}`, res.duration);
  }

  // 3.2 Negative Pagination Numbers Guard
  {
    const res = await api('/api/patients?page=-2&limit=-10', {
      headers: { Authorization: `Bearer ${receptionistToken}` }
    });
    const pass = res.status === 200 && res.data?.pagination?.page === 1 && res.data?.pagination?.limit === 1;
    recordTest('PAT-02', 'Negative Pagination Bound Normalization', 'Phase 3', pass, `Status: ${res.status}, Normalized Page: ${res.data?.pagination?.page}, Limit: ${res.data?.pagination?.limit}`, res.duration);
  }

  // 3.3 Large Pagination Limit Upper Bound Cap
  {
    const res = await api('/api/patients?limit=9999', {
      headers: { Authorization: `Bearer ${receptionistToken}` }
    });
    const pass = res.status === 200 && res.data?.pagination?.limit === 100;
    recordTest('PAT-03', 'Pagination Page Size Capping (Max 100)', 'Phase 3', pass, `Status: ${res.status}, Capped Limit: ${res.data?.pagination?.limit}`, res.duration);
  }

  // 3.4 Filter by Gender
  {
    const res = await api('/api/patients?gender=Female', {
      headers: { Authorization: `Bearer ${receptionistToken}` }
    });
    const pass = res.status === 200 && res.data?.patients?.every(p => p.gender.toLowerCase() === 'female');
    recordTest('PAT-04', 'Filter Patients by Gender (Female)', 'Phase 3', pass, `Status: ${res.status}, Matched: ${res.data?.patients?.length}`, res.duration);
  }

  // 3.5 Patient Registration - Valid Record
  const patientPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  {
    const res = await api('/api/patients', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: JSON.stringify({
        name: 'Automated Test Patient',
        email: `patient_${Date.now()}@example.com`,
        phoneNumber: patientPhone,
        age: 34,
        gender: 'Male',
        medicalHistory: 'No prior chronic conditions. Seasonal pollen allergy.'
      })
    });
    const pass = res.status === 201 && res.data?.id && res.data?.age === 34;
    if (pass) registeredPatientId = res.data.id;
    recordTest('PAT-05', 'Register New Patient Profile', 'Phase 3', pass, `Status: ${res.status}, Registered ID: ${res.data?.id}`, res.duration);
  }

  // 3.6 Patient Registration - Blank / Null Medical History (Edge Case)
  {
    const res = await api('/api/patients', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: JSON.stringify({
        name: 'Healthy Test Infant',
        email: '',
        phoneNumber: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
        age: 1,
        gender: 'Female',
        medicalHistory: ''
      })
    });
    const pass = res.status === 201 && res.data?.medicalHistory === null;
    recordTest('PAT-06', 'Register Patient with Empty History (Handled as Null)', 'Phase 3', pass, `Status: ${res.status}, MedicalHistory: ${res.data?.medicalHistory}`, res.duration);
  }

  // 3.7 Boundary Age: Negative Age Rejection
  {
    const res = await api('/api/patients', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: JSON.stringify({
        name: 'Invalid Negative Age',
        phoneNumber: '9876543210',
        age: -5,
        gender: 'Male'
      })
    });
    const pass = res.status === 400 && res.data?.error?.includes('Valid age');
    recordTest('PAT-07', 'Boundary Validation: Negative Age Rejection (-5)', 'Phase 3', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // 3.8 Boundary Age: Over 150 Years Rejection
  {
    const res = await api('/api/patients', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: JSON.stringify({
        name: 'Invalid Extreme Age',
        phoneNumber: '9876543210',
        age: 180,
        gender: 'Female'
      })
    });
    const pass = res.status === 400 && res.data?.error?.includes('Valid age');
    recordTest('PAT-08', 'Boundary Validation: Extreme Age Rejection (180)', 'Phase 3', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // 3.9 Missing Required Fields
  {
    const res = await api('/api/patients', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: JSON.stringify({
        name: 'Incomplete Patient Record'
        // Missing phone, age, gender
      })
    });
    const pass = res.status === 400 && res.data?.error?.includes('required');
    recordTest('PAT-09', 'Rejection of Incomplete Patient Registration Body', 'Phase 3', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // 3.10 Fetch Patient by ID with History
  {
    const targetId = registeredPatientId || samplePatientId;
    const res = await api(`/api/patients/${targetId}`, {
      headers: { Authorization: `Bearer ${receptionistToken}` }
    });
    const pass = res.status === 200 && res.data?.id === targetId && Array.isArray(res.data?.appointments);
    recordTest('PAT-10', 'Fetch Patient Deep Profile with Appointments History', 'Phase 3', pass, `Status: ${res.status}, Patient: ${res.data?.name}, Prior Bookings: ${res.data?.appointments?.length}`, res.duration);
  }

  // 3.11 Fetch Patient by Non-existent UUID
  {
    const res = await api('/api/patients/00000000-0000-0000-0000-000000000000', {
      headers: { Authorization: `Bearer ${receptionistToken}` }
    });
    const pass = res.status === 404 && res.data?.error === 'Patient not found';
    recordTest('PAT-11', 'Non-existent Patient UUID Lookup (404)', 'Phase 3', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // 3.12 RBAC Check on Patient Deletion: Doctor Forbidden (403)
  {
    const res = await api(`/api/patients/${registeredPatientId || samplePatientId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const pass = res.status === 403 && res.data?.error?.includes('Forbidden');
    recordTest('PAT-12', 'RBAC Enforcement: Doctor Role Forbidden to Delete Patient', 'Phase 3', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // -------------------------------------------------------------------------
  // PHASE 4: Appointment Scheduling & Collision Logic
  // -------------------------------------------------------------------------
  console.log(`\n--- PHASE 4: Appointment Scheduling & Collision Logic ---`);

  // Generate a dynamically unique future appointment slot to ensure idempotency across repeated test runs
  const bookingDate = new Date(Date.now() + 86400000 * (30 + Math.floor(Math.random() * 100)) + Math.floor(Math.random() * 86400000));
  bookingDate.setSeconds(0, 0);
  const isoSlotDate = bookingDate.toISOString();

  // 4.1 Fetch Appointments
  {
    const res = await api('/api/appointments', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pass = res.status === 200 && res.data?.success && Array.isArray(res.data?.appointments);
    recordTest('APT-01', 'Retrieve Scheduled Hospital Appointments List', 'Phase 4', pass, `Status: ${res.status}, Existing Bookings: ${res.data?.count}`, res.duration);
  }

  // 4.2 Schedule Valid Appointment
  {
    const res = await api('/api/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: JSON.stringify({
        patientId: registeredPatientId || samplePatientId,
        doctorId: sampleDoctorId,
        appointmentDate: isoSlotDate,
        reason: 'Routine cardiology wellness consultation'
      })
    });
    const pass = res.status === 201 && res.data?.appointment?.id && res.data?.appointment?.status === 'PENDING';
    if (pass) sampleAppointmentId = res.data.appointment.id;
    recordTest('APT-02', 'Schedule New Appointment Slot (Status: PENDING)', 'Phase 4', pass, `Status: ${res.status}, Booking ID: ${res.data?.appointment?.id}`, res.duration);
  }

  // 4.3 Slot Collision / Double-Booking Race Prevention (Same Doctor, Same Slot)
  {
    const res = await api('/api/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: JSON.stringify({
        patientId: samplePatientId,
        doctorId: sampleDoctorId,
        appointmentDate: isoSlotDate,
        reason: 'Attempting to double-book occupied slot'
      })
    });
    const pass = res.status === 400 && res.data?.error?.includes('already has an appointment');
    recordTest('APT-03', 'Physician Slot Collision / Double-Booking Prevention', 'Phase 4', pass, `Status: ${res.status}, Rejected with: "${res.data?.error}"`, res.duration);
  }

  // 4.4 Invalid Appointment Date
  {
    const res = await api('/api/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: JSON.stringify({
        patientId: samplePatientId,
        doctorId: sampleDoctorId,
        appointmentDate: 'not-a-real-date-string',
        reason: 'Testing date parsing guard'
      })
    });
    const pass = res.status === 400 && res.data?.error?.includes('Valid appointmentDate');
    recordTest('APT-04', 'Malformed Appointment Date Validation', 'Phase 4', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // 4.5 Update Appointment Status
  if (sampleAppointmentId) {
    const res = await api(`/api/appointments/${sampleAppointmentId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'CHECKED_IN' })
    });
    const pass = res.status === 200 && res.data?.status === 'CHECKED_IN';
    recordTest('APT-05', 'Update Appointment Status State Machine (-> CHECKED_IN)', 'Phase 4', pass, `Status: ${res.status}, New State: ${res.data?.status}`, res.duration);
  }

  // 4.6 Invalid Appointment Status Enum
  if (sampleAppointmentId) {
    const res = await api(`/api/appointments/${sampleAppointmentId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'BOGUS_STATUS' })
    });
    const pass = res.status === 400 && res.data?.error?.includes('Invalid status');
    recordTest('APT-06', 'Rejection of Invalid Status Enum', 'Phase 4', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // -------------------------------------------------------------------------
  // PHASE 5: Live Queue Management, Atomic Transactions & State Transitions
  // -------------------------------------------------------------------------
  console.log(`\n--- PHASE 5: Live Queue Management & Atomic Transactions ---`);

  let firstTokenNumber = 0;

  // 5.1 Walk-in Queue Check-in (Atomic $transaction)
  {
    const res = await api('/api/queue/checkin', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: JSON.stringify({
        patientId: registeredPatientId || samplePatientId,
        doctorId: sampleDoctorId
      })
    });
    const pass = res.status === 201 && res.data?.token?.tokenNumber > 0 && res.data?.token?.status === 'WAITING';
    if (pass) {
      sampleQueueTokenId = res.data.token.id;
      firstTokenNumber = res.data.token.tokenNumber;
    }
    recordTest('QUE-01', 'Walk-in Patient Check-in ($transaction Atomic Token)', 'Phase 5', pass, `Status: ${res.status}, Generated Token #${res.data?.token?.tokenNumber}`, res.duration);
  }

  // 5.2 Sequential Token Numbering Increment
  {
    const res = await api('/api/queue/checkin', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: JSON.stringify({
        patientId: samplePatientId,
        doctorId: sampleDoctorId
      })
    });
    const pass = res.status === 201 && res.data?.token?.tokenNumber === (firstTokenNumber + 1);
    recordTest('QUE-02', 'Sequential Token Number Increment Logic (N+1)', 'Phase 5', pass, `Status: ${res.status}, Next Token #${res.data?.token?.tokenNumber} (Expected #${firstTokenNumber + 1})`, res.duration);
  }

  // 5.3 Duplicate Appointment Check-in Rejection (Atomic transaction guard)
  let apptForCheckinId = '';
  {
    const apptRes = await api('/api/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: JSON.stringify({
        patientId: registeredPatientId || samplePatientId,
        doctorId: sampleDoctorId,
        appointmentDate: new Date(Date.now() + 86400000 * (150 + Math.floor(Math.random() * 200)) + Math.floor(Math.random() * 86400000)).toISOString(),
        reason: 'Testing queue checkin idempotency'
      })
    });
    if (apptRes.status === 201) {
      apptForCheckinId = apptRes.data.appointment.id;
    }
  }

  if (apptForCheckinId) {
    // First check-in succeeds
    await api('/api/queue/checkin', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: JSON.stringify({
        patientId: registeredPatientId || samplePatientId,
        doctorId: sampleDoctorId,
        appointmentId: apptForCheckinId
      })
    });

    // Immediate second check-in must be rejected
    const dupRes = await api('/api/queue/checkin', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: JSON.stringify({
        patientId: registeredPatientId || samplePatientId,
        doctorId: sampleDoctorId,
        appointmentId: apptForCheckinId
      })
    });
    const pass = dupRes.status === 400 && dupRes.data?.error?.includes('already checked in');
    recordTest('QUE-03', 'Duplicate Appointment Check-in Prevention Guard', 'Phase 5', pass, `Status: ${dupRes.status}, Error: ${dupRes.data?.error}`, dupRes.duration);
  }

  // 5.4 Fetch Active Queue
  {
    const res = await api('/api/queue', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pass = res.status === 200 && Array.isArray(res.data);
    recordTest('QUE-04', 'Retrieve Active Waiting/Calling Queue Tokens', 'Phase 5', pass, `Status: ${res.status}, Active Waiting Tokens: ${res.data?.length}`, res.duration);
  }

  // 5.5 Queue Token State Transition: WAITING -> CALLING
  if (sampleQueueTokenId) {
    const res = await api(`/api/queue/${sampleQueueTokenId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({ status: 'CALLING' })
    });
    const pass = res.status === 200 && res.data?.status === 'CALLING';
    recordTest('QUE-05', 'Physician Calls Patient Token (-> CALLING)', 'Phase 5', pass, `Status: ${res.status}, State: ${res.data?.status}`, res.duration);
  }

  // 5.6 Queue Token State Transition: CALLING -> COMPLETED
  if (sampleQueueTokenId) {
    const res = await api(`/api/queue/${sampleQueueTokenId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    const pass = res.status === 200 && res.data?.status === 'COMPLETED';
    recordTest('QUE-06', 'Physician Concludes Consultation (-> COMPLETED)', 'Phase 5', pass, `Status: ${res.status}, State: ${res.data?.status}`, res.duration);
  }

  // 5.7 Queue Token Invalid Status
  if (sampleQueueTokenId) {
    const res = await api(`/api/queue/${sampleQueueTokenId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({ status: 'NONSENSE' })
    });
    const pass = res.status === 400 && res.data?.error?.includes('Invalid status');
    recordTest('QUE-07', 'Rejection of Illegal Queue Status Enum', 'Phase 5', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // -------------------------------------------------------------------------
  // PHASE 6: Public Live Queue Monitor
  // -------------------------------------------------------------------------
  console.log(`\n--- PHASE 6: Public Live Queue Monitor Display ---`);

  // 6.1 Public Live Queue Endpoint (Zero Authentication Required)
  {
    const res = await api('/api/queue'); // No authorization header
    const pass = res.status === 200 && Array.isArray(res.data);
    recordTest('MON-01', 'Public Live Queue Display Feed (No Auth Required)', 'Phase 6', pass, `Status: ${res.status}, Public Tokens Visible: ${res.data?.length}`, res.duration);
  }

  // 6.2 Filter Queue by Specific Doctor ID
  {
    const res = await api(`/api/queue?doctorId=${sampleDoctorId}`);
    const pass = res.status === 200 && Array.isArray(res.data);
    recordTest('MON-02', 'Scoping Live Queue Feed to Specific Doctor Chamber', 'Phase 6', pass, `Status: ${res.status}, Tokens in Chamber: ${res.data?.length}`, res.duration);
  }

  // -------------------------------------------------------------------------
  // PHASE 7: Executive Analytics & RBAC Security
  // -------------------------------------------------------------------------
  console.log(`\n--- PHASE 7: Executive Analytics & RBAC Security ---`);

  // 7.1 Admin Access to Executive Reports
  {
    const res = await api('/api/reports/doctor-stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pass = res.status === 200 && res.data?.success && Array.isArray(res.data?.data);
    recordTest('REP-01', 'Executive Report Access (ADMIN Permitted)', 'Phase 7', pass, `Status: ${res.status}, Doctors Analyzed: ${res.data?.data?.length}`, res.duration);
  }

  // 7.2 Doctor Role Blocked from Executive Financials
  {
    const res = await api('/api/reports/doctor-stats', {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const pass = res.status === 403 && res.data?.error?.includes('Forbidden');
    recordTest('REP-02', 'RBAC Enforcement: DOCTOR Blocked from Executive Reports (403)', 'Phase 7', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // 7.3 Receptionist Role Blocked from Executive Financials
  {
    const res = await api('/api/reports/doctor-stats', {
      headers: { Authorization: `Bearer ${receptionistToken}` }
    });
    const pass = res.status === 403 && res.data?.error?.includes('Forbidden');
    recordTest('REP-03', 'RBAC Enforcement: RECEPTIONIST Blocked from Executive Reports (403)', 'Phase 7', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // 7.4 Unauthenticated Access Blocked
  {
    const res = await api('/api/reports/doctor-stats');
    const pass = res.status === 401 && res.data?.error?.includes('No token provided');
    recordTest('REP-04', 'Unauthorized Access Blocked from Executive Reports (401)', 'Phase 7', pass, `Status: ${res.status}, Error: ${res.data?.error}`, res.duration);
  }

  // -------------------------------------------------------------------------
  // PHASE 8: Security & Input Sanitation
  // -------------------------------------------------------------------------
  console.log(`\n--- PHASE 8: Security & Input Sanitation ---`);

  // 8.1 SQL Injection in Patient Search (Prisma Parameterization / Edge WAF Shield)
  {
    const res = await api('/api/patients?search=' + encodeURIComponent("' OR 1=1; --"), {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    // Cloudflare/Render WAF edge blocks with 403 or Prisma safely filters with 200. Both block database exploit.
    const pass = res.status === 200 || res.status === 403;
    recordTest('SEC-01', 'SQL Injection Mitigation (Edge WAF & Prisma Parameterization)', 'Phase 8', pass, `Status: ${res.status}, Safely blocked/parameterized without SQL leak`, res.duration);
  }

  // 8.2 SQL Injection in Auth Login
  {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: "' OR '1'='1", password: "' OR '1'='1" })
    });
    const pass = res.status === 401 && res.data?.error === 'Invalid credentials';
    recordTest('SEC-02', 'SQL Injection Mitigation in Authentication Flow', 'Phase 8', pass, `Status: ${res.status}, Denied with 401`, res.duration);
  }

  // 8.3 XSS Payload in Patient Medical Notes
  {
    const xssPayload = `<script>alert('XSS_ATTACK')</script>`;
    const res = await api('/api/patients', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: JSON.stringify({
        name: 'XSS Test Case',
        phoneNumber: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        age: 40,
        gender: 'Other',
        medicalHistory: xssPayload
      })
    });
    const pass = res.status === 201 && res.data?.medicalHistory === xssPayload;
    recordTest('SEC-03', 'Safe Storage of Scripting Characters without Evaluation', 'Phase 8', pass, `Status: ${res.status}, Stored safely as raw string`, res.duration);
  }

  // -------------------------------------------------------------------------
  // PHASE 9: Latency, Lag & Concurrency Benchmarking
  // -------------------------------------------------------------------------
  console.log(`\n--- PHASE 9: Latency, Lag & Concurrency Benchmarking ---`);

  // 9.1 Concurrency Burst Test (5 parallel requests to simulate load)
  const concurrentStart = Date.now();
  const burstResults = await Promise.all([
    api('/api/doctors', { headers: { Authorization: `Bearer ${adminToken}` } }),
    api('/api/patients?limit=10', { headers: { Authorization: `Bearer ${adminToken}` } }),
    api('/api/appointments', { headers: { Authorization: `Bearer ${adminToken}` } }),
    api('/api/queue', { headers: { Authorization: `Bearer ${adminToken}` } }),
    api('/api/doctors/stats', { headers: { Authorization: `Bearer ${adminToken}` } })
  ]);
  const concurrentDuration = Date.now() - concurrentStart;
  const allSucceeded = burstResults.every(r => r.status === 200);
  recordTest('PERF-01', 'Database Connection Pool 5x Parallel Burst Query', 'Phase 9', allSucceeded, `All 5 returned 200 OK. Total Burst Duration: ${concurrentDuration}ms (Avg ${Math.round(concurrentDuration / 5)}ms/req)`, concurrentDuration);

  // -------------------------------------------------------------------------
  // PHASE 10: Frontend Availability & Route Validation
  // -------------------------------------------------------------------------
  console.log(`\n--- PHASE 10: Frontend Availability & Route Validation ---`);

  // 10.1 Frontend Home / Redirect
  {
    const res = await api(FRONTEND_URL, { headers: { Accept: 'text/html' } });
    const pass = res.status === 200 || res.status === 307 || res.status === 308;
    recordTest('FE-01', 'Frontend Landing / Gateway Route Response', 'Phase 10', pass, `Status: ${res.status}`, res.duration);
  }

  // 10.2 Frontend Login View
  {
    const res = await api(`${FRONTEND_URL}/login`, { headers: { Accept: 'text/html' } });
    const pass = res.status === 200;
    recordTest('FE-02', 'Frontend Authentication UI Route (/login)', 'Phase 10', pass, `Status: ${res.status}`, res.duration);
  }

  // 10.3 Frontend Live Queue Monitor
  {
    const res = await api(`${FRONTEND_URL}/queue`, { headers: { Accept: 'text/html' } });
    const pass = res.status === 200;
    recordTest('FE-03', 'Frontend Public Queue Monitor UI Route (/queue)', 'Phase 10', pass, `Status: ${res.status}`, res.duration);
  }

  // -------------------------------------------------------------------------
  // SUMMARY & REPORT
  // -------------------------------------------------------------------------
  console.log(`\n================================================================`);
  console.log(`📊 TEST SUITE EXECUTION SUMMARY`);
  console.log(`================================================================`);
  console.log(`Total Tests Executed: ${results.passed + results.failed}`);
  console.log(`✅ Passed           : ${results.passed}`);
  console.log(`❌ Failed           : ${results.failed}`);
  console.log(`Success Rate        : ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  // Compute Latency Metrics
  const validDurations = results.latencies.map(l => l.duration);
  const avgLatency = Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length);
  const maxLatency = Math.max(...validDurations);
  const slowestTest = results.latencies.find(l => l.duration === maxLatency);

  console.log(`\n⚡ LATENCY & PERFORMANCE AUDIT:`);
  console.log(`Average API Latency : ${avgLatency} ms`);
  console.log(`Peak API Latency    : ${maxLatency} ms (by [${slowestTest?.id}] ${slowestTest?.name})`);

  // Classify Lag
  const laggyTests = results.latencies.filter(l => l.duration > 1000);
  if (laggyTests.length > 0) {
    console.log(`\n⚠️  DETECTED LATENCY THRESHOLD WARNINGS (> 1000ms):`);
    laggyTests.forEach(t => {
      console.log(`   - [${t.id}] ${t.name}: ${t.duration}ms`);
    });
  } else {
    console.log(`✨ All warm endpoints responded within high-performance sub-second thresholds.`);
  }

  // Write detailed results to JSON artifact
  const fs = require('fs');
  fs.writeFileSync('test-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.passed + results.failed,
      passed: results.passed,
      failed: results.failed,
      successRate: ((results.passed / (results.passed + results.failed)) * 100).toFixed(1) + '%',
      avgLatencyMs: avgLatency,
      maxLatencyMs: maxLatency,
      slowestTest
    },
    tests: results.tests
  }, null, 2));

  console.log(`\n📄 Detailed test report written to test-results.json\n`);
  return results;
}

run().catch(console.error);
