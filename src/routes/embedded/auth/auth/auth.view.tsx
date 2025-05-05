import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Card,
  Divider,
  GoogleIcon,
  KeyIcon,
  TextInput,
  Row,
  SocialsIcon,
  Text,
  Wander2Icon,
  WanderFooter
} from "~components/embed";
import { useCallback, useRef, useState } from "react";
import type { AuthProviderType } from "embed-api";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation } from "~wallets/router/router.utils";
import { isValidEmail } from "~utils/email";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";

export function AuthEmbeddedView() {
  const { navigate } = useLocation();
  const { authenticate, authStatus, setAuthEmail } = useEmbedded();
  const [isLoading, setIsLoading] = useState(false);

  const [selectedAuthProviderType, setSelectedAuthProviderType] =
    useState<AuthProviderType | null>(null);

  const areButtonsDisabled =
    authStatus === "unknown" ||
    authStatus === "loading" ||
    authStatus === "authLoading" ||
    !!selectedAuthProviderType;

  // TODO: Remember last selection and highlight that one / show it in the main screen (not in "More")

  const emailInputRef = useRef<HTMLInputElement>();
  const passwordInputRef = useRef<HTMLInputElement>();

  const handleAuthenticate = useCallback(
    async (authProviderType: AuthProviderType) => {
      setSelectedAuthProviderType(authProviderType);
      try {
        await authenticate(
          authProviderType,
          emailInputRef.current?.value || "",
          passwordInputRef.current?.value || ""
        );
        setSelectedAuthProviderType(null);
      } catch (error) {
        toast.error(`Error signing in with ${authProviderType}`);
      } finally {
        setSelectedAuthProviderType(null);
      }
    },
    []
  );

  const handleCheckEmail = useCallback(async () => {
    try {
      setIsLoading(true);

      const supabase = await getSupabaseClient();

      const email = emailInputRef.current?.value || "";

      if (!email || !isValidEmail(email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      const { data: isAlreadyRegistered, error } = await supabase.rpc(
        "user_exists_by_email",
        {
          p_email: email
        }
      );

      if (error) {
        toast.error("Error checking email");
        return;
      }

      setAuthEmail(email);

      if (isAlreadyRegistered) {
        navigate(EmbeddedPaths.AuthEmailSignin);
      } else {
        navigate(EmbeddedPaths.AuthEmailSignup);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error checking email");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <Card
      headerText="Sign up or Sign in"
      footerElement={<WanderFooter />}
      hasBackButton={false}
      size="auto"
    >
      <Box>
        <TextInput
          ref={emailInputRef}
          type="email"
          placeholder="Enter your email"
          isDisabled={areButtonsDisabled || isLoading}
          hasButton
          buttonLabel="Next"
          isLoading={isLoading}
          buttonOnClick={handleCheckEmail}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCheckEmail();
            }
          }}
        />
        <Divider text={"OR"} />
        <Row>
          <Button
            variant="outlined"
            size="md"
            isLoading={selectedAuthProviderType === "GOOGLE"}
            isDisabled={areButtonsDisabled}
            onClick={() => handleAuthenticate("GOOGLE")}
          >
            <GoogleIcon fontSize={24} />
          </Button>
          <Button variant="outlined" size="md" isDisabled>
            <Wander2Icon fontSize={24} />
          </Button>
        </Row>
        <Button
          variant="outlined"
          isFullWidth
          isDisabled
          icon={<SocialsIcon fontSize={24} />}
          href="#/auth/more-providers"
        >
          More options
        </Button>
        <Row style={{ gap: "4px" }}>
          <Text variant={"bodySm"}>{"Can't sign in?"}</Text>
          <Button variant="link" href="#/auth/recover-account" size="sm">
            Recover account
          </Button>
        </Row>
      </Box>
    </Card>
  );
}
