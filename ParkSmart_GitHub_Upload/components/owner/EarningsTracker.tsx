'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, Download, ArrowUpRight, CheckCircle2, ShieldCheck, CreditCard, Building2 } from 'lucide-react';

export interface EarningsLedgerEntry {
  id: string;
  date: string;
  bookingRef: string;
  driverName: string;
  spotTitle: string;
  grossAmount: number;
  platformFee: number;
  netPayout: number;
  status: 'paid_out' | 'processing';
}

const SAMPLE_INCOME_HISTORY: EarningsLedgerEntry[] = [
  {
    id: 'e1',
    date: '2026-08-23',
    bookingRef: 'PARK-7E91A',
    driverName: 'Alex Mercer',
    spotTitle: 'Private Driveway Spot #1',
    grossAmount: 10.00,
    platformFee: 1.00,
    netPayout: 9.00,
    status: 'paid_out',
  },
  {
    id: 'e2',
    date: '2026-08-22',
    bookingRef: 'PARK-3B48F',
    driverName: 'Sarah Jenkins',
    spotTitle: 'Secure Covered Garage Space B',
    grossAmount: 60.00,
    platformFee: 6.00,
    netPayout: 54.00,
    status: 'paid_out',
  },
  {
    id: 'e3',
    date: '2026-08-21',
    bookingRef: 'PARK-9F12C',
    driverName: 'Michael Chang',
    spotTitle: 'Private Driveway Spot #1',
    grossAmount: 25.00,
    platformFee: 2.50,
    netPayout: 22.50,
    status: 'paid_out',
  },
  {
    id: 'e4',
    date: '2026-08-20',
    bookingRef: 'PARK-1A88D',
    driverName: 'Emily Davis',
    spotTitle: 'Secure Covered Garage Space B',
    grossAmount: 45.00,
    platformFee: 4.50,
    netPayout: 40.50,
    status: 'paid_out',
  },
];

export default function EarningsTracker() {
  const [ledger, setLedger] = useState<EarningsLedgerEntry[]>(SAMPLE_INCOME_HISTORY);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const totalGross = ledger.reduce((acc, curr) => acc + curr.grossAmount, 0);
  const totalFees = ledger.reduce((acc, curr) => acc + curr.platformFee, 0);
  const totalNetPayout = ledger.reduce((acc, curr) => acc + curr.netPayout, 0);

  const handleWithdraw = () => {
    setToastMsg(`Payout of $${totalNetPayout.toFixed(2)} requested! Funds will arrive in your bank account in 1 business day.`);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleExportCsv = () => {
    setToastMsg('Earnings report exported to CSV!');
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Owner Earnings & Income History
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track completed booking revenues, 90% net payouts, fee deductions, and payout history.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5" /> Export Ledger
          </button>
          <button
            onClick={handleWithdraw}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition"
          >
            <ArrowUpRight className="w-4 h-4" /> Withdraw Earnings
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r text-xs text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Gross Booking Income</div>
          <div className="text-3xl font-black">${totalGross.toFixed(2)}</div>
          <div className="text-xs text-slate-400">Sum of completed reservations</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-2">
          <div className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">Net Owner Income (90%)</div>
          <div className="text-3xl font-black text-emerald-700">${totalNetPayout.toFixed(2)}</div>
          <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Ready for bank payout
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Platform Service Fee (10%)</div>
          <div className="text-3xl font-black text-slate-800">${totalFees.toFixed(2)}</div>
          <div className="text-xs text-slate-500">Automated processing fee</div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl space-y-2">
          <div className="text-[11px] text-blue-800 font-bold uppercase tracking-wider">Payout Schedule</div>
          <div className="text-2xl font-bold text-blue-900">Direct Deposit</div>
          <div className="text-xs text-blue-700 font-medium">Automatic weekly transfer</div>
        </div>
      </div>

      {/* Income History Ledger Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Income Transaction Ledger</h3>
          <span className="text-xs font-semibold text-slate-500">{ledger.length} completed transactions</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Booking Ref</th>
                <th className="p-3">Driver Name</th>
                <th className="p-3">Space Title</th>
                <th className="p-3">Gross Charged</th>
                <th className="p-3">Fee (10%)</th>
                <th className="p-3">Net Income</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3 text-slate-500 font-mono">{item.date}</td>
                  <td className="p-3 font-mono font-bold text-slate-900">{item.bookingRef}</td>
                  <td className="p-3 font-semibold text-slate-800">{item.driverName}</td>
                  <td className="p-3 text-slate-600">{item.spotTitle}</td>
                  <td className="p-3 font-semibold text-slate-900">${item.grossAmount.toFixed(2)}</td>
                  <td className="p-3 text-slate-400">-${item.platformFee.toFixed(2)}</td>
                  <td className="p-3 font-extrabold text-emerald-600">${item.netPayout.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                      <ShieldCheck className="w-3 h-3" /> Paid Out
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
