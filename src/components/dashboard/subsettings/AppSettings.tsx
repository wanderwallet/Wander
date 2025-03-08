import { InputWithBtn, InputWrapper } from "~components/arlocal/InputWrapper";
import {
  permissionData,
  signPolicyOptions,
  type PermissionType
} from "~applications/permissions";
import { EditIcon } from "@iconicicons/react";
import { useEffect, useMemo, useState } from "react";
import { IconButton } from "~components/IconButton";
import { PermissionDescription } from "~components/auth/PermissionCheckbox";
import { removeApp } from "~applications";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  Select,
  Spacer,
  Text,
  useInput,
  useModal,
  useToasts
} from "@arconnect/components-rebrand";
import { concatGatewayURL, urlToGateway } from "~gateways/utils";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import styled from "styled-components";
import Arweave from "arweave";
import { defaultGateway, suggestedGateways, testnets } from "~gateways/gateway";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { LoadingView } from "~components/page/common/loading/loading.view";
import { ToggleSwitch } from "~routes/popup/subscriptions/subscriptionDetails";
import { Flex } from "~components/common/Flex";

export interface AppSettingsDashboardViewParams {
  url: string;
}

export interface AppSettingsDashboardViewProps
  extends CommonRouteProps<AppSettingsDashboardViewParams> {
  noTitle?: boolean;
}

