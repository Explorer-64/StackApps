import { useState } from 'react';
import { getFirebaseAuth, initializeFirebase } from '@/lib/firebase';
import { Link } from 'wouter';

type Props = {
  appId: string;
  appName: string;
  appUrl: string;
  userId?: string | null;
};

export function ReportForm({ appId, appName, appUrl, userId }: Props) {
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('malware');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleReport = async () => {
    if (!userId) return;
    setReportSubmitting(true);
    try {
      await initializeFirebase();
      const auth = getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/report-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          appId,
          appName,
          appUrl,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      if (!response.ok) throw new Error('Failed to submit report');
      setReportSubmitted(true);
      setShowReportForm(false);
    } catch (e) {
      console.error(e);
      alert('Failed to submit report. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="flex justify-end mb-4">
      {reportSubmitted ? (
        <span className="text-xs text-gray-500">Report received. Thank you.</span>
      ) : showReportForm ? (
        <div className="bg-cyber-gray border border-cyber-light rounded-lg p-4 w-full max-w-md">
          <p className="text-sm font-bold text-white mb-3">Report this app</p>
          <select
            value={reportReason}
            onChange={e => setReportReason(e.target.value)}
            className="w-full bg-cyber-dark border border-cyber-light text-gray-300 text-sm rounded px-3 py-2 mb-3"
          >
            <option value="malware">Malware or harmful software</option>
            <option value="scam">Scam or deceptive content</option>
            <option value="adult">Adult or inappropriate content</option>
            <option value="illegal">Illegal service</option>
            <option value="other">Other</option>
          </select>
          <textarea
            value={reportDetails}
            onChange={e => setReportDetails(e.target.value)}
            placeholder="Additional details (optional)"
            rows={2}
            className="w-full bg-cyber-dark border border-cyber-light text-gray-300 text-sm rounded px-3 py-2 mb-3 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReport}
              disabled={reportSubmitting || !userId}
              className="px-4 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded font-medium disabled:opacity-50"
            >
              {reportSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
            <button
              onClick={() => setShowReportForm(false)}
              className="px-4 py-1.5 text-gray-400 hover:text-white text-sm"
            >
              Cancel
            </button>
          </div>
          {!userId && (
            <p className="text-xs text-gray-500 mt-2">You must be logged in to report an app. <Link href="/login" className="text-neon-blue">Log in</Link></p>
          )}
        </div>
      ) : (
        <button
          onClick={() => userId ? setShowReportForm(true) : window.location.href = '/login'}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          Report this app
        </button>
      )}
    </div>
  );
}

