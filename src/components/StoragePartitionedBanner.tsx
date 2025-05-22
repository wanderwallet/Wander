import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { InfoCircle, X as XClose } from "@untitled-ui/icons-react";
import { PARTITIONED_STORAGE_BANNER_EVENT } from "~iframe/storage/unpartitioned-storage/unpartitioned-storage.utils";
import browser from "webextension-polyfill";
import { Button } from "./embed";

const BannerWrapper = styled(motion.div)`
  background-color: #ffe3ba;
  color: #663c00;
  z-index: 9999;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const BannerContent = styled.div`
  display: flex;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const IconWrapper = styled.div`
  flex-shrink: 0;
  margin-right: 12px;
`;

const MessageText = styled.div`
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
`;

// Animation variants
const bannerAnimations = {
  hidden: { y: 100 },
  visible: { y: 0 },
  exit: { y: 100 },
};

// Props interface
interface StoragePartitionedBannerProps {
  /**
   * Initial state of the banner (visible or hidden)
   * @default false
   */
  initiallyVisible?: boolean;

  /**
   * Custom message to display in the banner
   */
  message?: string;

  /**
   * Local storage key for remembering banner dismissal
   * @default "PARTITIONED_STORAGE_BANNER_DISMISSED"
   */
  dismissStorageKey?: string;

  /**
   * Function called when banner is dismissed
   */
  onDismiss?: () => void;
}

/**
 * Storage Partitioning Banner Component
 *
 * A simple banner that informs users about storage partitioning and its implications
 * for wallet availability across sites.
 */
export default function StoragePartitionedBanner({
  initiallyVisible = false,
  message = browser.i18n.getMessage("partitioned_storage_banner"),
  onDismiss,
}: StoragePartitionedBannerProps) {
  const [isVisible, setIsVisible] = useState(initiallyVisible);
  const [actionButtonType, setActionButtonType] = useState<"dismiss" | "re-request">("dismiss");

  // State for custom message that may come from events
  const [customMessage, setCustomMessage] = useState(message);

  // Check session storage on mount and set initial visibility
  useEffect(() => {
    // Listen for custom event to show the banner
    const handleBanner = (event: CustomEvent) => {
      // Get message from event if provided
      const { type = "open", actionButtonType = "dismiss" } = event.detail;

      const isOpen = type === "open";

      setActionButtonType(actionButtonType);
      setIsVisible(isOpen);

      if (!isOpen) clearListener();
    };

    const clearListener = () => {
      document.removeEventListener(PARTITIONED_STORAGE_BANNER_EVENT, handleBanner);
    };

    // Add event listener with type casting
    document.addEventListener(PARTITIONED_STORAGE_BANNER_EVENT, handleBanner);

    // Clean up event listener when component unmounts
    return () => clearListener();
  }, [initiallyVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <BannerWrapper
          variants={bannerAnimations}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3 }}>
          <BannerContent>
            <IconWrapper>
              <InfoCircle width={20} height={20} />
            </IconWrapper>
            <MessageText>{customMessage}</MessageText>
          </BannerContent>

          {actionButtonType === "re-request" && (
            <Button isFullWidth>{browser.i18n.getMessage("re_request_access")}</Button>
          )}
        </BannerWrapper>
      )}
    </AnimatePresence>
  );
}