export function AppSettingsDashboardView({
  noTitle = false,
  params: { url }
}: AppSettingsDashboardViewProps) {
  const app = useMemo(() => {
    return new Application(decodeURIComponent(url));
  }, [url]);

  // app settings
  const [settings, updateSettings] = app.hook();
  const arweave = new Arweave(defaultGateway);

  // allowance spent qty
  const spent = useMemo(() => {
    const val = settings?.allowance?.spent;

    if (!val) return "0";
    return val.toString();
  }, [settings]);

  // allowance limit
  const limit = useMemo(() => {
    const val = settings?.allowance?.limit;

    if (!val) return arweave.ar.arToWinston("0.1");
    return val.toString();
  }, [settings]);

  // editing limit
  const [editingLimit, setEditingLimit] = useState(false);

  // active gateway
  const gateway = useMemo(() => {
    const val = settings?.gateway;

    if (!val) {
      return concatGatewayURL(defaultGateway);
    }

    return concatGatewayURL(val);
  }, [settings]);

  // is the current gateway a custom one
  const isCustom = useMemo(() => {
    const gatewayUrls = suggestedGateways
      .concat(testnets)
      .map((g) => concatGatewayURL(g));

    return !gatewayUrls.includes(gateway);
  }, [gateway]);

  // editing custom gateway
  const [editingCustom, setEditingCustom] = useState(false);

  // custom gateway input
  const customGatewayInput = useInput();

  useEffect(() => {
    if (!isCustom || !settings.gateway) return;

    setEditingCustom(true);
    customGatewayInput.setState(concatGatewayURL(settings.gateway));
  }, [isCustom, settings?.gateway]);

  // toasts
  const { setToast } = useToasts();

  // remove modal
  const removeModal = useModal();

  if (!settings) {
    return <LoadingView />;
  }

  return (
    <div>
      {noTitle ? null : (
        <>
          <Spacer y={0.45} />
          <AppName>{settings?.name || settings?.url}</AppName>
          <AppUrl
            href={`https://${settings?.url || ""}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Text>
              {settings?.url}
              {settings?.blocked && <BlockedText>Blocked</BlockedText>}
            </Text>
          </AppUrl>
        </>
      )}
      <Title>{browser.i18n.getMessage("permissions")}</Title>
      {Object.keys(permissionData).map((permissionName: PermissionType, i) => {
        let formattedPermissionName = permissionName
          .split("_")
          .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
          .join(" ");

        if (permissionName === "SIGNATURE") {
          formattedPermissionName = "Sign Data";
        }

        return (
          <div key={i}>
            <ToggleSwitch
              setChecked={(checked) =>
                updateSettings((val) => {
                  // toggle permission
                  if (checked && !val.permissions.includes(permissionName)) {
                    val.permissions.push(permissionName);
                  } else if (!checked) {
                    val.permissions = val.permissions.filter(
                      (p) => p !== permissionName
                    );
                  }

                  return val;
                })
              }
              checked={settings.permissions.includes(permissionName)}
            >
              <Flex direction="column">
                <Text size="md" weight="medium" noMargin>
                  {formattedPermissionName}
                </Text>
                <PermissionDescription>
                  {browser.i18n.getMessage(permissionData[permissionName])}
                </PermissionDescription>
              </Flex>
            </ToggleSwitch>
            {i !== Object.keys(permissionData).length - 1 && <Spacer y={0.8} />}
          </div>
        );
      })}
      <Spacer y={1} />
      <Title>{browser.i18n.getMessage("permission_settings")}</Title>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {signPolicyOptions.map((option) => (
          <PolicyOption
            key={option}
            onClick={() =>
              updateSettings((val) => ({ ...val, signPolicy: option }))
            }
          >
            <Checkbox
              size={20}
              onChange={() =>
                updateSettings((val) => ({ ...val, signPolicy: option }))
              }
              checked={settings?.signPolicy === option}
            />
            <div>
              <PrimaryText fontSize={16}>
                {browser.i18n.getMessage(option)}
              </PrimaryText>
            </div>
          </PolicyOption>
        ))}
      </div>
      {/* <Title>{browser.i18n.getMessage("allowance")}</Title>
      <PermissionCheckbox
        onChange={(checked) => {
          setEditingLimit(false);
          return updateSettings((val) => ({
            ...val,
            allowance: {
              ...defaultAllowance,
              ...val.allowance,
              enabled: checked
            }
          }));
        }}
        checked={settings.allowance?.enabled}
      >
        {browser.i18n.getMessage(
          settings.allowance?.enabled ? "enabled" : "disabled"
        )}
        <br />
        <PermissionDescription>
          {browser.i18n.getMessage("allowanceTip")}
        </PermissionDescription>
      </PermissionCheckbox>
      <Spacer y={0.8} />
      <Text noMargin>
        {browser.i18n.getMessage("spent")}
        {": "}
        {arweave.ar.winstonToAr(spent)}
        {" AR "}
        <TooltipV2
          content={browser.i18n.getMessage("resetSpentQty")}
          position="top"
        >
          <ResetButton
            onClick={() =>
              updateSettings((val) => ({
                ...val,
                allowance: {
                  ...defaultAllowance,
                  ...val.allowance,
                  spent: "0"
                }
              }))
            }
          >
            {browser.i18n.getMessage("reset")}
          </ResetButton>
        </TooltipV2>
      </Text>
      <Spacer y={0.55} />
      <Text noMargin>
        {browser.i18n.getMessage("limit")}
        {": "}
        {editingLimit ? (
          <EmptyInput
            value={arweave.ar.winstonToAr(limit)}
            min="0"
            step="any"
            onChange={(e) =>
              updateSettings((val) => ({
                ...val,
                allowance: {
                  ...defaultAllowance,
                  ...val.allowance,
                  limit: arweave.ar.arToWinston(e.target.value)
                }
              }))
            }
          />
        ) : settings?.allowance?.enabled ? (
          arweave.ar.winstonToAr(limit)
        ) : (
          "∞"
        )}
        {" AR "}
        <TooltipV2
          content={browser.i18n.getMessage("allowance_edit")}
          position="top"
        >
          <EditLimitButton
            disabled={!settings?.allowance?.enabled}
            as={editingLimit ? CheckIcon : EditIcon}
            onClick={() => setEditingLimit((val) => !val)}
          />
        </TooltipV2>
      </Text> */}
      <Spacer y={1} />
      <Title>{browser.i18n.getMessage("gateway")}</Title>
      <Select
        onChange={(e) => {
          // @ts-expect-error
          if (e.target.value === "custom") {
            return setEditingCustom(true);
          }

          setEditingCustom(false);
          updateSettings((val) => ({
            ...val,
            // @ts-expect-error
            gateway: urlToGateway(e.target.value)
          }));
        }}
        fullWidth
      >
        {suggestedGateways.concat(testnets).map((g, i) => {
          const url = concatGatewayURL(g);

          return (
            <option value={url} selected={!isCustom && url === gateway} key={i}>
              {url}
            </option>
          );
        })}
        <option value="custom" selected={isCustom}>
          Custom
        </option>
      </Select>
      {editingCustom && (
        <>
          <Spacer y={0.8} />
          <InputWithBtn>
            <InputWrapper>
              <Input
                {...customGatewayInput.bindings}
                type="text"
                placeholder="https://arweave.net:443"
                fullWidth
              />
            </InputWrapper>
            <IconButton
              variant="secondary"
              onClick={() => {
                updateSettings((val) => ({
                  ...val,
                  gateway: urlToGateway(customGatewayInput.state)
                }));
                setToast({
                  type: "info",
                  content: browser.i18n.getMessage("setCustomGateway"),
                  duration: 3000
                });
              }}
            >
              Save
            </IconButton>
          </InputWithBtn>
        </>
      )}
      <Spacer y={1} />
      <Title>{browser.i18n.getMessage("bundlrNode")}</Title>
      <Input
        value={settings.bundler}
        onChange={(e) =>
          updateSettings((val) => ({
            ...val,
            // @ts-expect-error
            bundler: e.target.value
          }))
        }
        fullWidth
        placeholder="https://turbo.ardrive.io"
      />
      <Spacer y={1.65} />
      <Button fullWidth onClick={() => removeModal.setOpen(true)}>
        {browser.i18n.getMessage("removeApp")}
      </Button>
      <Spacer y={0.7} />
      <Button
        fullWidth
        variant="secondary"
        onClick={() =>
          updateSettings((val) => ({
            ...val,
            blocked: !val.blocked
          }))
        }
      >
        {browser.i18n.getMessage(settings.blocked ? "unblock" : "block")}
      </Button>
      <Modal
        {...removeModal.bindings}
        root={document.getElementById("__plasmo")}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => removeModal.setOpen(false)}
            >
              {browser.i18n.getMessage("cancel")}
            </Button>
            <Button onClick={() => removeApp(app.url)}>
              {browser.i18n.getMessage("remove")}
            </Button>
          </>
        }
      >
        <CenterText>{browser.i18n.getMessage("removeApp")}</CenterText>
        <Spacer y={0.55} />
        <CenterText noMargin>
          {browser.i18n.getMessage("removeAppNote")}
        </CenterText>
        <Spacer y={0.75} />
      </Modal>
    </div>
  );
}

const AppName = styled(Text).attrs({
  size: "3xl",
  weight: "bold",
  noMargin: true
})`
  font-weight: 600;
`;

const AppUrl = styled.a`
  cursor: pointer;
  text-decoration: none;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.7;
  }
`;

const BlockedText = styled.span`
  color: #ff0000;
  font-weight: 500;
  font-size: 0.8rem;
  text-transform: uppercase;
  margin-left: 0.375rem;
`;

const Title = styled(Text).attrs({
  heading: true
})`
  margin-bottom: 0.6em;
`;

const ResetButton = styled.span`
  border-bottom: 1px dotted rgba(${(props) => props.theme.theme}, 0.8);
  margin-left: 0.37rem;
  cursor: pointer;
`;

const EmptyInput = styled.input.attrs({
  type: "number",
  focus: true
})`
  border: none;
  outline: none;
  background-color: transparent;
  padding: 0;
  margin: 0;
  font-size: 1em;
  color: rgb(${(props) => props.theme.secondaryText});
`;

const EditLimitButton = styled(EditIcon)<{ disabled?: boolean }>`
  font-size: 1em;
  width: 1em;
  height: 1em;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.23s ease-in-out;
  opacity: ${(props) => (props.disabled ? "0.5" : "1")};
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};

  &:hover {
    opacity: ${(props) => (props.disabled ? "0.5" : "0.8")};
  }

  &:active {
    transform: ${(props) => (props.disabled ? "none" : "scale(0.83)")};
  }
`;

const CenterText = styled(Text)`
  text-align: center;
  max-width: 22vw;
  margin: 0 auto;

  @media screen and (max-width: 720px) {
    max-width: 90vw;
  }
`;

const PolicyOption = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const PrimaryText = styled(Text).attrs({
  noMargin: true
})<{ fontSize?: number; fontWeight?: number; textAlign?: string }>`
  color: ${(props) => props.theme.primaryTextv2};
  font-size: ${(props) => props.fontSize || 14}px;
  font-weight: ${(props) => props.fontWeight || 500};
  text-align: ${(props) => props.textAlign || "left"};
`;
