export interface SlotTimeWindow {
  id?: string;
  space_id: string;
  start_time: string; // ISO String or YYYY-MM-DDTHH:mm
  end_time: string;   // ISO String or YYYY-MM-DDTHH:mm
  day_of_week?: string; // Optional label e.g., 'Monday'
}

export interface OverlapValidationResult {
  hasOverlap: boolean;
  conflictingSlot?: SlotTimeWindow;
  errorMessage?: string;
}

/**
 * Validates whether a proposed start_time and end_time overlaps with any existing slots for the same space.
 * Overlap formula: (newStart < existingEnd) AND (newEnd > existingStart)
 */
export function validateSlotOverlap(
  newSlot: { start_time: string; end_time: string; space_id: string },
  existingSlots: SlotTimeWindow[]
): OverlapValidationResult {
  const newStart = new Date(newSlot.start_time).getTime();
  const newEnd = new Date(newSlot.end_time).getTime();

  if (isNaN(newStart) || isNaN(newEnd)) {
    return {
      hasOverlap: true,
      errorMessage: 'Invalid date or time provided.',
    };
  }

  if (newEnd <= newStart) {
    return {
      hasOverlap: true,
      errorMessage: 'End time must be strictly after Start time.',
    };
  }

  // Filter slots for the same parking space
  const spaceSlots = existingSlots.filter((slot) => slot.space_id === newSlot.space_id);

  for (const slot of spaceSlots) {
    const existingStart = new Date(slot.start_time).getTime();
    const existingEnd = new Date(slot.end_time).getTime();

    // Check overlap
    if (newStart < existingEnd && newEnd > existingStart) {
      const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      };

      return {
        hasOverlap: true,
        conflictingSlot: slot,
        errorMessage: `Time conflict! Overlaps with an existing slot (${formatTime(slot.start_time)} to ${formatTime(slot.end_time)}).`,
      };
    }
  }

  return {
    hasOverlap: false,
  };
}
