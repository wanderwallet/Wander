import { permissionData, signPolicyOptions, type PermissionType } from "~applications/permissions";
import { Box, Radio, Snackbar, InfoIcon, Text, Row, ChevronRight } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import { Spacer } from "@arconnect/components-rebrand";
import type { SignPolicy } from "~applications/application";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { ExtensionStorage, useStorage } from "~utils/storage";
import { useState, useMemo, useEffect, useCallback } from "react";
import Application from "~applications/application";
import { Edit02 } from "@untitled-ui/icons-react";
import { addApp } from "~applications";
import { defaultGateway } from "~gateways/gateway";
import AppIcons from "./components/AppIcons";
import { AuthRequestCard } from "~components/embed/ui/molecules/card/auth-request-card/AuthRequestCard";

export function EmbeddedConnectSettingsAuthRequestView() {
  const { navigate } = useLocation();
  const [signPolicy, setSignPolicy] = useStorage<SignPolicy>(
    {
      key: "sign_policy",
      instance: ExtensionStorage,
    },
    "ask_when_spending",
  );

  const { authRequest, acceptRequest, rejectRequest } = useCurrentAuthRequest("connect");

  const { url = "", permissions: authRequestPermissions = [], appInfo = {}, gateway } = authRequest;

  const [requestedPermissions, setRequestedPermissions] = useStorage<PermissionType[]>({
    key: `requested_permissions_${url}`,
    instance: ExtensionStorage,
  });
  const [requestedPermCopy, setRequestedPermCopy] = useState<PermissionType[]>([]);

  const isCustomPermissions = useMemo(() => {
    if (!requestedPermissions) return false;
    if (requestedPermissions?.length !== requestedPermCopy.length) return true;

    // Create sorted copies to ensure order doesn't matter
    const sortedRequested = [...requestedPermissions].sort();
    const sortedInitial = [...requestedPermCopy].sort();

    // Compare each element
    return sortedRequested.some((permission, index) => permission !== sortedInitial[index]);
  }, [requestedPermissions, requestedPermCopy]);

  const handlePermissionChange = (permission: SignPolicy) => {
    setSignPolicy(permission);
  };

  const handleConfirm = useCallback(async () => {
    if (!signPolicy || !url) return;

    // get existing permissions
    const app = new Application(url);
    const isAppPresent = await app.isAppPresent();

    if (!isAppPresent) {
      // add the app
      await addApp({
        url,
        permissions: requestedPermissions,
        name: appInfo.name,
        logo: appInfo.logo,
        signPolicy,
        // alwaysAsk,
        allowance: {
          enabled: false,
          limit: "0",
          spent: "0", // in winstons
        },
        // TODO: wayfinder
        gateway: gateway || defaultGateway,
      });
    } else {
      // update existing permissions, if the app
      // has already been added

      await app.updateSettings({
        signPolicy,
        permissions: requestedPermissions,
        // alwaysAsk,
        allowance: {
          enabled: false,
          limit: "0",
          spent: "0", // in winstons
        },
      });
    }

    acceptRequest();
  }, [url, requestedPermissions, appInfo, signPolicy, gateway, acceptRequest]);

  useEffect(() => {
    (async () => {
      const requested: PermissionType[] = authRequestPermissions;

      // add existing permissions
      if (url) {
        const app = new Application(url);
        const existing = await app.getPermissions();

        for (const existingP of existing) {
          if (requested.includes(existingP)) continue;
          requested.push(existingP);
        }
      }

      const requestedPermissions = await ExtensionStorage.get(`requested_permissions_${url}`);

      if (!requestedPermissions) {
        setRequestedPermissions(requested.filter((p) => Object.keys(permissionData).includes(p)));
      }

      setRequestedPermCopy(requested.filter((p) => Object.keys(permissionData).includes(p)));
    })();
  }, [url, authRequestPermissions]);

  return (
    <AuthRequestCard
      onBackButtonClick={() => navigate(`/auth-request/connect/${ authRequest.authID }`)}
      onCancel={() => rejectRequest()}
      onConfirm={handleConfirm}
      confirmLabel="Next"
      areButtonsDisabled={!signPolicy || !url}>

      <AppIcons appInfo={appInfo} />

      <Text variant="headingMd">Confirm permissions</Text>

      <Box alignment="left" style={{ padding: 0 }}>
        {signPolicyOptions.map((option) => (
          <Radio
            key={option}
            size={24}
            label={browser.i18n.getMessage(option)}
            isChecked={signPolicy === option}
            handleChange={() => handlePermissionChange(option)}
          />
        ))}
        <Spacer y={1} />
        <Row
          alignment="left"
          justifyContent="between"
          style={{ cursor: "pointer" }}
          onClick={() => navigate(`/auth-request/connect/${ authRequest.authID }/custom`)}>
          <Text variant="headingMd" style={{ fontSize: 16, fontWeight: 500 }} alignment="left">
            {isCustomPermissions ? "Custom permissions set" : "Set custom permissions"}
          </Text>
          {isCustomPermissions ? (
            <Edit02 height={24} width={24} color="var(--color-font-body)" />
          ) : (
            <ChevronRight height={24} width={24} color="var(--color-font-body)" />
          )}
        </Row>
        <Spacer y={1} />
        <Snackbar
          text={browser.i18n.getMessage(`${signPolicy}_description`)}
          icon={<InfoIcon />}
          backgroundColor="var(--color-background-default)"
          iconColor="var(--color-font-body)"
          textColor="var(--color-font-body)"
        />
      </Box>

    </AuthRequestCard>
  );
}
