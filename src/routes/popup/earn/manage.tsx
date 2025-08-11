import styled, { useTheme } from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Section, Button, Text, Tooltip, Loading, useToasts } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { ArrowUpRight, HelpCircle, InfoCircle, Plus, Trash02 } from "@untitled-ui/icons-react";
import { useAOYieldDelegations, useDelegationInfo, useFairLaunchTokens } from "~utils/fair_launch/fair_launch.hooks";
import { AO_PROCESS_ID, defaultTokens } from "~tokens/aoTokens/ao";
import { PI_FLP_ID } from "~utils/fair_launch/fair_launch.constants";
import { useActiveAddress, useActiveWallet } from "~wallets/hooks";
import { Flex } from "~components/common/Flex";
import type { FlpTokenInfo } from "~utils/fair_launch/fair_launch.types";
import { AddTokenPopup } from "~components/popup/earn/AddTokenPopup";
import { Link } from "~components/common/Link";
import { MinusIcon, PlusIcon } from "@iconicicons/react";
import { updateDelegationInfo } from "~utils/fair_launch/fair_launch.utils";
import { useLocation } from "~wallets/router/router.utils";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { UR } from "@ngraveio/bc-ur";
import { decodeSignature, type KeystoneInteraction, KeystoneSigner } from "~wallets/hardware/keystone";
import { useScanner } from "@arconnect/keystone-sdk";
import AnimatedQRScanner from "~components/hardware/AnimatedQRScanner";
import AnimatedQRPlayer from "~components/hardware/AnimatedQRPlayer";
import { Spacer } from "~components/embed";
import { SignType } from "@keystonehq/bc-ur-registry-arweave";
import Arweave from "arweave";
import { EventType, PageType, trackEvent, trackPage } from "~utils/analytics";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { TokenLogo } from "~components/popup/TokenLogo";

