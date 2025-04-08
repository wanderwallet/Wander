import { useEffect, useState, useRef } from "react";

import DropdownButton from "../DropdownButton/DropdownButton";
import DropdownContent from "../DropdownContent/DropdownContent";

import "./Dropdown.css";

interface DropdownProps {
  buttonAvatar?: React.ReactNode;
  buttonText: string;
  backupReminder?: React.ReactNode;
  content: React.ReactNode;
}
const Dropdown = ({
  buttonAvatar,
  buttonText,
  backupReminder,
  content
}: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const [dropdownTop, setDropdownTop] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    if (!open && buttonRef.current && contentRef.current) {
      const spaceRemaining =
        window.innerHeight - buttonRef.current.getBoundingClientRect().bottom;
      const contentHeight = contentRef.current.clientHeight;

      const topPosition =
        spaceRemaining > contentHeight
          ? null
          : -(contentHeight - spaceRemaining);
      setDropdownTop(topPosition);
    }

    setOpen((open) => !open);
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handler);

    return () => {
      document.removeEventListener("click", handler);
    };
  }, [dropdownRef]);

  return (
    <div ref={dropdownRef} className="dropdown">
      <DropdownButton ref={buttonRef} toggle={toggleDropdown} open={open}>
        {buttonAvatar} {buttonText}
      </DropdownButton>

      {
        <DropdownContent top={dropdownTop} ref={contentRef} open={open}>
          {backupReminder}
          {content}
        </DropdownContent>
      }
    </div>
  );
};

export default Dropdown;
