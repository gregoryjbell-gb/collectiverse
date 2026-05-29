'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

// This page redirects to the main verification page which shows conflicts
export default function ConflictsPage() {
  const router = useRouter();
  router.push('/admin/verification');
  return (
    <main className="min-h-screen py-12 px-6">
      <div className="text-silver text-center">
        <p>Redirecting to verification...</p>
        <Link href="/admin/verification" className="text-electric hover:underline">Go to Verification</Link>
      </div>
    </main>
  );
}
