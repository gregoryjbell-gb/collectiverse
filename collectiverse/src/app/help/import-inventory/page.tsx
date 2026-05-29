import Link from 'next/link';

export default function ImportHelpPage() {
  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/help" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Help Center</Link>
        <h1 className="text-2xl font-bold mb-4">Import Inventory</h1>
        <div className="prose prose-invert max-w-none text-silver space-y-4">
          <p>Upload a CSV from your existing collection app and Collectiverse will match your items to our public database.</p>
          <h2 className="text-lg font-semibold text-white">Supported Apps</h2>
          <ul className="list-disc list-inside"><li>Ludex</li><li>Collectr</li><li>CollX</li><li>Cardly AI</li><li>Card Grader</li><li>Generic CSV / Spreadsheet</li></ul>
          <h2 className="text-lg font-semibold text-white">How It Works</h2>
          <ol className="list-decimal list-inside space-y-1"><li>Upload your CSV file</li><li>Map your columns to Collectiverse fields</li><li>Preview matches before importing</li><li>Confirm to add matched items to your inventory</li></ol>
          <p>Unmatched items can optionally create new public catalog entries (marked for admin review).</p>
          <Link href="/inventory/import" className="btn-primary text-sm inline-block mt-4">Start Import</Link>
        </div>
      </div>
    </main>
  );
}
