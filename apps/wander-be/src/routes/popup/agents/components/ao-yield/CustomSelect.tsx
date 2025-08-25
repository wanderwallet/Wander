import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import styled, { useTheme } from "styled-components";
import { Text } from "@arconnect/components-rebrand";
import { ChevronRight } from "@untitled-ui/icons-react";

interface CustomSelectOption {
  value: number;
  label: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: number;
  onSelect: (value: number) => void;
  minWidth?: string;
  placeholder?: string;
}

export const CustomSelect = ({ options, value, onSelect, minWidth = "80px", placeholder }: CustomSelectProps) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOptionRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => options.find((option) => option.value === value), [options, value]);

  const handleSelect = useCallback(
    (optionValue: number) => {
      onSelect(optionValue);
      setIsOpen(false);
    },
    [onSelect],
  );

  const toggleDropdown = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen && selectedOptionRef.current) {
      selectedOptionRef.current.scrollIntoView({
        behavior: "auto",
        block: "nearest",
      });
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <CustomSelectContainer ref={dropdownRef} $minWidth={minWidth}>
      <SelectButton onClick={toggleDropdown} $isOpen={isOpen}>
        <Text size="sm" weight="semibold" noMargin>
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronIcon $isOpen={isOpen}>
          <ChevronRight width={16} height={16} color={theme.primaryText} />
        </ChevronIcon>
      </SelectButton>
      {isOpen && (
        <SelectDropdown>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <SelectOption
                key={option.value}
                ref={isSelected ? selectedOptionRef : null}
                onClick={() => handleSelect(option.value)}
                $isSelected={isSelected}>
                <StyledText $isSelected={isSelected}>{option.label}</StyledText>
              </SelectOption>
            );
          })}
        </SelectDropdown>
      )}
    </CustomSelectContainer>
  );
};

const CustomSelectContainer = styled.div<{ $minWidth: string }>`
  position: relative;
  min-width: ${({ $minWidth }) => $minWidth};
`;

const SelectButton = styled.button<{ $isOpen: boolean }>`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.primaryText};
  padding: 4px 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  &:focus {
    outline: none;
    background: ${({ theme }) => theme.surfaceTertiary};
  }

  &:hover {
    background: ${({ theme }) => theme.surfaceTertiary};
  }
`;

const ChevronIcon = styled.div<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  transform: ${({ $isOpen }) => ($isOpen ? "rotate(270deg)" : "rotate(90deg)")};
`;

const SelectDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.surfaceSecondary};
  border: 1px solid ${({ theme }) => theme.surfaceTertiary};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.surfaceTertiary};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.primary};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.primaryText};
  }

  /* Firefox scrollbar */
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.primary} ${({ theme }) => theme.surfaceTertiary};
`;

const SelectOption = styled.div<{ $isSelected: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  background: ${({ theme, $isSelected }) => ($isSelected ? theme.primary : "transparent")};
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme, $isSelected }) =>
      $isSelected ? theme.primary : theme.displayTheme === "light" ? "rgba(0, 0, 0, 0.08)" : theme.surfaceTertiary};
  }

  &:first-child {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  &:last-child {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }
`;

const StyledText = styled(Text).attrs({
  size: "sm",
  weight: "medium",
  noMargin: true,
})<{ $isSelected: boolean }>`
  color: ${({ theme, $isSelected }) => ($isSelected ? "#fff" : theme.primaryText)};
`;
