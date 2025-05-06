import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Box, Button, Card, TextInput, Text, WanderFooter } from "~components/embed";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation } from "~wallets/router/router.utils";
import { Flex } from "~components/common/Flex";
import { Eye, EyeOff } from "@untitled-ui/icons-react";
import { useInput } from "@arconnect/components-rebrand";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";

export function AuthEmailSigninEmbeddedView() {
  const { navigate } = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { authStatus, authEmail } = useEmbedded();
  const passwordInput = useInput();
  const [passwordType, setPasswordType] = useState("password");

  const areButtonsDisabled =
    authStatus === "unknown" ||
    authStatus === "loading" ||
    authStatus === "authLoading" ||
    !authEmail ||
    !passwordInput.state;

  const authStatusRef = useRef(authStatus);

  const handleEmailSignin = useCallback(async () => {
    try {
      setIsLoading(true);

      const supabase = await getSupabaseClient();

      if (!authEmail || !passwordInput.state) {
        toast.error("Please enter an email and password");
        return;
      }

      const { error, data } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: passwordInput.state,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const interval = setInterval(() => {
        if (authStatusRef.current === "unlocked") {
          navigate(EmbeddedPaths.WalletHomeEmbeddedView);
        }
      }, 1000);

      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (authStatusRef.current === "unlocked") {
            clearInterval(interval);
            resolve(true);
          }
        }, 1000);
      });

      return () => clearInterval(interval);
    } catch (error) {
      toast.error("Error signing up");
    } finally {
      setIsLoading(false);
    }
  }, [authEmail, passwordInput.state]);

  const handleTogglePasswordVisibility = useCallback(() => {
    setPasswordType(passwordType === "password" ? "text" : "password");
  }, [passwordType]);

  useEffect(() => {
    authStatusRef.current = authStatus;
  }, [authStatus]);

  return (
    <Card
      headerText="Enter your password"
      footerElement={<WanderFooter />}
      hasBackButton={true}
      hasCloseButton={false}
      size="auto">
      <Box style={{ gap: 32 }}>
        <Flex direction="column" gap={12} width="100%" style={{ paddingTop: 32, gap: 24, paddingBottom: 32 }}>
          <TextInput
            type={passwordType}
            {...passwordInput.bindings}
            placeholder="Enter your password"
            isDisabled={isLoading}
            hasButton
            buttonIcon={
              passwordType === "password" ? (
                <Eye
                  style={{
                    width: 22,
                    height: 22,
                    color: "var(--text-color-tertiary)",
                  }}
                />
              ) : (
                <EyeOff
                  style={{
                    width: 22,
                    height: 22,
                    color: "var(--text-color-tertiary)",
                  }}
                />
              )
            }
            buttonOnClick={handleTogglePasswordVisibility}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleEmailSignin();
              }
            }}
          />

          <Button isFullWidth isLoading={isLoading} onClick={handleEmailSignin} isDisabled={areButtonsDisabled}>
            Sign in
          </Button>
        </Flex>

        <Flex direction="row" gap={4} width="100%" justify="center">
          <Text variant={"bodySm"} alignment="left">
            Forgot your password?
          </Text>

          <Button
            style={{ width: "auto" }}
            variant="link"
            alignment="left"
            isFullWidth
            href={EmbeddedPaths.AuthRecoverAccount}>
            Recover account
          </Button>
        </Flex>
      </Box>
    </Card>
  );
}
