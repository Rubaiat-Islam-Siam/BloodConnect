'use client';

import React, { useState, useEffect } from 'react';
import DonorCard from '@/components/DonorCard';
import { VALID_BLOOD_GROUPS } from '@/lib/request-validator';
import type { DonorSearchResult } from '@/patterns/patterns';

export default function DonorsPage() {
  const [donors, setDonors] = useState<DonorSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [bloodGroup, setBloodGroup] = useState<string>('ALL');
  const [location, setLocation] = useState<string>('');
  const [availableOnly, setAvailableOnly] = useState<boolean>(true);

  const [searchTrigger, setSearchTrigger] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    async function loadDonors() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (bloodGroup !== 'ALL') {
          params.append('bloodGroup', bloodGroup);
        }
        if (location.trim()) {
          params.append('location', location.trim());
        }
        params.append('availableOnly', String(availableOnly));

        const res = await fetch(`/api/donors?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch donors');
        }

        if (!isCancelled) {
          setDonors(data.donors || []);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Error loading donors');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadDonors();
    return () => {
      isCancelled = true;
    };
  }, [bloodGroup, location, availableOnly, searchTrigger]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Find Blood Donors
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Search registered volunteer donors filtered by blood group and location.
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
            Blood Group
          </label>
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="ALL">All Blood Groups</option>
            {VALID_BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
            Location / District
          </label>
          <input
            type="text"
            placeholder="Search by city/area..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center pb-2">
          <label className="inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Available Donors Only
            </span>
          </label>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setSearchTrigger((prev) => prev + 1)}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-xs text-sm transition"
          >
            Search Donors
          </button>
        </div>
      </div>

      {/* Donor List / Results */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 bg-gray-100 rounded-xl animate-pulse border border-gray-200"
            />
          ))}
        </div>
      ) : donors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8">
          <span className="text-4xl">🔍</span>
          <h3 className="text-lg font-bold text-gray-800 mt-3">No Donors Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
            No donors match the selected blood group and location criteria. Try broadening your
            search or check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donors.map((donor) => (
            <DonorCard key={donor.id} donor={donor} />
          ))}
        </div>
      )}
    </div>
  );
}
