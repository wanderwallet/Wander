import styled, { useTheme } from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Section, Button, Text, Tooltip, Loading, useToasts } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { ArrowUpRight, HelpCircle, Plus, Trash02 } from "@untitled-ui/icons-react";
import { useDelegationInfo, useFairLaunchTokens } from "~utils/fair_launch/fair_launch.hooks";
import { AO_PROCESS_ID, defaultTokens } from "~tokens/aoTokens/ao";
import { PI_FLP_ID } from "~utils/fair_launch/fair_launch.constants";
import { useActiveAddress } from "~wallets/hooks";
import { Flex } from "~components/common/Flex";
import { Logo } from "~components/popup/Token";
import { getUserAvatar } from "~lib/avatar";
import type { FlpTokenInfo } from "~utils/fair_launch/fair_launch.types";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { AddTokenPopup } from "~components/popup/earn/AddTokenPopup";
import { Link } from "~components/common/Link";
import { MinusIcon, PlusIcon } from "@iconicicons/react";
import { updateDelegationInfo } from "~utils/fair_launch/fair_launch.utils";

export function ManageEarningsView() {
  const [isSaving, setIsSaving] = useState(false);
  const [updatedDelegationInfo, setUpdatedDelegationInfo] = useState<Record<string, number>>({});
  const [showAddTokenPopup, setShowAddTokenPopup] = useState(false);
  const { setToast } = useToasts();
  const activeAddress = useActiveAddress();
  const { data: delegationInfo = {}, isLoading: isLoadingDelegationInfo } = useDelegationInfo();
  const { data: flpTokens = [], isLoading: isLoadingFlpTokens } = useFairLaunchTokens();

  const primaryTokens = useMemo(
    () => [
      { ...defaultTokens[1], flpId: activeAddress, autoClaim: true },
      { ...defaultTokens[2], flpId: PI_FLP_ID, autoClaim: true },
    ],
    [activeAddress],
  );

  const tokens = useMemo(() => {
    return [...primaryTokens, ...flpTokens].map((token) => ({ ...token, percent: delegationInfo[token.flpId] || 0 }));
  }, [primaryTokens, flpTokens, delegationInfo]);

  const delegatedTokens = useMemo(() => {
    return tokens.filter((token) => updatedDelegationInfo[token.flpId]);
  }, [tokens, updatedDelegationInfo]);

  const isDelegationInfoUpdated = useMemo(() => {
    const delegationKeys = Object.keys(delegationInfo);
    const updatedKeys = Object.keys(updatedDelegationInfo);

    if (delegationKeys.length !== updatedKeys.length) return true;

    return delegationKeys.some((key) => delegationInfo[key] !== updatedDelegationInfo[key]);
  }, [updatedDelegationInfo, delegationInfo]);

  const saveDelegationInfo = useCallback(async () => {
    try {
      setIsSaving(true);

      // Find changed delegations
      const changedDelegations: Record<string, number> = {};

      // Check for added or modified delegations
      for (const [key, value] of Object.entries(updatedDelegationInfo)) {
        if (value !== delegationInfo[key]) {
          changedDelegations[key] = value;
        }
      }

      // Check for removed delegations
      for (const key of Object.keys(delegationInfo)) {
        if (!(key in updatedDelegationInfo)) {
          changedDelegations[key] = 0;
        }
      }

      await updateDelegationInfo(changedDelegations, activeAddress);

      setToast({
        type: "success",
        content: browser.i18n.getMessage("delegation_info_saved"),
        duration: 2400,
      });
    } catch {
      setToast({
        type: "error",
        content: browser.i18n.getMessage("delegation_info_save_failed"),
        duration: 2400,
      });
    } finally {
      setIsSaving(false);
    }
  }, [updatedDelegationInfo, delegationInfo, activeAddress]);

  useEffect(() => {
    if (Object.keys(updatedDelegationInfo).length > 0) return;
    setUpdatedDelegationInfo(delegationInfo);
  }, [delegationInfo]);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("manage_earnings")} />

      <Wrapper>
        <Flex direction="column" gap={8} style={{ overflow: "auto" }}>
          {isLoadingDelegationInfo || isLoadingFlpTokens ? (
            <Flex align="center" justify="center" padding="8px 0px">
              <Loading style={{ width: 24, height: 24 }} />
            </Flex>
          ) : (
            delegatedTokens.map((token) => (
              <Token
                key={token.flpId}
                token={token}
                delegationInfo={updatedDelegationInfo}
                setDelegationInfo={setUpdatedDelegationInfo}
                activeAddress={activeAddress}
                isLoading={false}
              />
            ))
          )}
          <Button
            variant="secondary"
            icon={<Plus width={24} height={24} />}
            fullWidth
            onClick={() => setShowAddTokenPopup(true)}>
            {browser.i18n.getMessage("add_token")}
          </Button>
        </Flex>
        <Flex direction="column" gap={8}>
          <Button
            fullWidth
            disabled={!isDelegationInfoUpdated || isSaving}
            onClick={saveDelegationInfo}
            loading={isSaving}>
            {browser.i18n.getMessage("save")}
          </Button>
          <Flex align="center" justify="center" padding="8px 0px">
            <Link color="#9787FF" href="https://ao.arweave.net/#/delegate/">
              {browser.i18n.getMessage("explore_all_projects")} <ArrowUpRight height={20} width={20} />
            </Link>
          </Flex>
        </Flex>
      </Wrapper>
      <AddTokenPopup
        open={showAddTokenPopup}
        close={() => setShowAddTokenPopup(false)}
        tokens={tokens.slice(1)}
        delegationInfo={updatedDelegationInfo}
        setDelegationInfo={setUpdatedDelegationInfo}
      />
    </>
  );
}

