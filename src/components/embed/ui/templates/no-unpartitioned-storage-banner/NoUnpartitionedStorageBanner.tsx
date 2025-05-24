import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PARTITIONED_STORAGE_BANNER_EVENT } from "~iframe/storage/unpartitioned-storage/unpartitioned-storage.utils";
import browser from "webextension-polyfill";
import { Button, Snackbar } from "../../..";

// Animation variants
const bannerAnimations = {
  hidden: { y: 100 },
  visible: { y: 0 },
  exit: { y: 100 },
};

const hasWebStorageAPI = typeof document.hasStorageAccess === "function";
const hasWebStorageWithLocalStorageSupportAPI = typeof (document as any).hasUnpartitionedCookieAccess === "function";

interface StoragePartitionedBannerProps {
  className?: string;
}

/**
 * Storage Partitioning Banner Component
 *
 * A simple banner that informs users about storage partitioning and its implications
 * for wallet availability across sites.
 */
export function NoUnpartitionedStorageBanner({ className }: StoragePartitionedBannerProps) {
  const [isVisible, setIsVisible] = useState(!hasWebStorageAPI || !hasWebStorageWithLocalStorageSupportAPI || !!window);
  const [actionButtonType, setActionButtonType] = useState<"dismiss" | "re-request">("dismiss");

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
  }, []);

  // TODO: Different message if no access vs no support.

  return (
    <AnimatePresence>
      {isVisible && (
        <Snackbar
          variant="warning"
          className={className}
          tag={motion.div}
          variants={bannerAnimations}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3 }}>
          {browser.i18n.getMessage("partitioned_storage_banner")}

          {actionButtonType !== "re-request" && (
            <Button isFullWidth>{browser.i18n.getMessage("re_request_access")}</Button>
          )}
        </Snackbar>
      )}
    </AnimatePresence>
  );
}
