import { Copy01, Eye, EyeOff } from "@untitled-ui/icons-react";
import copy from "copy-to-clipboard";
import { useState, useEffect } from "react";
import { Flex } from "~components/common/Flex";
import {
  Box,
  Button,
  Card,
  WanderFooter,
  Snackbar,
  WarningIcon,
  Text,
  CheckIcon
} from "~components/embed/ui";
import { Loading } from "~components/embed/ui/atoms/loading";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";

export function AccountBackupCopySeedphraseEmbeddedView() {
  const { navigate } = useLocation();
  const { getSeedphrase } = useEmbedded();
  const [isLoading, setIsLoading] = useState(true);
  const [seedphrase, setSeedphrase] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  async function fetchSeedphrase() {
    setIsLoading(true);
    const recoveryPhrase = await getSeedphrase(() => Promise.resolve(true));
    if (recoveryPhrase) {
      setSeedphrase(recoveryPhrase);
      setIsLoading(false);
    }
  }

  async function copySeedphrase() {
    await copy(seedphrase);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  }

  useEffect(() => {
    fetchSeedphrase();
  }, []);

  return (
    <Card
      headerText="Copy seedphrase"
      subtitle="Save your 12 word seedphrase to a password manager, or write it down."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      hasCloseButton={true}
      size="auto"
    >
      <Box style={{ gap: 28 }}>
        <Snackbar
          isFullWidth
          icon={<WarningIcon />}
          text="Do not share this with anyone."
          backgroundColor="#F2DC1320"
          borderColor="#F2DC1320"
          textColor="#121212"
          iconColor="#BD8802"
        />

        <Box style={{ position: "relative", padding: 0, margin: 0 }}>
          <Box
            style={{
              backgroundColor: "#f2f2f7",
              backdropFilter: "blur(7px)",
              borderRadius: 10,
              padding: 16,
              flexWrap: "wrap",
              filter: isVisible ? "none" : "blur(5px)"
            }}
          >
            <Text
              variant="bodySm"
              style={{
                color: "var(--text-color-primary)",
                wordBreak: "break-word",
                wordSpacing: "8px"
              }}
            >
              {seedphrase}
            </Text>
          </Box>
          <Button
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              maxWidth: "fit-content"
            }}
            variant="icon"
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? (
              <EyeOff style={{ height: 16, width: 16 }} />
            ) : (
              <Eye style={{ height: 16, width: 16 }} />
            )}
          </Button>
          {isLoading && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Loading />
            </div>
          )}
        </Box>
        <Flex
          gap={8}
          align="center"
          justify="center"
          style={{
            cursor: "pointer",
            marginTop: -20,
            marginLeft: 8,
            alignSelf: "flex-start"
          }}
          onClick={copySeedphrase}
        >
          <Text variant="bodyMd">{isCopied ? "Copied" : "Copy"}</Text>
          {isCopied ? (
            <CheckIcon style={{ height: 16, width: 16, color: "#22c55e" }} />
          ) : (
            <Copy01 style={{ height: 16, width: 16 }} />
          )}
        </Flex>
        <Box style={{ padding: 0 }}>
          <Button isFullWidth onClick={() => navigate("/wallet")}>
            Done
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
