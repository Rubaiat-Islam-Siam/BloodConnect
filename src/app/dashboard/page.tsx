'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BloodRequestForm from '@/components/BloodRequestForm';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'DONOR' | 'ADMIN';
  bloodGroup?: string;
  location?: string;
  availableToDonate?: boolean;
}

interface BloodRequestItem {
  _id: string;
  patientId: {
    _id?: string;
    name?: string;
    email?: string;
    location?: string;
  };
  bloodGroup: string;
  units: number;
  location: string;
  contactDetails?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED';
  createdAt: string;
}

interface NotificationFeedback {
  type: string;
  title: string;
  message: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<BloodRequestItem[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [recentNotification, setRecentNotification] = useState<NotificationFeedback | null>(null);

  // Donor state toggles
  const [availableToDonate, setAvailableToDonate] = useState(true);
  const [donorLocation, setDonorLocation] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const refreshRequests = async () => {
    try {
      const reqRes = await fetch('/api/requests');
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.requests || []);
      }
    } catch (err) {
      console.error('Refresh requests error:', err);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadDashboard() {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();

        if (!res.ok || !data.user) {
          router.push('/login');
          return;
        }

        if (!isCancelled) {
          setUser(data.user);
          setAvailableToDonate(Boolean(data.user.availableToDonate));
          setDonorLocation(data.user.location || '');
        }

        const reqRes = await fetch('/api/requests');
        if (reqRes.ok && !isCancelled) {
          const reqData = await reqRes.json();
          setRequests(reqData.requests || []);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      isCancelled = true;
    };
  }, [router]);

  // Admin action handler: update request status
  const handleUpdateStatus = async (
    requestId: string,
    newStatus: 'APPROVED' | 'REJECTED' | 'FULFILLED'
  ) => {
    setActionLoadingId(requestId);
    setStatusMessage(null);
    setRecentNotification(null);

    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update request');
      }

      setStatusMessage(data.message || 'Status updated successfully');
      if (data.notification) {
        setRecentNotification(data.notification);
      }

