import { Card, Text } from "@arconnect/components-rebrand";
import { PlusIcon } from "@iconicicons/react";
import { LinkExternal02, Star01, RefreshCw01 } from "@untitled-ui/icons-react";
import styled, { keyframes, css } from "styled-components";

import { Flex } from "~components/common/Flex";
import HeadV2 from "~components/popup/HeadV2";
import { useArNSRecordsForAddress } from "~lib/arns";
import { useNameServiceProfile } from "~lib/nameservice";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { useLocation } from "~wallets/router/router.utils";
import { decodeDomainToASCII } from "./utils";
import browser from "webextension-polyfill";
import { useActiveAddress } from "~wallets/hooks";
import { useEffect } from "react";
import { trackPage, PageType } from "~utils/analytics";

const Content = styled.main`
  padding: 0 1.5rem 1.5rem 1.5rem;
  flex: 1;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const ArNSManageView = () => {
  const { navigate } = useLocation();
  const activeAddress = useActiveAddress();

  const { data: arnsRecords, isFetching, isError, refetch } = useArNSRecordsForAddress({ address: activeAddress });

  const { data: profile, isFetching: isProfileFetching } = useNameServiceProfile(activeAddress);

  useEffect(() => {
    trackPage(PageType.ARNS_MANAGE);
  }, []);

  return (
    <Flex direction="column" height="100vh">
      <HeadV2 title={browser.i18n.getMessage("manage_arns")} />

      <Content>
        {isError ? (
          <Text style={{ textAlign: "center", margin: ".5rem auto", width: "100%" }}>
            {browser.i18n.getMessage("unable_to_load_arns_records")}
          </Text>
        ) : !arnsRecords && (isFetching || isProfileFetching) ? (
          <Text style={{ textAlign: "center", margin: ".5rem auto", width: "100%" }}>
            {browser.i18n.getMessage("loading")}
          </Text>
        ) : (
          <>
            <Flex justify="space-between" align="center">
              <Text>{browser.i18n.getMessage("your_arns_names")}</Text>
              <SpinningRefreshIcon $isFetching={isFetching} onClick={() => refetch()} />
            </Flex>
            {!!arnsRecords &&
              arnsRecords.map((arnsRecord) => (
                <ManageCard
                  key={arnsRecord.name}
                  style={{
                    padding: "0.5rem 0.75rem",
                  }}>
                  <Flex direction="row" gap="0.5rem" style={{ alignItems: "center" }}>
                    <StarToggle
                      $selected={profile?.name === decodeDomainToASCII(arnsRecord.name)}
                      onClick={() => {
                        if (profile?.name !== decodeDomainToASCII(arnsRecord.name)) {
                          navigate(PopupPaths.ArNSConfirmSetPrimaryName, { params: { name: arnsRecord.name } });
                        }
                      }}
                    />
                    <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {decodeDomainToASCII(arnsRecord.name)}
                      </Text>
                      <Text
                        size="xs"
                        variant="secondary"
                        style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        arns://
                        {decodeDomainToASCII(arnsRecord.name)}
                      </Text>
                    </Flex>
                    {arnsRecord.type === "lease" && (
                      <Flex direction="column" style={{ flexShrink: 0, marginLeft: "auto", alignItems: "flex-end" }}>
                        <Text size="sm">{browser.i18n.getMessage("leased")}</Text>
                        <Text size="xs" variant="secondary">
                          Until {formatDate(new Date(arnsRecord.endTimestamp))}
                        </Text>
                      </Flex>
                    )}
                    {arnsRecord.type === "permabuy" && (
                      <Flex direction="column" style={{ flexShrink: 0, marginLeft: "auto", alignItems: "flex-end" }}>
                        <Text size="sm">{browser.i18n.getMessage("permanent")}</Text>
                      </Flex>
                    )}
                  </Flex>
                </ManageCard>
              ))}
          </>
        )}
        <ManageCard>
          <button onClick={() => navigate(PopupPaths.ArNSPurchaseStart)} style={{ cursor: "pointer", width: "100%" }}>
            <Flex direction="row" gap="0.5rem" padding="0.5rem">
              <PlusIcon width="24px" height="24px" />
              <Text>{browser.i18n.getMessage("buy_another_domain")}</Text>
            </Flex>
          </button>
        </ManageCard>
        <a
          href={`https://arns.app`}
          target="_blank"
          title="Advanced ArNS management"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", textAlign: "center", margin: "0 auto" }}>
          <Flex gap="0.25rem">
            <Text size="sm" style={{ color: "rgba(151, 135, 255, 1)" }}>
              {browser.i18n.getMessage("advanced_management")}
            </Text>
            <Text>
              <LinkExternal02 width=".75rem" height=".75rem" />
            </Text>
          </Flex>
        </a>
      </Content>
    </Flex>
  );
};

const ManageCard = styled(Card)`
  background: ${(props) => props.theme.surfaceSecondary};
  border-radius: 8px;
  padding: 0;
`;

const StarToggle = styled(Star01)<{ $selected: boolean }>`
  ${(props) => (props.$selected ? `fill: rgba(255, 227, 66, 1); color: rgba(255, 227, 66, 1);` : "cursor: pointer;")}
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SpinningRefreshIcon = styled(RefreshCw01)<{ $isFetching: boolean }>`
  cursor: pointer;
  color: rgb(var(--theme-primary));
  width: 1.25rem;
  height: 1.25rem;
  opacity: ${({ $isFetching }) => ($isFetching ? 0.5 : 1)};
  transition: opacity 0.2s ease;
  ${({ $isFetching }) =>
    $isFetching &&
    css`
      animation: ${spin} 1s linear infinite;
    `}
`;
