import Link from 'next/link';
import { VALID_BLOOD_GROUPS } from '@/lib/request-validator';

export default function HomePage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 text-center">
        <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-200 px-3 py-1 rounded-full text-xs font-semibold text-red-700 mb-6">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          <span>Emergency Blood Management System</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Connecting Lifesaving Blood Donors with <span className="text-red-600">Patients in Need</span>
        </h1>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          BloodConnect simplifies the search for available voluntary donors and allows patients
          to submit urgent blood requests with transparent real-time status tracking.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/donors"
            className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-sm transition text-sm text-center"
          >
            Find Available Donors
          </Link>
          <Link
            href="/requests"
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl border border-gray-300 shadow-2xs transition text-sm text-center"
          >
            Request Blood
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl border border-red-200 shadow-2xs transition text-sm text-center"
          >
            Become a Donor
          </Link>
        </div>
      </section>

      {/* Blood Groups Available Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs text-center space-y-4">
          <h2 className="text-sm uppercase tracking-wider font-bold text-gray-500">
            Supported Blood Groups
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {VALID_BLOOD_GROUPS.map((group) => (
              <Link
                key={group}
                href={`/donors?bloodGroup=${encodeURIComponent(group)}`}
                className="w-14 h-14 rounded-2xl bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 font-black text-lg flex items-center justify-center transition shadow-2xs"
              >
                {group}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - 3 Step Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold text-gray-900">How BloodConnect Works</h2>
          <p className="text-sm text-gray-500 mt-1">
            Built following clean Software Engineering principles & Design Patterns
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 font-bold flex items-center justify-center text-lg">
              1
            </div>
            <h3 className="font-bold text-gray-900 text-base">Register with Purpose</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Donors specify their blood group, location, and real-time availability. Patients can
              securely create an account with zero hassle.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 font-bold flex items-center justify-center text-lg">
              2
            </div>
            <h3 className="font-bold text-gray-900 text-base">Search & Request</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Using the <em>DonorSearchAdapter</em>, patients seamlessly query donors by location and
              blood group, or post a request with required blood units.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 font-bold flex items-center justify-center text-lg">
              3
            </div>
            <h3 className="font-bold text-gray-900 text-base">Verify & Notify</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Admins approve requests, which immediately dispatches notifications via the{' '}
              <em>NotificationFactory</em> and notifies subscribers via the{' '}
              <em>RequestStatusObserver</em>.
            </p>
          </div>
        </div>
      </section>

      {/* Lab Project & Academic Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="bg-linear-to-r from-red-600 to-rose-700 text-white rounded-2xl p-8 sm:p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs uppercase font-bold tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              University Course Project
            </span>
            <h3 className="text-2xl font-bold">Software Engineering Lab (CSE 3206)</h3>
            <p className="text-white/80 text-sm">
              Demonstrates Next.js App Router, TypeScript, Mongoose models, HTTP-only cookie
              security, Vitest TDD, and three software design patterns (Factory, Adapter, and
              Observer).
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="px-5 py-2.5 bg-white text-red-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition shadow-xs text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