function Token({
  token,
  isLoading,
  setDelegationInfo,
  activeAddress,
  delegationInfo,
}: {
  token: FlpTokenInfo & { percent: number };
  isLoading: boolean;
  setDelegationInfo: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  activeAddress: string;
  delegationInfo: Record<string, number>;
}) {
  const theme = useTheme();
  const [logo, setLogo] = useState<string | null>(null);
  const arweaveLogo = useMemo(() => (theme.displayTheme === "dark" ? arLogoDark : arLogoLight), [theme]);
  const isAO = token.processId === AO_PROCESS_ID;
  const tokenDelegation = useMemo(() => delegationInfo[token.flpId] || 0, [delegationInfo, token.flpId]);

  useEffect(() => {
    const fetchLogo = async () => {
      if (!token.processId) return;
      if (token.Logo) {
        const logo = await getUserAvatar(token.Logo);
        setLogo(logo);
      } else {
        setLogo(arweaveLogo);
      }
    };
    fetchLogo();
  }, [token.processId, token.Logo, arweaveLogo]);

  return (
    <TokenWrapper key={token.processId}>
      <Logo src={logo} width={40} height={40} />

      <Flex direction="row" align="center" justify="space-between" gap={24} width="100%">
        <Flex direction="column" gap={4}>
          <Text
            size="md"
            weight="semibold"
            noMargin
            style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "140px" }}>
            {token.Name}
          </Text>
          <Text variant="secondary" weight="medium" size="xs" noMargin>
            ${token.Ticker}
          </Text>
        </Flex>
        <Flex direction="row" align="center" justify="center" gap={8}>
          {!isAO && (
            <RoundedButton
              icon={
                tokenDelegation <= 5 ? (
                  <Tooltip
                    position="left"
                    content={
                      <Text size="xs" weight="medium" style={{ maxWidth: "190px", textAlign: "center" }} noMargin>
                        {browser.i18n.getMessage("remove_delegation_tooltip")}
                      </Text>
                    }>
                    <Trash02 style={{ height: "12px", width: "12px" }} color="#EE5A4F" />
                  </Tooltip>
                ) : (
                  <MinusIcon height={20} width={20} />
                )
              }
              backgroundColor={tokenDelegation <= 5 ? "#492C2C" : "rgba(102, 102, 102, 0.5)"}
              onClick={() => {
                setDelegationInfo((prev) => {
                  const aoDelegation = prev[activeAddress] || 0;
                  const tokenDelegation = prev[token.flpId] || 0;
                  if (tokenDelegation <= 5) {
                    const { [token.flpId]: _, ...rest } = prev;
                    return {
                      ...rest,
                      [activeAddress]: aoDelegation + 5,
                    };
                  } else {
                    return {
                      ...prev,
                      [activeAddress]: aoDelegation + 5,
                      [token.flpId]: tokenDelegation - 5,
                    };
                  }
                });
              }}
            />
          )}
          <Text weight="semibold" style={{ width: "40px", textAlign: "center" }} noMargin>
            {isLoading ? <Loading width={4} height={4} /> : `${tokenDelegation}%`}
          </Text>
          {isAO ? (
            <Tooltip
              position="left"
              content={
                <Text size="xs" weight="medium" style={{ maxWidth: "230px", textAlign: "center" }} noMargin>
                  {browser.i18n.getMessage("ao_delegation_tooltip")}
                </Text>
              }>
              <HelpCircle height={20} width={20} color={theme.secondaryText} cursor="pointer" />
            </Tooltip>
          ) : (
            <RoundedButton
              onClick={() => {
                setDelegationInfo((prev) => {
                  const aoDelegation = prev[activeAddress] || 0;
                  const tokenDelegation = prev[token.flpId] || 0;
                  if (aoDelegation >= 5) {
                    return {
                      ...prev,
                      [activeAddress]: aoDelegation - 5,
                      [token.flpId]: tokenDelegation + 5,
                    };
                  }

                  return prev;
                });
              }}
              icon={<PlusIcon height={20} width={20} />}
            />
          )}
        </Flex>
      </Flex>
    </TokenWrapper>
  );
}

const Wrapper = styled(Section)`
  height: calc(100vh - 80px);
  padding-top: 0px;
  padding-bottom: 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow-y: auto;
  gap: 16px;
  box-sizing: border-box;
`;

const TokenWrapper = styled.div`
  display: flex;
  padding: 12px;
  align-items: center;
  gap: 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.surfaceSecondary};
`;

const RoundedButton = styled(Button).attrs({
  height: "20px",
  width: "20px",
})<{ backgroundColor?: string }>`
  background: ${({ backgroundColor }) => backgroundColor || "rgba(102, 102, 102, 0.5)"};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  flex-grow: 0;
  min-width: 20px;
  min-height: 20px;
  padding: 0;

  svg {
    height: 16px;
    width: 16px;

    path {
      stroke-width: 2;
    }
  }
`;
