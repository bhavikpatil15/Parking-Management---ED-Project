'use client';

import { useState } from 'react';
import { validateSlotOverlap, SlotTimeWindow } from '@/lib/utils/validation';
import { Clock, Calendar, AlertCircle, CheckCircle2, Trash2, Plus, ShieldAlert, Check } from 'lucide-react';

interface ParkingSpaceMinimal {
  id: string;
  title: string;
}

interface AvailabilitySlotManagerProps {
  spaces: ParkingSpaceMinimal[];
  slots: SlotTimeWindow[];
  onAddSlot: (slot: SlotTimeWindow) => void;
  onDeleteSlot: (slotId: string) => void;
}

const DAYS_OF_WEEK = [
  { label: 'Mon', value: 'Monday' },
  { label: 'Tue', value: 'Tuesday' },
  { label: 'Wed', value: 'Wednesday' },
  { label: 'Thu', value: 'Thursday' },
  { label: 'Fri', value: 'Friday' },
  { label: 'Sat', value: 'Saturday' },
  { label: 'Sun', value: 'Sunday' },
];

export default function AvailabilitySlotManager({
  spaces,
  slots,
  onAddSlot,
  onDeleteSlot,
}: AvailabilitySlotManagerProps) {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(spaces[0]?.id || '');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  // Date & Time pickers
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  // Alert State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleDay = (dayValue: string) => {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue]);
    }
  };

  const handleCreateSlots = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedSpaceId) {
      setErrorMsg('Please select a parking space.');
      return;
    }

    if (!startTime || !endTime) {
      setErrorMsg('Please set both start time and end time.');
      return;
    }

    const startDateTimeStr = `${date}T${startTime}:00`;
    const endDateTimeStr = `${date}T${endTime}:00`;

    // Overlap validation check
    const validation = validateSlotOverlap(
      {
        space_id: selectedSpaceId,
        start_time: startDateTimeStr,
        end_time: endDateTimeStr,
      },
      slots
    );

    if (validation.hasOverlap) {
      setErrorMsg(validation.errorMessage || 'Time slot overlaps with an existing availability window.');
      return;
    }

    // Success - add slot
    const newSlot: SlotTimeWindow = {
      id: Date.now().toString(),
      space_id: selectedSpaceId,
      start_time: startDateTimeStr,
      end_time: endDateTimeStr,
      day_of_week: selectedDays.join(', '),
    };

    onAddSlot(newSlot);
    setSuccessMsg(`Availability window successfully created (${startTime} - ${endTime})!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const spaceSlots = slots.filter((s) => s.space_id === selectedSpaceId);
  const currentSpaceTitle = spaces.find((s) => s.id === selectedSpaceId)?.title || 'Selected Space';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Availability Windows & Slot Manager
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Define operating hours for your space. Automatic validation prevents overlapping slots.
          </p>
        </div>

        {/* Space Selector */}
        <div className="w-full sm:w-64">
          <select
            value={selectedSpaceId}
            onChange={(e) => {
              setSelectedSpaceId(e.target.value);
              setErrorMsg(null);
            }}
            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-amber-500"
          >
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Validation Messages */}
      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r text-xs text-red-800 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-red-900">Validation Conflict Error</div>
            <div>{errorMsg}</div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r text-xs text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="font-semibold">{successMsg}</div>
        </div>
      )}

      {/* Form: Add Availability Window */}
      <form onSubmit={handleCreateSlots} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-amber-600" />
          Add Availability Window for "{currentSpaceTitle}"
        </h3>

        {/* Quick Days Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Recurring Days of Week</label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((d) => {
              const isSelected = selectedDays.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date & Time Range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Window & Check Overlap
          </button>
        </div>
      </form>

      {/* Existing Slots List */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
          <span>Active Availability Windows for {currentSpaceTitle}</span>
          <span className="text-xs font-normal text-slate-500">{spaceSlots.length} windows active</span>
        </h3>

        {spaceSlots.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
            No availability slots defined for this space yet. Use the form above to add your first window.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {spaceSlots.map((slot) => {
              const startFormatted = new Date(slot.start_time).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });
              const endFormatted = new Date(slot.end_time).toLocaleString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });

              return (
                <div
                  key={slot.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between hover:border-slate-300 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      {startFormatted} – {endFormatted}
                    </div>
                    {slot.day_of_week && (
                      <div className="text-[11px] text-slate-500">
                        Days: <span className="font-medium text-slate-700">{slot.day_of_week}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => slot.id && onDeleteSlot(slot.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Window"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
