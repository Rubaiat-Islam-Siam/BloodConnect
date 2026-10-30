import React from 'react';
import type { DonorSearchResult } from '@/patterns/patterns';

interface DonorCardProps {
  donor: DonorSearchResult;
}

export default function DonorCard({ donor }: DonorCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{donor.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{donor.email}</p>
          </div>
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-black bg-red-50 text-red-600 border border-red-200 shadow-xs">
            {donor.bloodGroup || 'N/A'}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">📍</span>
            <span className="font-medium text-gray-800">
              {donor.location || 'Location not specified'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                donor.availableToDonate ? 'bg-emerald-500' : 'bg-gray-400'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              {donor.availableToDonate ? 'Available to Donate' : 'Currently Unavailable'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span className="italic">Verified registered donor</span>
        <a
          href={`mailto:${donor.email}?subject=Urgent Blood Donation Inquiry via BloodConnect`}
          className="text-red-600 font-semibold hover:underline"
        >
          Contact Donor →
        </a>
      </div>
    </div>
  );
}

