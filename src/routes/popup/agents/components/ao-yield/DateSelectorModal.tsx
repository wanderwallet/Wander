import { useState, useMemo, useCallback } from "react";
import styled, { css, useTheme } from "styled-components";
import browser from "webextension-polyfill";
import { Text } from "@arconnect/components-rebrand";
import SliderMenu from "~components/SliderMenu";
import { ChevronLeft, ChevronRight } from "@untitled-ui/icons-react";

interface DateSelectorModalProps {
  open: boolean;
  onClose: () => void;
  startDate: Date | null;
  endDate: Date | null;
  onSelect: (startDate: Date, endDate: Date) => void;
  runIndefinitely: boolean;
  initialSelection?: "start" | "end";
}

const monthNames = [
  browser.i18n.getMessage("month_january"),
  browser.i18n.getMessage("month_february"),
  browser.i18n.getMessage("month_march"),
  browser.i18n.getMessage("month_april"),
  browser.i18n.getMessage("month_may"),
  browser.i18n.getMessage("month_june"),
  browser.i18n.getMessage("month_july"),
  browser.i18n.getMessage("month_august"),
  browser.i18n.getMessage("month_september"),
  browser.i18n.getMessage("month_october"),
  browser.i18n.getMessage("month_november"),
  browser.i18n.getMessage("month_december"),
];

const dayNames = [
  browser.i18n.getMessage("day_sunday"),
  browser.i18n.getMessage("day_monday"),
  browser.i18n.getMessage("day_tuesday"),
  browser.i18n.getMessage("day_wednesday"),
  browser.i18n.getMessage("day_thursday"),
  browser.i18n.getMessage("day_friday"),
  browser.i18n.getMessage("day_saturday"),
];

export function DateSelectorModal({
  open,
  onClose,
  onSelect,
  startDate,
  endDate,
  runIndefinitely,
  initialSelection = "start",
}: DateSelectorModalProps) {
  return (
    <SliderMenu
      title={browser.i18n.getMessage("select_running_dates")}
      paddingVertical={0}
      isOpen={open}
      onClose={onClose}>
      <DateSelectorScreen
        onClose={onClose}
        onSelect={onSelect}
        currentStartDate={startDate}
        currentEndDate={endDate}
        runIndefinitely={runIndefinitely}
        initialSelection={initialSelection}
      />
    </SliderMenu>
  );
}

interface DateSelectorScreenProps {
  onClose: () => void;
  onSelect: (startDate: Date, endDate: Date) => void;
  currentStartDate: Date | null;
  currentEndDate: Date | null;
  runIndefinitely: boolean;
  initialSelection?: "start" | "end";
}