      // Refresh list
      refreshRequests();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating request');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Donor action handler: update availability and location
  const handleSaveDonorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/donors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availableToDonate,
          location: donorLocation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update donor profile');
      }

      setStatusMessage('Donor status updated successfully!');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin text-3xl">🩸</div>
        <p className="text-gray-500 text-sm mt-3 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Bar */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-gray-900">{user.name}</h1>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                user.role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-700'
                  : user.role === 'DONOR'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {user.role} Dashboard
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{user.email}</p>
        </div>

        {user.bloodGroup && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
            <span className="text-xs uppercase font-bold text-red-700">Blood Group</span>
            <span className="text-lg font-black text-red-600">{user.bloodGroup}</span>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm font-medium">
          ✓ {statusMessage}
        </div>
      )}

      {/* Notification Factory Event Banner */}
      {recentNotification && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-sm shadow-xs space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-black tracking-wider bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
              Factory Generated: {recentNotification.type}
            </span>
            <span className="font-bold">{recentNotification.title}</span>
          </div>
          <p className="text-blue-800 text-xs">{recentNotification.message}</p>
        </div>
      )}

      
{/* =========================================================================
    ROLE 1: ADMIN VIEW
    ========================================================================= */}
{user.role === 'ADMIN' && (
  <div className="space-y-8">

    {/* Dashboard Heading */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage blood requests and keep the community connected.
        </p>
      </div>

      <span className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-4 py-2">
        <span className="font-semibold text-red-600">BloodConnect</span>
        {" "}Administration
      </span>
    </div>

    {/* Admin Stats Grid */}
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

      {/* Total Requests */}
      <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500">
            Total Requests
          </span>
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-50 text-red-600 text-xl">
            <i className="fa-solid fa-file-medical"></i>
          </div>
        </div>
        <p className="text-3xl font-extrabold text-gray-900 mt-4">
          {requests.length}
        </p>
        <p className="text-xs text-gray-400 mt-1">All blood requests</p>
      </div>

      {/* Pending */}
      <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500">
            Pending
          </span>
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 text-xl">
            <i className="fa-solid fa-clock"></i>
          </div>
        </div>
        <p className="text-3xl font-extrabold text-amber-600 mt-4">
          {requests.filter((r) => r.status === 'PENDING').length}
        </p>
        <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
      </div>

      {/* Approved */}
      <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500">
            Approved
          </span>
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-xl">
            <i className="fa-solid fa-circle-check"></i>
          </div>
        </div>
        <p className="text-3xl font-extrabold text-emerald-600 mt-4">
          {requests.filter((r) => r.status === 'APPROVED').length}
        </p>
        <p className="text-xs text-gray-400 mt-1">Approved requests</p>
      </div>

      {/* Fulfilled */}
      <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500">
            Fulfilled
          </span>
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-xl">
            <i className="fa-solid fa-box"></i>
          </div>
        </div>
        <p className="text-3xl font-extrabold text-blue-600 mt-4">
          {requests.filter((r) => r.status === 'FULFILLED').length}
        </p>
        <p className="text-xs text-gray-400 mt-1">Successfully fulfilled</p>
      </div>

    </div>

    {/* Blood Requests Management */}
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

      {/* Table Header */}
      <div className="px-5 md:px-6 py-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Blood Requests Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Review and manage patient blood requests.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <i className="fa-solid fa-bell"></i>
            NotificationFactory & RequestStatusObserver
          </span>
        </div>
      </div>

      {/* Empty State */}
      {requests.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl">
            <i className="fa-solid fa-inbox"></i>
          </div>
          <h3 className="font-semibold text-gray-800 mt-4">
            No blood requests yet
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            New patient requests will appear here.
          </p>
        </div>
      ) : (

        /* Responsive Table */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">

            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 font-bold">Patient</th>
                <th className="px-5 py-4 font-bold">Blood Group</th>
                <th className="px-5 py-4 font-bold">Units</th>
                <th className="px-5 py-4 font-bold">Location</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {requests.map((req) => (
                <tr
                  key={req._id}
                  className="hover:bg-gray-50/80 transition-colors"
                >

                  {/* Patient */}
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">
                      {req.patientId?.name || 'Unknown Patient'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {req.patientId?.email}
                    </p>
                  </td>

                  {/* Blood Group */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center justify-center min-w-12 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-extrabold">
                      {req.bloodGroup}
                    </span>
                  </td>

                  {/* Units */}
                  <td className="px-5 py-4 font-semibold text-gray-800">
                    {req.units}
                  </td>

                  {/* Location */}
                  <td className="px-5 py-4 text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <i className="fa-solid fa-location-dot text-gray-400"></i>
                      {req.location}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : req.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700'
                          : req.status === 'FULFILLED'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <i className={`fa-solid ${
                        req.status === 'APPROVED'
                          ? 'fa-circle-check'
                          : req.status === 'PENDING'
                          ? 'fa-clock'
                          : req.status === 'FULFILLED'
                          ? 'fa-box'
                          : 'fa-circle-xmark'
                      }`}></i>
                      {req.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">

                    {req.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={actionLoadingId === req._id}
                          onClick={() => handleUpdateStatus(req._id, 'APPROVED')}
                          className="px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Approve
                        </button>

                        <button
                          disabled={actionLoadingId === req._id}
                          onClick={() => handleUpdateStatus(req._id, 'REJECTED')}
                          className="px-3 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {req.status === 'APPROVED' && (
                      <button
                        disabled={actionLoadingId === req._id}
                        onClick={() => handleUpdateStatus(req._id, 'FULFILLED')}
                        className="px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Mark Fulfilled
                      </button>
                    )}

                    {(req.status === 'REJECTED' || req.status === 'FULFILLED') && (
                      <span className="text-xs text-gray-400 italic">
                        Completed
                      </span>
                    )}

                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      )}

      {/* Table Footer */}
      {requests.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{requests.length}</span> blood requests
          </p>
        </div>
      )}

    </div>
  </div>
)}


      {/* =========================================================================
          ROLE 2: DONOR VIEW
          ========================================================================= */}
      {user.role === 'DONOR' && (
        <div className="space-y-6">
          {/* Donor Availability & Profile Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Donor Availability & Profile</h2>

            <form onSubmit={handleSaveDonorProfile} className="space-y-4 max-w-lg">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="availToggle"
                  checked={availableToDonate}
                  onChange={(e) => setAvailableToDonate(e.target.checked)}
                  className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <label htmlFor="availToggle" className="text-sm font-medium text-gray-800">
                  I am currently healthy and available to donate blood
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Primary Location / District
                </label>
                <input
                  type="text"
                  value={donorLocation}
                  onChange={(e) => setDonorLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="py-2 px-5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
              >
                {savingProfile ? 'Saving Changes...' : 'Update Donor Profile'}
              </button>
            </form>
          </div>

          {/* ── Pending Requests — Donor can Accept ─────────────────────────── */}
          <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  🟡 Pending Requests — Waiting for a Donor
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Click <strong>Accept Request</strong> to confirm you will donate. The patient will immediately see the status change to <span className="text-emerald-700 font-semibold">APPROVED</span>.
                </p>
              </div>
            </div>

            {requests.filter((r) => r.status === 'PENDING').length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <span className="text-3xl">✅</span>
                <p className="text-sm text-gray-500 mt-2">No pending requests right now. Check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests
                  .filter((r) => r.status === 'PENDING')
                  .map((r) => (
                    <div
                      key={r._id}
                      className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex flex-col gap-3"
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-lg font-black bg-white text-red-600 border border-red-200 shadow-xs">
                            {r.bloodGroup}
                          </span>
                          <div>
                            <p className="font-bold text-gray-900 leading-tight">
                              {r.units} {r.units === 1 ? 'Unit' : 'Units'} Needed
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Patient: {r.patientId?.name || 'Anonymous'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          PENDING
                        </span>
                      </div>

                      {/* Details */}
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>📍 <span className="font-medium text-gray-800">{r.location}</span></p>
                        {r.contactDetails && (
                          <p>📞 {r.contactDetails}</p>
                        )}
                        <p className="text-gray-400">
                          Submitted: {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-amber-200">
                        <button
                          disabled={actionLoadingId === r._id}
                          onClick={() => handleUpdateStatus(r._id, 'APPROVED')}
                          className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {actionLoadingId === r._id ? (
                            <>⏳ Accepting...</>
                          ) : (
                            <>✅ Accept Request — I Will Donate</>
                          )}
                        </button>
                        <a
                          href={`mailto:${r.patientId?.email || ''}?subject=Regarding Blood Donation for ${r.bloodGroup}&body=Hello, I saw your blood request on BloodConnect and I am willing to donate ${r.bloodGroup} blood.`}
                          className="px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          📧 Contact
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* ── Approved Requests — already accepted ────────────────────────── */}
          {requests.filter((r) => r.status === 'APPROVED').length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-gray-900">
                🟢 Accepted Requests — Awaiting Donation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests
                  .filter((r) => r.status === 'APPROVED')
                  .map((r) => (
                    <div
                      key={r._id}
                      className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-extrabold text-emerald-700 text-sm">
                          {r.bloodGroup} — {r.units} Unit(s)
                        </span>
                        <p className="text-xs text-gray-600 mt-0.5">📍 {r.location}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Patient: {r.patientId?.name || 'N/A'}
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        APPROVED
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          ROLE 3: PATIENT VIEW
          ========================================================================= */}
      {user.role === 'PATIENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <BloodRequestForm onSuccess={refreshRequests} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-lg font-bold text-gray-900 mb-4">My Submitted Requests</h2>

              {requests.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  You have not submitted any blood requests yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((r) => (
                    <div
                      key={r._id}
                      className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-red-600">{r.bloodGroup}</span>
                          <span className="text-xs text-gray-500">• {r.units} units</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">📍 {r.location}</p>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === 'FULFILLED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
