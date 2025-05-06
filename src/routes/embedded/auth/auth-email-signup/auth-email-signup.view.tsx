import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Box, Button, Card, TextInput, Text, WanderFooter } from "~components/embed";
import { useCallback, useMemo, useState } from "react";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation } from "~wallets/router/router.utils";
import { Flex } from "~components/common/Flex";
import { Eye, EyeOff } from "@untitled-ui/icons-react";
import { useInput } from "@arconnect/components-rebrand";
import PasswordMatch from "~components/welcome/PasswordMatch";
import PasswordStrength from "~components/welcome/PasswordStrength";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";

export function AuthEmailSignupEmbeddedView() {
  const { navigate } = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { authStatus, authEmail } = useEmbedded();
  const passwordInput = useInput();
  const validPasswordInput = useInput();
  const [passwordType, setPasswordType] = useState("password");

  const areButtonsDisabled = authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading";

  // passwords match
  const matches = useMemo(
    () => passwordInput.state === validPasswordInput.state && passwordInput.state?.length >= 5,
    [passwordInput, validPasswordInput],
  );

  const handleEmailSignup = useCallback(async () => {
    try {
      setIsLoading(true);

      const supabase = await getSupabaseClient();

      if (!authEmail || !passwordInput.state) {
        toast.error("Please enter an email and password");
        return;
      }

      const { error, data } = await supabase.auth.signUp({
        email: authEmail,
        password: passwordInput.state,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      navigate(EmbeddedPaths.AuthEmailVerify);
    } catch (error) {
      toast.error("Error signing up");
    } finally {
      setIsLoading(false);
    }
  }, [authEmail, passwordInput.state]);

  const handleTogglePasswordVisibility = useCallback(() => {
    setPasswordType(passwordType === "password" ? "text" : "password");
  }, [passwordType]);

  return (
    <Card
      headerText="Create your password"
      footerElement={<WanderFooter />}
      hasBackButton={true}
      hasCloseButton={false}
      size="auto"
      isLoading={ isLoading }>
      <Box style={{ gap: 32 }}>
        <Text variant={"bodySm"} alignment={"center"}>
          Enter a password to secure your Wander account.
        </Text>
        <Flex direction="column" gap={12} width="100%">
          <TextInput
            type={passwordType}
            {...passwordInput.bindings}
            placeholder="Enter your password"
            isDisabled={areButtonsDisabled}
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
          />
          <TextInput
            type={passwordType}
            {...validPasswordInput.bindings}
            placeholder="Enter your password"
            isDisabled={areButtonsDisabled}
          />

          <PasswordMatch matches={matches} />
          <PasswordStrength password={passwordInput.state} />
        </Flex>

        <Button isFullWidth isLoading={isLoading} onClick={handleEmailSignup} isDisabled={areButtonsDisabled}>
          {matches ? "Next" : "Enter password"}
        </Button>
      </Box>
    </Card>
  );
}