const DateSelectorScreen = ({
  onClose,
  onSelect,
  currentStartDate,
  currentEndDate,
  runIndefinitely,
  initialSelection = "start",
}: DateSelectorScreenProps) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(() => {
    // Navigate to the month containing the relevant date based on initialSelection
    if (initialSelection === "end" && currentEndDate) {
      return new Date(currentEndDate.getFullYear(), currentEndDate.getMonth(), 1);
    } else if (initialSelection === "start" && currentStartDate) {
      return new Date(currentStartDate.getFullYear(), currentStartDate.getMonth(), 1);
    } else if (currentStartDate) {
      // Fallback to start date if available
      return new Date(currentStartDate.getFullYear(), currentStartDate.getMonth(), 1);
    }
    return new Date();
  });
  const [startDate, setStartDate] = useState<Date | null>(currentStartDate);
  const [endDate, setEndDate] = useState<Date | null>(currentEndDate);
  const [isSelectingStart, setIsSelectingStart] = useState(runIndefinitely ? true : initialSelection === "start");

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const navigateMonth = useCallback(
    (direction: number) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + direction);
      setCurrentDate(newDate);
    },
    [currentDate],
  );

  const getDaysInMonth = useCallback((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }, []);

  const getFirstDayOfMonth = useCallback((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }, []);

  const currentMonthInfo = useMemo(
    () => ({
      daysInMonth: getDaysInMonth(currentDate),
      firstDay: getFirstDayOfMonth(currentDate),
    }),
    [currentDate, getDaysInMonth, getFirstDayOfMonth],
  );

  const handleDateSelection = useCallback(
    (selectedDate: Date) => {
      // Don't allow clicking on disabled dates
      if (selectedDate < today) {
        return;
      }

      // Check if this date is already selected
      const isStartDateSelected = startDate && selectedDate.getTime() === startDate.getTime();
      const isEndDateSelected = endDate && selectedDate.getTime() === endDate.getTime();

      // When running indefinitely, only allow start date selection
      if (runIndefinitely) {
        // If clicking on already selected start date, unselect it
        if (isStartDateSelected) {
          setStartDate(null);
          setIsSelectingStart(true);
          return;
        }

        // Set as start date and call onSelect with current end date (or same date if no end date)
        setStartDate(selectedDate);
        setIsSelectingStart(true); // Keep selecting start for indefinite runs
        onSelect(selectedDate, endDate || selectedDate); // Use existing end date or same date
        return;
      }

      if (isSelectingStart) {
        // If clicking on already selected start date, unselect it
        if (isStartDateSelected) {
          setStartDate(null);
          setIsSelectingStart(true);
          return;
        }

        setStartDate(selectedDate);

        // If we already had an end date and it's still valid (same or after new start date), keep it
        if (endDate && selectedDate <= endDate) {
          // Keep the existing end date and call onSelect
          setIsSelectingStart(false);
          onSelect(selectedDate, endDate);
        } else {
          // Clear end date if it's now invalid, continue selecting
          setEndDate(null);
          setIsSelectingStart(false);
        }
      } else {
        // Handle case where no start date exists but we're selecting end date
        if (!startDate) {
          // If no start date exists but user is selecting end date, only set end date
          setEndDate(selectedDate);
          // Don't call onSelect yet since we don't have a complete range
          return;
        }
        // If clicking on already selected end date, unselect it
        if (isEndDateSelected && !isStartDateSelected) {
          setEndDate(null);
          setIsSelectingStart(false);
          return;
        }

        // If clicking on start date while selecting end date, set it as end date too (same date allowed)
        if (isStartDateSelected) {
          setEndDate(selectedDate);
          // Call onSelect with same date for both start and end
          onSelect(startDate, selectedDate);
          return;
        }

        // For end date selection - since we've already validated it's not disabled,
        // we can safely set it as the end date (same date as start is allowed)
        setEndDate(selectedDate);

        // Call onSelect with both dates when end date is selected
        if (startDate) {
          onSelect(startDate, selectedDate);
        }
      }
    },
    [startDate, endDate, isSelectingStart, today, onSelect],
  );

  const handleOtherMonthDateClick = useCallback(
    (day: number, monthOffset: number) => {
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);

      // Don't allow clicking on disabled dates
      if (selectedDate < today) {
        return;
      }

      // Use the same logic as current month dates
      handleDateSelection(selectedDate);
    },
    [currentDate, today, handleDateSelection],
  );

  const handleDateClick = useCallback(
    (day: number) => {
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      handleDateSelection(selectedDate);
    },
    [currentDate, handleDateSelection],
  );

  const isDateInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Include both start and end dates, even if they're the same
    return date >= startDate && date <= endDate;
  };

  const isDateSelected = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return (startDate && date.getTime() === startDate.getTime()) || (endDate && date.getTime() === endDate.getTime());
  };

  const isStartDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return startDate && date.getTime() === startDate.getTime();
  };

  const isEndDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return endDate && date.getTime() === endDate.getTime();
  };

  const isStartOfWeekInRange = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (!startDate || !endDate || date < startDate || date > endDate) return false;

    // Check if this is the first selected date in its week
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Check previous days in the same week to see if any are in range (including other months)
    for (let i = 0; i < dayOfWeek; i++) {
      const prevDate = new Date(date);
      prevDate.setDate(date.getDate() - (dayOfWeek - i));
      if (prevDate >= startDate && prevDate <= endDate) {
        return false; // There's a selected date earlier in this week
      }
    }
    return true;
  };

  const isEndOfWeekInRange = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (!startDate || !endDate || date < startDate || date > endDate) return false;

    // Check if this is the last selected date in its week
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Check next days in the same week to see if any are in range (including other months)
    for (let i = dayOfWeek + 1; i < 7; i++) {
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + (i - dayOfWeek));
      if (nextDate >= startDate && nextDate <= endDate) {
        return false; // There's a selected date later in this week
      }
    }
    return true;
  };

  const isDateSelectedOtherMonth = (day: number, monthOffset: number) => {
    const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);
    return (
      (startDate && targetMonth.getTime() === startDate.getTime()) ||
      (endDate && targetMonth.getTime() === endDate.getTime())
    );
  };

  const isStartDateOtherMonth = (day: number, monthOffset: number) => {
    const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);
    return startDate && targetMonth.getTime() === startDate.getTime();
  };

  const isEndDateOtherMonth = (day: number, monthOffset: number) => {
    const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);
    return endDate && targetMonth.getTime() === endDate.getTime();
  };

  const isStartOfWeekInRangeOtherMonth = (day: number, monthOffset: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);
    if (!startDate || !endDate || date < startDate || date > endDate) return false;

    const dayOfWeek = date.getDay();

    // Check previous days in the same week to see if any are in range (across all months)
    for (let i = 0; i < dayOfWeek; i++) {
      const prevDate = new Date(date);
      prevDate.setDate(date.getDate() - (dayOfWeek - i));
      if (prevDate >= startDate && prevDate <= endDate) {
        return false;
      }
    }
    return true;
  };

  const isEndOfWeekInRangeOtherMonth = (day: number, monthOffset: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);
    if (!startDate || !endDate || date < startDate || date > endDate) return false;

    const dayOfWeek = date.getDay();

    // Check next days in the same week to see if any are in range (across all months)
    for (let i = dayOfWeek + 1; i < 7; i++) {
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + (i - dayOfWeek));
      if (nextDate >= startDate && nextDate <= endDate) {
        return false;
      }
    }
    return true;
  };

  const shouldConnectToPrevMonth = (day: number) => {
    if (!startDate || !endDate) return false;
    const currentMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const lastDayPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    // Check if this is the first day of current month and there are selected dates in previous month
    return (
      day === 1 &&
      lastDayPrevMonth >= startDate &&
      lastDayPrevMonth <= endDate &&
      currentMonthDate >= startDate &&
      currentMonthDate <= endDate &&
      lastDayPrevMonth.getDay() !== 6 // Don't connect if last day of prev month is Saturday
    );
  };

  const shouldConnectToNextMonth = (day: number) => {
    if (!startDate || !endDate) return false;
    const daysInCurrentMonth = getDaysInMonth(currentDate);
    const currentMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const firstDayNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    // Check if this is the last day of current month and there are selected dates in next month
    return (
      day === daysInCurrentMonth &&
      firstDayNextMonth >= startDate &&
      firstDayNextMonth <= endDate &&
      currentMonthDate >= startDate &&
      currentMonthDate <= endDate &&
      firstDayNextMonth.getDay() !== 0 // Don't connect if first day of next month is Sunday
    );
  };

  const isDateDisabled = (day: number) => {
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
  };

  const renderCalendar = () => {
    const { daysInMonth, firstDay } = currentMonthInfo;
    const days = [];

    // Previous month's trailing days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    const prevMonthDays = prevMonth.getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      const prevMonthDay = prevMonthDays - i;
      const isPrevMonthSelected = isDateSelectedOtherMonth(prevMonthDay, -1);
      const isPrevMonthStart = isStartDateOtherMonth(prevMonthDay, -1);
      const isPrevMonthEnd = isEndDateOtherMonth(prevMonthDay, -1);
      const isPrevMonthWeekStart = isStartOfWeekInRangeOtherMonth(prevMonthDay, -1);
      const isPrevMonthWeekEnd = isEndOfWeekInRangeOtherMonth(prevMonthDay, -1);

      // Check if this previous month date is disabled (before today)
      const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthDay);

      // Check if this prev month date is in range
      const isPrevMonthInRange =
        startDate && endDate && prevMonthDate >= startDate && prevMonthDate <= endDate && !isPrevMonthSelected;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPrevMonthDisabled = prevMonthDate < today;

      days.push(
        <CalendarDay
          key={`prev-${prevMonthDay}`}
          $isOtherMonth
          $isSelected={isPrevMonthSelected}
          $isInRange={isPrevMonthInRange}
          $isStart={isPrevMonthStart}
          $isEnd={isPrevMonthEnd}
          $isWeekStart={isPrevMonthWeekStart}
          $isWeekEnd={isPrevMonthWeekEnd}
          $connectToPrev={false}
          $connectToNext={false}
          $isSingleDate={
            (isPrevMonthStart && isPrevMonthEnd) || (isPrevMonthStart && !endDate) || (isPrevMonthEnd && !startDate)
          }
          $isDisabled={isPrevMonthDisabled}
          onClick={() => !isPrevMonthDisabled && handleOtherMonthDateClick(prevMonthDay, -1)}>
          <Text
            size="sm"
            style={{
              color: isPrevMonthSelected ? "#fff" : isPrevMonthDisabled ? theme.tertiaryText : theme.secondaryText,
            }}
            weight={isPrevMonthSelected ? "semibold" : "medium"}
            noMargin>
            {prevMonthDay}
          </Text>
        </CalendarDay>,
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isDateSelected(day);
      const isInRange = isDateInRange(day);
      const isDisabled = isDateDisabled(day);
      const isStart = isStartDate(day);
      const isEnd = isEndDate(day);
      const isWeekStart = isStartOfWeekInRange(day);
      const isWeekEnd = isEndOfWeekInRange(day);
      const connectToPrev = shouldConnectToPrevMonth(day);
      const connectToNext = shouldConnectToNextMonth(day);

      // If start and end dates are the same, prioritize selected styling over range styling
      const showAsSelected = isSelected;
      const showAsInRange = isInRange && !isSelected;

      days.push(
        <CalendarDay
          key={day}
          $isSelected={showAsSelected}
          $isInRange={showAsInRange}
          $isStart={isStart}
          $isEnd={isEnd}
          $isWeekStart={isWeekStart}
          $isWeekEnd={isWeekEnd}
          $connectToPrev={connectToPrev}
          $connectToNext={connectToNext}
          $isSingleDate={(isStart && isEnd) || (isStart && !endDate) || (isEnd && !startDate)}
          $isDisabled={isDisabled}
          onClick={() => !isDisabled && handleDateClick(day)}>
          <Text
            size="sm"
            style={{
              color: showAsSelected ? "#fff" : isDisabled ? theme.tertiaryText : theme.primaryText,
            }}
            weight={showAsSelected ? "semibold" : "medium"}
            noMargin>
            {day}
          </Text>
        </CalendarDay>,
      );
    }

    // Next month's leading days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);

    for (let day = 1; day <= remainingCells; day++) {
      const isNextMonthSelected = isDateSelectedOtherMonth(day, 1);
      const isNextMonthStart = isStartDateOtherMonth(day, 1);
      const isNextMonthEnd = isEndDateOtherMonth(day, 1);
      const isNextMonthWeekStart = isStartOfWeekInRangeOtherMonth(day, 1);
      const isNextMonthWeekEnd = isEndOfWeekInRangeOtherMonth(day, 1);

      // Check if this next month date is disabled (before today)
      const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);

      // Check if this next month date is in range
      const isNextMonthInRange =
        startDate && endDate && nextMonthDate >= startDate && nextMonthDate <= endDate && !isNextMonthSelected;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isNextMonthDisabled = nextMonthDate < today;

      days.push(
        <CalendarDay
          key={`next-${day}`}
          $isOtherMonth
          $isSelected={isNextMonthSelected}
          $isInRange={isNextMonthInRange}
          $isStart={isNextMonthStart}
          $isEnd={isNextMonthEnd}
          $isWeekStart={isNextMonthWeekStart}
          $isWeekEnd={isNextMonthWeekEnd}
          $connectToPrev={false}
          $connectToNext={false}
          $isSingleDate={
            (isNextMonthStart && isNextMonthEnd) || (isNextMonthStart && !endDate) || (isNextMonthEnd && !startDate)
          }
          $isDisabled={isNextMonthDisabled}
          onClick={() => !isNextMonthDisabled && handleOtherMonthDateClick(day, 1)}>
          <Text
            size="sm"
            style={{
              color: isNextMonthSelected ? "#fff" : isNextMonthDisabled ? theme.tertiaryText : theme.secondaryText,
            }}
            weight={isNextMonthSelected ? "semibold" : "medium"}
            noMargin>
            {day}
          </Text>
        </CalendarDay>,
      );
    }

    // Add empty cells to ensure we always have 6 rows (42 cells total)
    const totalDays = days.length;
    const emptyCellsNeeded = 42 - totalDays;

    for (let i = 0; i < emptyCellsNeeded; i++) {
      days.push(<EmptyCalendarDay key={`empty-${i}`} />);
    }

    return days;
  };

  return (
    <Container>
      <CalendarContainer>
        <MonthNavigation>
          <NavButton
            onClick={() => navigateMonth(-1)}
            $disabled={
              currentDate.getFullYear() <= new Date().getFullYear() && currentDate.getMonth() <= new Date().getMonth()
            }>
            <ChevronLeft width={20} height={20} color={theme.primaryText} />
          </NavButton>
          <Text size="lg" weight="semibold" noMargin>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <NavButton onClick={() => navigateMonth(1)}>
            <ChevronRight width={20} height={20} color={theme.primaryText} />
          </NavButton>
        </MonthNavigation>

        <Header>
          <DateRangeDisplay>
            {runIndefinitely && (
              <Text variant="secondary" weight="semibold" noMargin>
                Starts on:
              </Text>
            )}
            <DateInput $isActive={isSelectingStart} onClick={() => setIsSelectingStart(true)}>
              <Text size="sm" weight="medium" style={{ textAlign: "center" }} noMargin>
                {startDate ? formatDate(startDate) : "Start date"}
              </Text>
            </DateInput>
            {!runIndefinitely && (
              <>
                <Text size="lg" weight="medium" noMargin>
                  -
                </Text>
                <DateInput $isActive={!isSelectingStart} onClick={() => setIsSelectingStart(false)}>
                  <Text size="sm" weight="medium" style={{ textAlign: "center" }} noMargin>
                    {endDate ? formatDate(endDate) : "End date"}
                  </Text>
                </DateInput>
              </>
            )}
          </DateRangeDisplay>
        </Header>

        <DayHeaders>
          {dayNames.map((day) => (
            <DayHeader key={day}>
              <Text size="sm" style={{ color: theme.secondaryText }} weight="medium" noMargin>
                {day}
              </Text>
            </DayHeader>
          ))}
        </DayHeaders>

        <CalendarGrid>{renderCalendar()}</CalendarGrid>
      </CalendarContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.primaryText};
