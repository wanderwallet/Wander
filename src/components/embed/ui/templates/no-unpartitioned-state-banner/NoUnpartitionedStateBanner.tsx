import { AnimatePresence } from "framer-motion";
import browser from "webextension-polyfill";
import { Button, Snackbar, MotionSnackbar } from "../../..";
import { useEmbedded } from "~utils/embedded/embedded.hooks";

// Animation variants
const bannerAnimations = {
  hidden: { y: 100 },
  visible: { y: 0 },
  exit: { y: 100 },
};

interface StoragePartitionedBannerProps {
  className?: string;
}

/**
 * Storage Partitioning Banner Component
 *
 * A simple banner that informs users about storage partitioning and its implications
 * for wallet availability across sites.
 */
export function NoUnpartitionedStateBanner({ className }: StoragePartitionedBannerProps) {
  const { unpartitionedStateStatus } = useEmbedded();
  const canBeRequested = unpartitionedStateStatus === "rejected" || unpartitionedStateStatus === "error";

  return unpartitionedStateStatus !== "supported" ? (
    <Snackbar variant="warning" className={className}>
      {browser.i18n.getMessage(canBeRequested ? "partitioned_storage_banner_rejected" : "partitioned_storage_banner")}

      {canBeRequested && (
        <Button variant="secondary" size="sm">
          {browser.i18n.getMessage("re_request_access")}
        </Button>
      )}
    </Snackbar>
  ) : null;
}

export function AnimatedNoUnpartitionedStateBanner({ className }: StoragePartitionedBannerProps) {
  const { unpartitionedStateStatus } = useEmbedded();
  const canBeRequested = unpartitionedStateStatus === "rejected" || unpartitionedStateStatus === "error";

  return unpartitionedStateStatus !== "supported" ? (
    <AnimatePresence>
      <MotionSnackbar
        variant="warning"
        className={className}
        variants={bannerAnimations}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3 }}>
        {browser.i18n.getMessage(canBeRequested ? "partitioned_storage_banner_rejected" : "partitioned_storage_banner")}

        {canBeRequested && (
          <Button variant="secondary" size="sm">
            {browser.i18n.getMessage("re_request_access")}
          </Button>
        )}
      </MotionSnackbar>
    </AnimatePresence>
  ) : null;
}
