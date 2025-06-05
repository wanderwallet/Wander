import { useState } from "react";
import styled, { css, useTheme } from "styled-components";
import browser from "webextension-polyfill";
import { Text } from "@arconnect/components-rebrand";
import SliderMenu from "~components/SliderMenu";
import { ChevronLeft, ChevronRight, X } from "@untitled-ui/icons-react";

interface DateSelectorModalProps {
  open: boolean;
  onClose: () => void;
  startDate: Date | null;
  endDate: Date | null;
  onSelect: (startDate: Date, endDate: Date) => void;
}

export function DateSelectorModal({ open, onClose, onSelect, startDate, endDate }: DateSelectorModalProps) {
  return (
    <SliderMenu
      title={browser.i18n.getMessage("select_running_dates")}
      paddingVertical={0}
      isOpen={open}
      onClose={onClose}>
      <DateSelectorScreen onClose={onClose} onSelect={onSelect} currentStartDate={startDate} currentEndDate={endDate} />
    </SliderMenu>
  );
}

interface DateSelectorScreenProps {
  onClose: () => void;
  onSelect: (startDate: Date, endDate: Date) => void;
  currentStartDate: Date | null;
  currentEndDate: Date | null;
}

const DateSelectorScreen = ({ onClose, onSelect, currentStartDate, currentEndDate }: DateSelectorScreenProps) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(() => {
    // If we have a start date, open to that month, otherwise current month
    if (currentStartDate) {
      return new Date(currentStartDate.getFullYear(), currentStartDate.getMonth(), 1);
    }
    return new Date();
  });
  const [startDate, setStartDate] = useState<Date | null>(currentStartDate);
  const [endDate, setEndDate] = useState<Date | null>(currentEndDate);
  const [isSelectingStart, setIsSelectingStart] = useState(true);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sat"];

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    // Don't allow clicking on disabled dates
    if (isDateDisabled(day)) {
      return;
    }

    // Check if this date is already selected
    const isStartDateSelected = startDate && selectedDate.getTime() === startDate.getTime();
    const isEndDateSelected = endDate && selectedDate.getTime() === endDate.getTime();

    if (isSelectingStart || !startDate) {
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
  };

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

  const isDateSelectedOtherMonth = (day: number, monthOffset: number) => {
    const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day);
    return (
      (startDate && targetMonth.getTime() === startDate.getTime()) ||
      (endDate && targetMonth.getTime() === endDate.getTime())
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
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Previous month's trailing days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
    const prevMonthDays = prevMonth.getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      const prevMonthDay = prevMonthDays - i;
      const isPrevMonthSelected = isDateSelectedOtherMonth(prevMonthDay, -1);

      // Check if this previous month date is disabled (before today)
      const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthDay);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPrevMonthDisabled = prevMonthDate < today;

      days.push(
        <CalendarDay
          key={`prev-${prevMonthDay}`}
          $isOtherMonth
          $isSelected={isPrevMonthSelected}
          $isDisabled={isPrevMonthDisabled}>
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

      // If start and end dates are the same, prioritize selected styling over range styling
      const showAsSelected = isSelected;
      const showAsInRange = isInRange && !isSelected;

      days.push(
        <CalendarDay
          key={day}
          $isSelected={showAsSelected}
          $isInRange={showAsInRange}
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

      // Check if this next month date is disabled (before today)
      const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isNextMonthDisabled = nextMonthDate < today;

      days.push(
        <CalendarDay
          key={`next-${day}`}
          $isOtherMonth
          $isSelected={isNextMonthSelected}
          $isDisabled={isNextMonthDisabled}>
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
            <DateInput $isActive={isSelectingStart} onClick={() => setIsSelectingStart(true)}>
              <Text size="sm" weight="medium" noMargin>
                {startDate ? formatDate(startDate) : "Start date"}
              </Text>
            </DateInput>
            <Text size="lg" weight="medium" noMargin>
              -
            </Text>
            <DateInput $isActive={!isSelectingStart} onClick={() => setIsSelectingStart(false)}>
              <Text size="sm" weight="medium" noMargin>
                {endDate ? formatDate(endDate) : "End date"}
              </Text>
            </DateInput>
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
  padding: 20px 0px;
`;

const MonthNavigation = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
`;

const CalendarDay = styled.button<{
  $isSelected?: boolean;
  $isInRange?: boolean;
  $isOtherMonth?: boolean;
  $isDisabled?: boolean;
}>`
  background: ${({ $isSelected, $isInRange, $isDisabled }) =>
    $isDisabled ? "transparent" : $isSelected ? "#6366f1" : $isInRange ? "rgba(99, 102, 241, 0.1)" : "transparent"};
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${({ $isOtherMonth, $isDisabled }) => ($isOtherMonth || $isDisabled ? "default" : "pointer")};
  transition: all 0.2s ease;
  opacity: ${({ $isDisabled }) => ($isDisabled ? 0.4 : 1)};

  &:hover {
    background: ${({ theme, $isSelected, $isOtherMonth, $isDisabled }) =>
      $isOtherMonth || $isDisabled ? "transparent" : $isSelected ? "#6366f1" : theme.surfaceSecondary};
  }
`;