export function ManageEarningsView() {
  const theme = useTheme();
  const wallet = useActiveWallet();
  const { navigate } = useLocation();
  const [transactionUR, setTransactionUR] = useState<UR>();
  const [hardwareStatus, setHardwareStatus] = useState<"play" | "scan">();
  const [isSaving, setIsSaving] = useState(false);
  const [currentTransactionCount, setCurrentTransactionCount] = useState(0);
  const [transactionsCount, setTransactionsCount] = useState(0);
  const [updatedDelegationInfo, setUpdatedDelegationInfo] = useState<Record<string, number>>({});
  const [showAddTokenPopup, setShowAddTokenPopup] = useState(false);
  const { setToast } = useToasts();
  const activeAddress = useActiveAddress();
  const previousAddressRef = useRef<string>();
  const { data: delegationInfo = {}, isLoading: isLoadingDelegationInfo } = useDelegationInfo();
  const { data: flpTokens = [], isLoading: isLoadingFlpTokens } = useFairLaunchTokens();
  const { hasNoAOYieldDelegations, hasAOYieldDelegations } = useAOYieldDelegations();

  const keystoneInteraction = useMemo(() => {
    const keystoneInteraction: KeystoneInteraction = {
      display(data) {
        setCurrentTransactionCount((prev) => prev + 1);
        setTransactionUR(data);
        setHardwareStatus("play");
        scanner.retry();
      },
    };
    return keystoneInteraction;
  }, []);

  const keystoneSigner = useMemo(() => {
    if (wallet?.type !== "hardware") return null;
    const keystoneSigner = new KeystoneSigner(
      Buffer.from(Arweave.utils.b64UrlToBuffer(wallet.publicKey)),
      wallet.xfp,
      SignType.DataItem,
      keystoneInteraction,
    );
    return keystoneSigner;
  }, [wallet, keystoneInteraction]);

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

      setTransactionsCount(Object.keys(changedDelegations).length);

      // If user was only earning the AO or PI yield, we need to show the allocation set screen
      const isBeforeAllAOorPIYield =
        (delegationInfo[activeAddress] || 0) === 100 || (delegationInfo[PI_FLP_ID] || 0) === 100;

      await updateDelegationInfo(changedDelegations, activeAddress, keystoneSigner);

      const isAfterAllAOorPIYield =
        (updatedDelegationInfo[activeAddress] || 0) === 100 || (updatedDelegationInfo[PI_FLP_ID] || 0) === 100;

      try {
        // track allocation update event
        const changedTokens = tokens.filter((t) => t.flpId in changedDelegations);
        const tokenIds = changedTokens.map((t) => t.processId);
        const flpIds = changedTokens.map((t) => t.flpId);

        trackEvent(EventType.ALLOCATION_UPDATE, {
          tokenNames: changedTokens.map((t) => t.Name).join(","),
          tokenProcessIds: tokenIds.join(","),
          tokenPercentages: flpIds.map((id) => `${changedDelegations[id]}%`).join(","),
        });
      } catch (error) {
        log(LOG_GROUP.EARN, "Failed to track allocation update event", error);
      }

      setToast({
        type: "success",
        content: browser.i18n.getMessage("delegation_info_saved"),
        duration: 2400,
      });

      if (isBeforeAllAOorPIYield && !isAfterAllAOorPIYield) {
        navigate(PopupPaths.AllocationSet);
      }
    } catch {
      setToast({
        type: "error",
        content: browser.i18n.getMessage("delegation_info_save_failed"),
        duration: 2400,
      });
    } finally {
      setIsSaving(false);
      setHardwareStatus(null);
      setCurrentTransactionCount(0);
      setTransactionUR(null);
    }
  }, [updatedDelegationInfo, delegationInfo, activeAddress, keystoneSigner, tokens]);

  const handleScannerResult = useCallback(
    async (res: UR) => {
      try {
        if (!res) return;

        if (wallet?.type !== "hardware") {
          throw new Error("Wallet switched while signing");
        }

        // decode signature
        const { signature } = await decodeSignature(res);

        keystoneSigner.submitSignature(signature);
      } catch (e) {
        console.log(e);
      }
    },
    [wallet, keystoneSigner],
  );

  // qr-tx scanner
  const scanner = useScanner(handleScannerResult);

  useEffect(() => {
    const hasAddressChanged = previousAddressRef.current !== activeAddress;
    const isFirstLoad = !Object.keys(updatedDelegationInfo).length;
    const hasDelegationInfo = Object.keys(delegationInfo).length > 0;

    if ((isFirstLoad || hasAddressChanged) && hasDelegationInfo) {
      setUpdatedDelegationInfo(delegationInfo);
      previousAddressRef.current = activeAddress;
    }
  }, [delegationInfo, activeAddress, updatedDelegationInfo]);

  useEffect(() => {
    trackPage(PageType.EARN_MANAGE);
  }, []);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("manage_earnings")} />

      <Wrapper>
        {(hardwareStatus === "play" && transactionUR) || hardwareStatus === "scan" ? (
          <Flex direction="column" gap={8}>
            <Text noMargin style={{ textAlign: "center" }}>
              {currentTransactionCount}/{transactionsCount}
            </Text>
            {hardwareStatus === "play" && transactionUR && (
              <Flex direction="column" align="center" justify="center" textAlign="center" gap={16}>
                <Text weight="medium" noMargin>
                  {browser.i18n.getMessage("sign_scan_qr")}
                </Text>
                <AnimatedQRPlayer data={transactionUR} />
              </Flex>
            )}
            {hardwareStatus === "scan" && (
              <Flex direction="column" align="center" justify="center" textAlign="center">
                <AnimatedQRScanner
                  {...scanner.bindings}
                  onError={(error) =>
                    setToast({
                      type: "error",
                      duration: 2300,
                      content: browser.i18n.getMessage(`keystone_${error}`),
                    })
                  }
                />
                <Spacer y={1} />
                <Text style={{ textAlign: "center" }} noMargin>
                  {browser.i18n.getMessage("keystone_scan_progress", `${scanner.progress.toFixed(0)}%`)}
                </Text>
              </Flex>
            )}
          </Flex>
        ) : (
          <Flex direction="column" gap={8} style={{ overflow: "auto" }}>
            {hasNoAOYieldDelegations && (
              <InfoWrapper>
                <InfoCircle style={{ flexShrink: 0, color: theme.secondaryText, height: 24, width: 24 }} />
                <Text size="xs" weight="medium" noMargin>
                  {browser.i18n.getMessage("start_allocating_ao_yield")}
                </Text>
              </InfoWrapper>
            )}
            {hasAOYieldDelegations && (
              <Flex direction="column" gap={8} style={{ paddingBottom: 8 }}>
                <Text variant="secondary" style={{ fontSize: 11 }} weight="medium" noMargin>
                  {browser.i18n.getMessage("note_earning_ao_tokens")}
                </Text>
                <Link
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: theme.displayTheme === "dark" ? "#9787FF" : "#6B57F9",
                    gap: 2,
                  }}
                  href="https://www.wander.app/blog/wndr-fair-launch">
                  {browser.i18n.getMessage("learn_more")} <ArrowUpRight style={{ width: 16, height: 16 }} />
                </Link>
              </Flex>
            )}
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
        )}
        <Flex direction="column" gap={8}>
          <Button
            fullWidth
            disabled={(!isDelegationInfoUpdated || isSaving) && !hardwareStatus}
            onClick={async () => {
              if (!isSaving) await saveDelegationInfo();
              else if (hardwareStatus === "play") {
                setHardwareStatus((val) => (val === "play" ? "scan" : "play"));
              }
            }}
            loading={isSaving && !hardwareStatus}>
            {hardwareStatus ? browser.i18n.getMessage("keystone_scan") : browser.i18n.getMessage("save")}
          </Button>
          <Flex align="center" justify="center" padding="8px 0px">
            <Link
              color={theme.displayTheme === "dark" ? "#9787FF" : "#6B57F9"}
              href="https://ao.arweave.net/#/delegate/">
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
  const isAO = token.processId === AO_PROCESS_ID;
  const tokenDelegation = useMemo(() => delegationInfo[token.flpId] || 0, [delegationInfo, token.flpId]);

  return (
    <TokenWrapper key={token.processId}>
      <TokenLogo token={token} style={{ flex: "1 0 auto" }} />

      <Flex direction="row" align="center" justify="space-between" gap={16} width="100%">
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
                  <MinusIcon height={20} width={20} style={{ color: theme.primaryText }} />
                )
              }
              backgroundColor={
                tokenDelegation <= 5
                  ? theme.displayTheme === "dark"
                    ? "#492C2C"
                    : "#FFE4D4"
                  : theme.displayTheme === "dark"
                    ? "rgba(102, 102, 102, 0.5)"
                    : "rgba(170, 170, 170, 0.5)"
              }
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
          <Flex justify="center" width={40}>
            <Text weight="semibold" noMargin>
              {isLoading ? <Loading width={4} height={4} /> : `${tokenDelegation}%`}
            </Text>
          </Flex>
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
              icon={<PlusIcon height={20} width={20} style={{ color: theme.primaryText }} />}
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
  background: ${({ backgroundColor, theme }) =>
    backgroundColor || (theme.displayTheme === "dark" ? "rgba(102, 102, 102, 0.5)" : "rgba(170, 170, 170, 0.5)")};
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

  &:hover,
  &:active {
    svg path {
      fill: #fff;
      stroke: #fff;
    }
  }
`;

const InfoWrapper = styled.div`
  display: flex;
  padding: 8px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.borderDefault};
  margin-bottom: 8px;
`;
