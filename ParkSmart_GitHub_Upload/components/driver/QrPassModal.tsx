'use client';

import { useState } from 'react';
import { QrCode, MapPin, Calendar, Clock, CheckCircle2, ShieldCheck, Sun, ArrowLeft } from 'lucide-react';

export interface QrPassData {
  bookingRef: string;
  qrCodeId: string;
  spotTitle: string;
  address: string;
  driverName?: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'active' | 'completed';
  totalPrice: number;
}

interface QrPassModalProps {
  isOpen: boolean;
  pass: QrPassData | null;
  onClose: () => void;
}

export default function QrPassModal({ isOpen, pass, onClose }: QrPassModalProps) {
  const [highBrightness, setHighBrightness] = useState(true);

  if (!isOpen || !pass) return null;

  const payloadString = JSON.stringify({
    ref: pass.bookingRef,
    qrId: pass.qrCodeId,
    spot: pass.spotTitle,
    driver: pass.driverName || 'Driver',
    status: pass.status,
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div
        className={`rounded-3xl max-w-sm w-full p-6 sm:p-8 space-y-6 shadow-2xl border transition-all ${
          highBrightness
            ? 'bg-white text-slate-900 border-white ring-8 ring-white/20'
            : 'bg-slate-900 text-white border-slate-800'
        }`}
      >
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200/40 pb-4">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <button
            onClick={() => setHighBrightness(!highBrightness)}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition ${
              highBrightness
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Toggle High Contrast Brightness for Scanner"
          >
            <Sun className="w-3.5 h-3.5" /> Max Brightness
          </button>
        </div>

        {/* Pass Status Badge */}
        <div className="text-center space-y-1">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              pass.status === 'confirmed'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : pass.status === 'active'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {pass.status === 'confirmed' ? 'READY TO CHECK-IN' : pass.status === 'active' ? 'CHECKED IN (ACTIVE)' : 'COMPLETED'}
          </span>
          <div className="font-mono text-2xl font-black tracking-tight">{pass.bookingRef}</div>
        </div>

        {/* High Contrast Scannable QR Code */}
        <div className="bg-white p-5 rounded-2xl border-4 border-slate-950 flex flex-col items-center justify-center space-y-3 shadow-inner">
          <div className="relative p-2 bg-white rounded-xl border border-slate-200">
            <QrCode className="w-48 h-48 text-slate-950" />
            {/* Corner alignment markers simulation */}
            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-slate-950" />
            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-slate-950" />
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-slate-950" />
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-slate-950" />
          </div>
          <div className="font-mono text-[11px] font-bold text-slate-700 tracking-widest uppercase">
            {pass.qrCodeId}
          </div>
        </div>

        {/* Details Card */}
        <div className="space-y-2.5 text-xs border-t border-slate-200/50 pt-4">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">Parking Space:</span>
            <span className="font-bold text-right max-w-[180px]">{pass.spotTitle}</span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">Address:</span>
            <span className="font-medium text-right text-slate-600 max-w-[180px]">{pass.address}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Total Paid:</span>
            <span className="font-extrabold text-emerald-600 text-sm">${pass.totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Present this QR code to the Parking Owner upon entry or exit.
          </p>
        </div>
      </div>
    </div>
  );
}
