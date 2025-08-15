import { motion, AnimatePresence, type Variants } from "framer-motion";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function WalletMenu({ open, close, menuItems }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <MenuPopover variants={popoverAnimation}>
          <MenuCard
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}>
            {menuItems.map((item, i) => (
              <MenuItem
                open={open}
                key={i}
                onClick={() => {
                  item.route();
                  close();
                }}>
                {item.icon}
                <MenuTitle>{browser.i18n.getMessage(item.title)}</MenuTitle>
              </MenuItem>
            ))}
          </MenuCard>
        </MenuPopover>
      )}
    </AnimatePresence>
  );
}

export const popoverAnimation: Variants = {
  closed: {
    scale: 0.4,
    opacity: 0,
    transition: {
      type: "spring",
      duration: 0.4,
    },
  },
  open: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      duration: 0.4,
      delayChildren: 0.2,
      staggerChildren: 0.05,
    },
  },
};

const MenuPopover = styled(motion.div).attrs({
  initial: "closed",
  animate: "open",
  exit: "closed",
})`
  position: absolute;
  top: calc(100% - 20px);
  right: 12px;
  z-index: 110;
  cursor: default;
`;

const walletAnimation = {
  open: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
  closed: {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

const MenuItem = styled(motion.div).attrs<{ open: boolean }>((props) => ({
  variants: walletAnimation,
  animate: props.open ? "open" : "closed",
}))<{ open: boolean }>`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 8px 12px;
  gap: 10px;
  align-self: stretch;
  color: ${(props) => props.theme.primaryTextv2};
  transition: background-color 0.23s ease-in-out;
  cursor: pointer;

  &:hover {
    background-color: rgb(
      ${(props) => props.theme.theme},
      ${(props) => (props.theme.displayTheme === "light" ? "0.1" : "0.05")}
    );
  }

  &:active {
    transform: scale(0.975) !important;
  }
`;

const MenuCard = styled.div`
  width: 139px;
  min-width: 139px;
  display: flex;
  padding: 4px 0px;
  flex-direction: column;
  align-items: flex-start;
  background-color: ${(props) => props.theme.backgroundv2};
  border-radius: 10px;
  border: 1.5px solid ${(props) => props.theme.primary};
  box-shadow: 0px 4px 20px 0px rgba(0, 0, 0, 0.4);
`;

const MenuTitle = styled.div`
  display: flex;
  height: 100%;
  margin: auto 0;
`;

interface Props {
  open: boolean;
  close: () => any;
  menuItems: MenuItem[];
}

export interface MenuItem {
  icon: JSX.Element;
  title: string;
  route: () => any;
}
