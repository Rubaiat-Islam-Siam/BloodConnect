import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'BloodConnect — Simple e-Blood Management System',
  description:
    'An educational e-Blood Management System connecting blood donors with patients in need.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-gray-200 py-8 mt-12 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4 space-y-3">
            <div className="flex items-center justify-center space-x-2 text-sm font-bold text-gray-800">
              <span className="text-red-600">🩸</span>
              <span>BloodConnect</span>
            </div>
            <p className="max-w-2xl mx-auto text-gray-600">
              <strong className="text-gray-700">Educational Notice:</strong> BloodConnect is an
              academic demonstration developed for university software engineering evaluation. It is
              not a medically certified blood-matching platform. Matching blood groups and locations
              does not guarantee clinical compatibility or patient suitability.
            </p>
            <p className="text-gray-400">
              © 2026 BloodConnect — Built with Next.js, TypeScript, Tailwind CSS, & MongoDB Atlas.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