`;

const Header = styled.div`
  padding: 16px 0px;
  width: 100%;
`;

const DateRangeDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DateInput = styled.div<{ $isActive: boolean }>`
  padding: 12px 16px;
  border-radius: 8px;
  background: ${({ theme, $isActive }) => ($isActive ? theme.surfaceSecondary : theme.surfaceTertiary)};
  border: 2px solid ${({ theme, $isActive }) => ($isActive ? theme.primary : "transparent")};
  flex: 1;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.surfaceSecondary};
  }
`;

const CalendarContainer = styled.div`
  flex: 1;
  padding-bottom: 32px;
`;

const MonthNavigation = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const NavButton = styled.button<{ $disabled?: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.surfaceSecondary};
  }

  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    `}
`;

const DayHeaders = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 12px;
`;

const DayHeader = styled.div`
  text-align: center;
  padding: 8px 0;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  min-height: 264px; /* 6 rows * 40px height + 5 * 4px gap */
`;

const EmptyCalendarDay = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CalendarDay = styled.button<{
  $isSelected?: boolean;
  $isInRange?: boolean;
  $isStart?: boolean;
  $isEnd?: boolean;
  $isWeekStart?: boolean;
  $isWeekEnd?: boolean;
  $connectToPrev?: boolean;
  $connectToNext?: boolean;
  $isSingleDate?: boolean;
  $isOtherMonth?: boolean;
  $isDisabled?: boolean;
}>`
  background: ${({ theme, $isSelected, $isInRange, $isDisabled }) =>
    $isDisabled ? "transparent" : $isSelected ? "#6366f1" : $isInRange ? theme.surfaceTertiary : "transparent"};
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${({ $isDisabled }) => ($isDisabled ? "default" : "pointer")};
  transition:
    all 0.2s ease,
    border-radius 0.15s ease;
  opacity: ${({ $isDisabled }) => ($isDisabled ? 0.4 : 1)};
  position: relative;

  /* Extend background to fill gaps for connected appearance - horizontal only */
  ${({
    theme,
    $isSelected,
    $isInRange,
    $isStart,
    $isEnd,
    $isSingleDate,
    $isWeekStart,
    $isWeekEnd,
    $connectToPrev,
    $connectToNext,
  }) => {
    if ($isSingleDate || (!$isSelected && !$isInRange)) return "";

    const bgColor = $isSelected ? "#6366f1" : theme.surfaceTertiary;

    return `
      &::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: ${($isStart || $isWeekStart) && !$connectToPrev ? "50%" : "-8px"};
        right: ${($isEnd || $isWeekEnd) && !$connectToNext ? "50%" : "-8px"};
        background: ${bgColor};
        z-index: -1;
      }
      
      &::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: ${($isStart || $isWeekStart) && !$connectToPrev ? "50%" : "-4px"};
        right: ${($isEnd || $isWeekEnd) && !$connectToNext ? "50%" : "-4px"};
        background: ${bgColor};
        z-index: -2;
      }
    `;
  }}

  &:hover {
    background: ${({ theme, $isSelected, $isOtherMonth, $isDisabled }) =>
      $isDisabled ? "transparent" : $isSelected ? "#6366f1" : theme.surfaceSecondary};
  }
`;
