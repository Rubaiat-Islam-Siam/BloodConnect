'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BloodRequestForm from '@/components/BloodRequestForm';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'DONOR' | 'ADMIN';
  bloodGroup?: string;
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

export default function RequestsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [requests, setRequests] = useState<BloodRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBloodGroup, setFilterBloodGroup] = useState<string>('ALL');

  const loadRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching requests');
    }
  };

  useEffect(() => {
    let isCancelled = false;

    async function initialize() {
      setLoading(true);
      setError(null);
      try {
        const [authRes, reqRes] = await Promise.all([
          fetch('/api/auth'),
          fetch('/api/requests'),
        ]);

        if (authRes.ok && !isCancelled) {
          const authData = await authRes.json();
          setUser(authData.user);
        }

        if (reqRes.ok && !isCancelled) {
          const reqData = await reqRes.json();
          setRequests(reqData.requests || []);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Error fetching data');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    initialize();
    return () => {
      isCancelled = true;
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
            APPROVED
          </span>
        );
      case 'PENDING':
        return (
          <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
            PENDING
          </span>
        );
      case 'FULFILLED':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
            FULFILLED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-red-200">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {status}
          </span>
        );
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filterBloodGroup === 'ALL') return true;
    return req.bloodGroup === filterBloodGroup;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Blood Donation Requests
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {user?.role === 'PATIENT'
            ? 'Track your submitted blood requests and check their approval status.'
            : user?.role === 'DONOR'
            ? 'View emergency patient requests needing your blood donation.'
            : 'Review blood donation requests from patients across all hospitals.'}
        </p>
      </div>

      {/* For Patients: Request submission form */}
      {user?.role === 'PATIENT' && (
        <div className="mb-8">
          <BloodRequestForm onSuccess={loadRequests} />
        </div>
      )}

      {/* Guest Notice */}
      {!user && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <div className="text-sm text-red-800">
            <span className="font-bold">Need blood or want to help?</span> Please sign in or register to submit or respond to blood requests.
          </div>
          <Link
            href="/login"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            Sign In Now
          </Link>
        </div>
      )}

      {/* Request Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <h2 className="text-base font-bold text-gray-800">
          {user?.role === 'PATIENT' ? 'My Submitted Requests' : 'Active Requests Feed'}
        </h2>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold uppercase text-gray-600">Filter Group:</label>
          <select
            value={filterBloodGroup}
            onChange={(e) => setFilterBloodGroup(e.target.value)}
            className="border border-gray-300 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="ALL">All</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse border border-gray-200" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8">
          <span className="text-4xl">📋</span>
          <h3 className="text-lg font-bold text-gray-800 mt-3">No Requests Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
            {user?.role === 'PATIENT'
              ? 'You have not submitted any blood requests yet. Use the form above to submit your first request.'
              : 'There are currently no matching blood requests available in the system.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => (
            <div
              key={req._id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-lg font-black bg-red-50 text-red-600 border border-red-200">
                      {req.bloodGroup}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-900 leading-tight">
                        {req.units} {req.units === 1 ? 'Unit' : 'Units'} Needed
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Patient: {req.patientId?.name || 'Anonymous Patient'}
                      </p>
                    </div>
                  </div>
                  <div>{getStatusBadge(req.status)}</div>
                </div>

                <div className="mt-4 space-y-1.5 text-sm text-gray-600">
                  <p className="flex items-center space-x-2">
                    <span className="text-gray-400">📍</span>
                    <span className="font-medium text-gray-800">{req.location}</span>
                  </p>
                  {req.contactDetails && (
                    <p className="flex items-center space-x-2 text-xs">
                      <span className="text-gray-400">📞</span>
                      <span className="text-gray-700">Contact: {req.contactDetails}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Requested on: {new Date(req.createdAt).toLocaleDateString()}</span>
                {user?.role === 'DONOR' && req.status === 'APPROVED' && (
                  <a
                    href={`mailto:${req.patientId?.email || ''}?subject=Blood Donation Offer for ${req.bloodGroup}`}
                    className="text-red-600 font-semibold hover:underline"
                  >
                    Offer Donation →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
