'use client';

import { useState } from 'react';
import { QrCode, Camera, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, User, ArrowRight, Zap } from 'lucide-react';

export interface BookingRecord {
  id: string;
  bookingRef: string;
  qrCodeId: string;
  driverName: string;
  spotTitle: string;
  address: string;
  status: 'confirmed' | 'active' | 'completed';
  startTime: string;
  endTime: string;
  totalPrice: number;
}

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingRecord[];
  onStatusUpdated: (bookingId: string, newStatus: 'active' | 'completed') => void;
}

export default function QrScannerModal({
  isOpen,
  onClose,
  bookings,
  onStatusUpdated,
}: QrScannerModalProps) {
  const [manualInput, setManualInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    booking: BookingRecord;
    previousStatus: string;
    newStatus: 'active' | 'completed';
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  if (!isOpen) return null;

  const processQrScan = (inputStr: string) => {
    setErrorMsg(null);
    setScanResult(null);

    const query = inputStr.trim().toUpperCase();

    if (!query) {
      setErrorMsg('Please enter or scan a valid QR Code or Booking Reference.');
      return;
    }

    // Match booking by reference ID or QR code ID
    const match = bookings.find(
      (b) =>
        b.bookingRef.toUpperCase() === query ||
        b.qrCodeId.toUpperCase() === query ||
        b.id.toUpperCase() === query
    );

    if (!match) {
      setErrorMsg(`No active booking found matching "${query}". Please check the driver screen.`);
      return;
    }

    const previousStatus = match.status;

    if (previousStatus === 'completed') {
      setErrorMsg(`Booking ${match.bookingRef} has ALREADY been completed and checked out.`);
      return;
    }

    // Status transition: 'confirmed' -> 'active' (Check In) OR 'active' -> 'completed' (Check Out)
    const newStatus: 'active' | 'completed' = previousStatus === 'confirmed' ? 'active' : 'completed';

    onStatusUpdated(match.id, newStatus);

    setScanResult({
      booking: match,
      previousStatus,
      newStatus,
    });
  };

  const handleSimulateCameraScan = () => {
    setIsScanning(true);
    setErrorMsg(null);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      // Pick first confirmed or active booking for instant demo scan
      const target = bookings.find((b) => b.status === 'confirmed' || b.status === 'active') || bookings[0];
      if (target) {
        processQrScan(target.bookingRef);
      } else {
        setErrorMsg('No confirmed driver bookings available to scan.');
      }
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-800 my-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold">QR Code Pass Scanner</h3>
              <p className="text-xs text-slate-400">Scan driver screens for check-in & check-out</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold p-1 text-lg">
            ✕
          </button>
        </div>

        {/* Camera Viewfinder Simulation */}
        <div className="relative bg-slate-950 rounded-2xl border border-slate-800 h-56 flex flex-col items-center justify-center overflow-hidden">
          {/* Laser Scanner animation line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-bounce" />

          {/* Camera Frame Corners */}
          <div className="w-40 h-40 border-2 border-blue-500/40 rounded-2xl relative flex items-center justify-center">
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400" />

            <QrCode className="w-16 h-16 text-slate-700 opacity-50" />
          </div>

          <div className="absolute bottom-3 text-[11px] text-slate-400 font-medium">
            {isScanning ? 'Scanning camera stream...' : 'Align driver QR code within frame'}
          </div>
        </div>

        {/* Scan Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSimulateCameraScan}
            disabled={isScanning}
            className="flex-grow py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {isScanning ? 'Scanning...' : 'Scan via Camera'}
          </button>
        </div>

        {/* Manual Input Fallback */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            processQrScan(manualInput);
          }}
          className="space-y-2 pt-2 border-t border-slate-800"
        >
          <label className="block text-xs font-semibold text-slate-400">Manual Reference / QR Input</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. PARK-7E91A or QR-90124"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-grow px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700"
            >
              Verify
            </button>
          </div>
        </form>

        {/* ERROR MESSAGES */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* SCAN RESULT OVERLAY */}
        {scanResult && (
          <div className="bg-emerald-500/10 border border-emerald-500/40 p-4 rounded-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-emerald-300">
                  {scanResult.newStatus === 'active' ? 'CHECK-IN SUCCESSFUL 🎉' : 'CHECK-OUT COMPLETED ✅'}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400">{scanResult.booking.bookingRef}</span>
            </div>

            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>Driver:</span>
                <span className="font-bold text-white">{scanResult.booking.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span>Space:</span>
                <span className="font-bold text-white">{scanResult.booking.spotTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>Status Update:</span>
                <span className="font-mono uppercase font-bold text-amber-300">
                  {scanResult.previousStatus} → {scanResult.newStatus}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
