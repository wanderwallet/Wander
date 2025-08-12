import { Card, Text } from "@arconnect/components-rebrand";
import { PlusIcon } from "@iconicicons/react";
import { Star01 } from "@untitled-ui/icons-react";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import HeadV2 from "~components/popup/HeadV2";
import { useArNSRecordsForAddress } from "~lib/arns";
import { useNameServiceProfile } from "~lib/nameservice";
import { ExtensionStorage, useStorage } from "~utils/storage";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { useLocation } from "~wallets/router/router.utils";

const Content = styled.main`
  padding: 1.5rem;
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
  // const wallet = useActiveWallet();
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  const { data: arnsRecords, isFetching, isError } = useArNSRecordsForAddress({ address: activeAddress });

  const { data: profile, isFetching: isProfileFetching } = useNameServiceProfile(activeAddress);

  return (
    <Flex direction="column" height="100vh">
      <HeadV2 title="Manage ArNS" />

      <Content>
        {isError ? (
          <Text margin="1rem auto" width="100%" style={{ textAlign: "center" }}>
            Unable to load ArNS records
          </Text>
        ) : isFetching || isProfileFetching ? (
          <Text margin="1rem auto" width="100%" style={{ textAlign: "center" }}>
            Loading...
          </Text>
        ) : (
          <>
            {!!arnsRecords &&
              arnsRecords.map((arnsRecord) => (
                <ManageCard
                  style={{
                    padding: "0.5rem 0.75rem",
                  }}>
                  <Flex direction="row" gap="0.5rem" style={{ alignItems: "center" }}>
                    <StarToggle
                      selected={profile?.name === arnsRecord.name}
                      onClick={() => {
                        if (profile?.name !== arnsRecord.name) {
                          navigate(PopupPaths.ArNSConfirmSetPrimaryName, { params: { name: arnsRecord.name } });
                        }
                      }}
                    />
                    <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {arnsRecord.name}
                      </Text>
                      <Text
                        size="xs"
                        variant="secondary"
                        style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        arns://{arnsRecord.name}
                      </Text>
                    </Flex>
                    {arnsRecord.type === "lease" && (
                      <Flex direction="column" style={{ flexShrink: 0, marginLeft: "auto", alignItems: "flex-end" }}>
                        <Text size="sm">Leased</Text>
                        <Text size="xs" variant="secondary">
                          Until {formatDate(new Date(arnsRecord.endTimestamp))}
                        </Text>
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
              <Text>Buy another domain</Text>
            </Flex>
          </button>
        </ManageCard>
      </Content>
    </Flex>
  );
};

const ManageCard = styled(Card)`
  background: ${(props) => props.theme.surfaceSecondary};
  border-radius: 12px;
  padding: 0;
`;

const StarToggle = styled(Star01)<{ selected: boolean }>`
  ${(props) => (props.selected ? `fill: rgba(255, 227, 66, 1); color: rgba(255, 227, 66, 1);` : "cursor: pointer;")}
`;
