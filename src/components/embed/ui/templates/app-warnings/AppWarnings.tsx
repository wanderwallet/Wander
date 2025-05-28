import { InputButton } from "~components/embed/ui/atoms/input-button/InputButton";
import { AlertTriangle } from "@untitled-ui/icons-react";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { NoUnpartitionedStateBanner } from "~components/embed/ui/templates/no-unpartitioned-state-banner/NoUnpartitionedStateBanner";

import styles from "./AppWarnings.module.scss";

export interface AppWarningsProps {}

export function AppWarnings() {
  const { unpartitionedStateStatus } = useEmbedded();

  if (unpartitionedStateStatus === "supported") return;

  const icon = <AlertTriangle className={styles.icon} />;

  return (
    <>
      <InputButton className={styles.button} icon={icon} />

      <NoUnpartitionedStateBanner className={styles.banner} />
    </>
  );
}
