export interface DateCheckOptions {
  day: number;
  currentDate: Date;
  startDate: Date | null;
  endDate: Date | null;
}

export interface OtherMonthDateCheckOptions extends DateCheckOptions {
  monthOffset: number;
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getFirstDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

export function isDateSelected({ day, currentDate, startDate, endDate }: DateCheckOptions): boolean {
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  return (startDate && date.getTime() === startDate.getTime()) || (endDate && date.getTime() === endDate.getTime());
}

export function isStartDate({ day, currentDate, startDate }: DateCheckOptions): boolean {
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  return startDate && date.getTime() === startDate.getTime();
}

export function isEndDate({ day, currentDate, endDate }: DateCheckOptions): boolean {
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  return endDate && date.getTime() === endDate.getTime();
}

export function isDateInRange({ day, currentDate, startDate, endDate }: DateCheckOptions): boolean {
  if (!startDate || !endDate) return false;
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  return date >= startDate && date <= endDate;
}

export function isStartOfWeekInRange({ day, currentDate, startDate, endDate }: DateCheckOptions): boolean {
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  if (!startDate || !endDate || date < startDate || date > endDate) return false;

  const dayOfWeek = date.getDay();

  for (let i = 0; i < dayOfWeek; i++) {
    const prevDate = new Date(date);
    prevDate.setDate(date.getDate() - (dayOfWeek - i));
    if (prevDate >= startDate && prevDate <= endDate) {
      return false;
    }
  }
  return true;
}

export function isEndOfWeekInRange({ day, currentDate, startDate, endDate }: DateCheckOptions): boolean {
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  if (!startDate || !endDate || date < startDate || date > endDate) return false;

  const dayOfWeek = date.getDay();

  for (let i = dayOfWeek + 1; i < 7; i++) {
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + (i - dayOfWeek));
    if (nextDate >= startDate && nextDate <= endDate) {
      return false;
    }
  }
  return true;
}

export function isDateSelectedOtherMonth({
  day,
  currentDate,
  startDate,
  endDate,
  monthOffset,
}: OtherMonthDateCheckOptions): boolean {
  const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);
  return (
    (startDate && targetMonth.getTime() === startDate.getTime()) ||
    (endDate && targetMonth.getTime() === endDate.getTime())
  );
}

export function isStartDateOtherMonth({
  day,
  currentDate,
  startDate,
  monthOffset,
}: OtherMonthDateCheckOptions): boolean {
  const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);
  return startDate && targetMonth.getTime() === startDate.getTime();
}

export function isEndDateOtherMonth({ day, currentDate, endDate, monthOffset }: OtherMonthDateCheckOptions): boolean {
  const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);
  return endDate && targetMonth.getTime() === endDate.getTime();
}

export function isStartOfWeekInRangeOtherMonth({
  day,
  currentDate,
  startDate,
  endDate,
  monthOffset,
}: OtherMonthDateCheckOptions): boolean {
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);
  if (!startDate || !endDate || date < startDate || date > endDate) return false;

  const dayOfWeek = date.getDay();

  for (let i = 0; i < dayOfWeek; i++) {
    const prevDate = new Date(date);
    prevDate.setDate(date.getDate() - (dayOfWeek - i));
    if (prevDate >= startDate && prevDate <= endDate) {
      return false;
    }
  }
  return true;
}

export function isEndOfWeekInRangeOtherMonth({
  day,
  currentDate,
  startDate,
  endDate,
  monthOffset,
}: OtherMonthDateCheckOptions): boolean {
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);
  if (!startDate || !endDate || date < startDate || date > endDate) return false;

  const dayOfWeek = date.getDay();

  for (let i = dayOfWeek + 1; i < 7; i++) {
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + (i - dayOfWeek));
    if (nextDate >= startDate && nextDate <= endDate) {
      return false;
    }
  }
  return true;
}

export function shouldConnectToPrevMonth({ day, currentDate, startDate, endDate }: DateCheckOptions): boolean {
  if (!startDate || !endDate) return false;
  const currentMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  const lastDayPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

  return (
    day === 1 &&
    lastDayPrevMonth >= startDate &&
    lastDayPrevMonth <= endDate &&
    currentMonthDate >= startDate &&
    currentMonthDate <= endDate &&
    lastDayPrevMonth.getDay() !== 6
  );
}

export function shouldConnectToNextMonth({ day, currentDate, startDate, endDate }: DateCheckOptions): boolean {
  if (!startDate || !endDate) return false;
  const daysInCurrentMonth = getDaysInMonth(currentDate);
  const currentMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  const firstDayNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

  return (
    day === daysInCurrentMonth &&
    firstDayNextMonth >= startDate &&
    firstDayNextMonth <= endDate &&
    currentMonthDate >= startDate &&
    currentMonthDate <= endDate &&
    firstDayNextMonth.getDay() !== 0
  );
}

export interface DateDisabledOptions {
  day: number;
  currentDate: Date;
  startDate: Date | null;
  isSelectingStart: boolean;
}

export function isDateDisabled({ day, currentDate, startDate, isSelectingStart }: DateDisabledOptions): boolean {
  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Always disable past dates
  if (date < today) {
    return true;
  }

  // When selecting start date, only past dates are disabled
  if (isSelectingStart || !startDate) {
    return false;
  }

  // When selecting end date, dates before start date are disabled (but same date is allowed)
  if (startDate && date < startDate) {
    return true;
  }

  return false;
}

const LONG_MONTHS = new Set([8, 10, 11]); // Sep, Nov, Dec (0-indexed)

/**
 * Determines if a date should use short format based on month name length
 * @param date The date to check
 * @returns true if short format should be used
 */
export const shouldUseShortFormat = (date: Date | null): boolean => {
  if (!date) return false;

  const month = date.getMonth();

  // Use short format for long month names
  return LONG_MONTHS.has(month);
};

/**
 * Formats a date with automatic short/long format detection
 * @param date The date to format
 * @param shortMonth If true, use short month format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | null, shortMonth?: boolean) => {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: shortMonth ? "short" : "long",
    day: "numeric",
    year: "numeric",
  });
};
