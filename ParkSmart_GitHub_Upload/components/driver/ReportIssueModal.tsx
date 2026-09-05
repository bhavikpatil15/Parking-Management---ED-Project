'use client';

import { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, PhoneCall, Car, Key, HelpCircle } from 'lucide-react';

interface ReportIssueModalProps {
  isOpen: boolean;
  booking: {
    bookingRef: string;
    spotTitle: string;
    address: string;
  } | null;
  onClose: () => void;
  onReportSubmitted: (issue: {
    bookingRef: string;
    category: string;
    description: string;
  }) => void;
}

const ISSUE_CATEGORIES = [
  { id: 'unauthorized_car', label: 'Spot occupied by unauthorized car', icon: Car },
  { id: 'gate_code_failed', label: 'Gate / Access code not working', icon: Key },
  { id: 'size_discrepancy', label: 'Space size or location discrepancy', icon: AlertTriangle },
  { id: 'unsafe_condition', label: 'Unsafe or dirty conditions', icon: ShieldAlert },
  { id: 'other', label: 'Other issue', icon: HelpCircle },
];

export default function ReportIssueModal({
  isOpen,
  booking,
  onClose,
  onReportSubmitted,
}: ReportIssueModalProps) {
  const [category, setCategory] = useState(ISSUE_CATEGORIES[0].label);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      onReportSubmitted({
        bookingRef: booking.bookingRef,
        category,
        description,
      });
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Report an Issue</h3>
              <p className="text-xs text-slate-500 font-mono">Ref: {booking.bookingRef}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg">
            ✕
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmitReport} className="space-y-5">
            <div className="text-xs text-slate-600">
              Spot: <span className="font-bold text-slate-900">{booking.spotTitle}</span>
            </div>

            {/* Category Radio Buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">What issue are you experiencing?</label>
              <div className="space-y-1.5">
                {ISSUE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.label;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.label)}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2.5 transition ${
                        isSelected
                          ? 'border-red-500 bg-red-50/70 text-red-900 ring-2 ring-red-500/20'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-red-600' : 'text-slate-400'}`} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional details */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Additional Details / License Plate</label>
              <textarea
                rows={3}
                placeholder="e.g. A silver Honda Civic (License #7ABC123) is parked in my assigned bay A-4."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md disabled:opacity-50"
              >
                {loading ? 'Submitting Report...' : 'Submit Issue Report'}
              </button>
            </div>
          </form>
        ) : (
          /* CONFIRMATION & RESOLUTION SCREEN */
          <div className="text-center space-y-4 py-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-slate-900">Report Dispatched</h4>
              <p className="text-xs text-slate-600 mt-1">
                The space owner and support team have been notified of your report regarding <strong className="text-red-700">"{category}"</strong>.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-left space-y-2 text-xs">
              <div className="font-bold text-red-900 flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-red-600" />
                Urgent On-Site Assistance
              </div>
              <p className="text-slate-700 text-[11px]">
                If your space is occupied by an unauthorized vehicle, you may park in nearby emergency Bay #A-9 or call Dispatch Hotline:
              </p>
              <div className="font-mono font-bold text-red-800 text-sm">(800) 555-PARK (7275)</div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
            >
              Back to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
