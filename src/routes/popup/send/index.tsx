import { PageType, trackPage } from "~utils/analytics";
import { useState, useEffect, useMemo, useCallback } from "react";
import styled from "styled-components";
import {
  Button,
  Input,
  Section,
  useInput,
  Text,
  ListItem,
  useToasts
} from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { type Token as TokenInterface } from "~tokens/token";
import HeadV2 from "~components/popup/HeadV2";
import {
  generateProfileIcon,
  type Contact,
  type Contacts
} from "~components/Recipient";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { Flex } from "~components/common/Flex";
import Tabs from "~components/Tabs";
import { useContacts, type Recipient } from "~contacts/hooks";
import { formatAddress, isAddressFormat } from "~utils/format";
import { User01 } from "@untitled-ui/icons-react";
import {
  calculateDaysSinceTimestamp,
  humanizeTimestampForRecipient
} from "~utils/timestamp";
import { isANS, getAnsProfileByLabel } from "~lib/ans";
import { searchArNSName } from "~lib/arns";
import SliderMenu from "~components/SliderMenu";
import { useLocation } from "~wallets/router/router.utils";
import { ExtensionStorage, TempTransactionStorage } from "~utils/storage";
import type { TokenInfo } from "~tokens/aoTokens/ao";
import { useStorage } from "@plasmohq/storage/hook";

// default size for the qty text
export const arPlaceholder: TokenInterface = {
  id: "AR",
  name: "Arweave",
  ticker: "AR",
  type: "asset",
  balance: "0",
  decimals: 12
};

export type RecipientType = {
  contact?: Contact;
  address: string;
  timestamp?: number;
};

export interface TransactionData {
  networkFee: string;
  estimatedFiat: string;
  qty: string;
  token: TokenInfo;
  estimatedNetworkFee: string;
  recipient: RecipientType;
  qtyMode: string;
  message?: string;
  isAo?: boolean;
}

export interface SendViewParams {
  id?: string;
}

export type SendViewProps = CommonRouteProps<SendViewParams>;

interface OnClickRecipient {
  address: string;
  contact?: Contact;
  timestamp?: number;
}

const ContactsTab = ({
  filteredAndGroupedContacts,
  hasContacts,
  onClick,
  activeRecipient
}: {
  filteredAndGroupedContacts: Record<string, Contacts>;
  hasContacts: boolean;
  onClick?: (recipient: OnClickRecipient) => void;
  activeRecipient: string;
}) => {
  return (
    <ContactsSection>
      {hasContacts ? (
        <Flex direction="column" gap={16}>
          {Object.keys(filteredAndGroupedContacts).map((letter) => (
            <ContactList key={letter}>
              <ContactAddress>{letter}</ContactAddress>

              {filteredAndGroupedContacts[letter].map((contact) => (
                <ListItem
                  title={contact?.name}
                  subtitle={formatAddress(contact.address, 4)}
                  img={
                    contact.profileIcon
                      ? contact.profileIcon
                      : generateProfileIcon(contact?.name || contact.address)
                  }
                  squircleSize={40}
                  height={56}
                  key={contact.address}
                  onClick={() => onClick({ contact, address: contact.address })}
                  active={activeRecipient === contact.address}
                />
              ))}
            </ContactList>
          ))}
        </Flex>
      ) : (
        <Text noMargin>{browser.i18n.getMessage("no_contacts")}</Text>
      )}
    </ContactsSection>
  );
};

const RecipientsTab = ({
  possibleTargets,
  contacts,
  onClick,
  activeRecipient
}: {
  possibleTargets: Recipient[];
  contacts: Contacts;
  onClick?: (recipient: OnClickRecipient) => void;
  activeRecipient: string;
}) => {
  const recipients = useMemo(() => {
    return possibleTargets.map((target) => ({
      address: target.address,
      contact: contacts.find((contact) => contact.address === target.address),
      timestamp: target.timestamp
    }));
  }, [contacts, possibleTargets]);

  return (
    <AddressesList>
      {recipients.map((recipient) => (
        <ListItem
          title={formatAddress(recipient.address, 4)}
          subtitle={
            recipient?.timestamp &&
            humanizeTimestampForRecipient(recipient.timestamp)
          }
          img={
            recipient?.contact?.profileIcon && recipient?.contact?.profileIcon
          }
          icon={!recipient?.contact && <User01 height={24} width={24} />}
          squircleSize={40}
          height={56}
          key={recipient.address}
          onClick={() =>
            onClick({
              address: recipient.address,
              timestamp: recipient.timestamp,
              contact: recipient.contact
            })
          }
          active={activeRecipient === recipient.address}
        />
      ))}
    </AddressesList>
  );
};

export function SendView({ params: { id } }: SendViewProps) {
  const { navigate } = useLocation();
  const addressInput = useInput();
  const { setToast } = useToasts();

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const { lastRecipients, storedContacts } = useContacts(activeAddress);

  const [recipient, setRecipient] = useState<RecipientType>({ address: "" });
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [isManualAddress, setIsManualAddress] = useState<boolean>(true);

  const possibleTargets = useMemo(() => {
    const query = addressInput.state;

    if (!query || query === "" || !isManualAddress) {
      return lastRecipients;
    }

    if (isAddressFormat(query)) {
      return [{ address: addressInput.state }];
    }

    return lastRecipients.filter(({ address }) =>
      address.toLowerCase().includes(query.toLowerCase())
    );
  }, [lastRecipients, addressInput, isManualAddress]);

  const filteredAndGroupedContacts = useMemo(() => {
    const query = addressInput.state ? addressInput.state.toLowerCase() : "";

    const filteredContacts = isManualAddress
      ? storedContacts.filter(
          (contact) =>
            contact?.name.toLowerCase().includes(query) ||
            contact.address.toLowerCase().includes(query)
        )
      : storedContacts;

    return filteredContacts.reduce((groups, contact) => {
      let letter = contact.name
        ? contact?.name[0].toUpperCase()
        : contact.address[0].toUpperCase();

      if (!letter.match(/[A-Z]/)) {
        letter = "0-9";
      }

      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(contact);
      return groups;
    }, {} as Record<string, Contacts>);
  }, [storedContacts, addressInput.state, isManualAddress]);

  const hasContacts = useMemo(
    () => Object.keys(filteredAndGroupedContacts).length > 0,
    [filteredAndGroupedContacts]
  );

  const handleTabOnClick = useCallback(
    (recipient: OnClickRecipient) => {
      setRecipient(recipient);
      setIsManualAddress(false);
      addressInput.setState(recipient.address);
    },
    [recipient]
  );

  const tabs = useMemo(
    () => [
      {
        id: 0,
        name: "contacts",
        component: () => (
          <ContactsTab
            filteredAndGroupedContacts={filteredAndGroupedContacts}
            hasContacts={hasContacts}
            onClick={handleTabOnClick}
            activeRecipient={recipient.address}
          />
        )
      },
      {
        id: 1,
        name: "recents",
        component: () => (
          <RecipientsTab
            possibleTargets={possibleTargets}
            onClick={handleTabOnClick}
            contacts={storedContacts}
            activeRecipient={recipient.address}
          />
        )
      }
    ],
    [
      filteredAndGroupedContacts,
      possibleTargets,
      hasContacts,
      recipient.address
    ]
  );

  const submit = async () => {
    try {
      setLoading(true);
      const input = addressInput.state?.trim() || recipient?.address || "";
      let recipientAddress = "";
      if (isAddressFormat(input)) {
        if (input === activeAddress) {
          setToast({
            type: "error",
            content: browser.i18n.getMessage("cannot_send_to_self"),
            duration: 2400
          });
          return;
        }
        recipientAddress = input;
        setRecipient({ address: input });
      } else if (isANS(input)) {
        const result = await getAnsProfileByLabel(input.slice(0, -3));
        if (!result) {
          setToast({
            type: "error",
            content: browser.i18n.getMessage("incorrect_address"),
            duration: 2400
          });
        } else {
          recipientAddress = result.user;
          setRecipient({ address: result.user });
        }
      } else if (input.startsWith("ar://")) {
        const result = await searchArNSName(input.slice(5));
        if (result.success) {
          recipientAddress = result.record.owner;
          setRecipient({ address: result.record.owner });
        }
      }
      if (recipientAddress) {
        await ExtensionStorage.set("last_send_qty", "");
        await ExtensionStorage.set("last_send_token", id ?? "AR");
        await TempTransactionStorage.set("last_send_note", "");
        navigate(`/send/amount/${recipientAddress}/${id ?? "AR"}`);
      } else {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("check_address"),
          duration: 2400
        });
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isManualAddress && recipient?.address) {
        setRecipient({ address: "" });
      }
      setIsManualAddress(true);
      addressInput.setState(e.target.value);
    },
    [isManualAddress, recipient?.address]
  );

  // Segment
  useEffect(() => {
    trackPage(PageType.SEND);
  }, []);

  useEffect(() => {
    if (storedContacts.length > 0) {
      setActiveTab(0);
    } else {
      setActiveTab(1);
    }
  }, [storedContacts.length]);

  useEffect(() => {
    if (recipient?.timestamp) {
      const days = calculateDaysSinceTimestamp(recipient.timestamp);
      setOpen(days > 30);
    }
  }, [recipient]);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("send_to")} />

      <Wrapper>
        <Flex direction="column" gap={24}>
          <Flex justify="space-between" gap={8}>
            <Input
              fullWidth
              sizeVariant="small"
              {...addressInput.bindings}
              onChange={handleInputChange}
              placeholder={browser.i18n.getMessage("address_or_arns_name")}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                submit();
              }}
            />
            <Button
              style={{ padding: "12px 24px", width: "max-content", height: 42 }}
              disabled={loading}
              loading={loading}
              onClick={submit}
            >
              {browser.i18n.getMessage("next")}
            </Button>
          </Flex>
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            containerStyle={{ paddingBottom: 24 }}
          />
        </Flex>
        <SliderMenu
          hasHeader={false}
          isOpen={open}
          onClose={() => setOpen(false)}
          paddingVertical={32}
        >
          <Section
            showPaddingHorizontal={false}
            showPaddingVertical={false}
            style={{
              alignItems: "center",
              gap: 24,
              height: "60vh",
              justifyContent: "space-between"
            }}
          >
            <Flex direction="column" gap={24} width="100%">
              <Flex direction="column" gap={12}>
                <Text weight="bold" style={{ fontSize: 22 }} noMargin>
                  {browser.i18n.getMessage("verify_full_address")}
                </Text>
                <Text variant="secondary" weight="medium" noMargin>
                  {browser.i18n.getMessage("verify_full_address_description")}
                </Text>
              </Flex>
              <AddressBox>
                <Text weight="medium" lineHeight={1.3} noMargin>
                  {recipient.address}
                </Text>
              </AddressBox>
            </Flex>
            <Flex direction="column" gap={12} width="100%">
              <Button
                fullWidth
                onClick={() => {
                  submit();
                  setOpen(false);
                }}
              >
                {browser.i18n.getMessage("confirm")}
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                {browser.i18n.getMessage("cancel")}
              </Button>
            </Flex>
          </Section>
        </SliderMenu>
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section)`
  height: calc(100vh - 100px);
  padding-top: 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
`;

// Make this dynamic
export const SendButton = styled(Button)<{ alternate?: boolean }>`
  background-color: ${(props) => props.alternate && "rgb(171, 154, 255, 0.15)"};
  border: 1px solid rgba(171, 154, 255, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.alternate ? "space-between" : "center")};
  width: 100%;
  color: ${(props) => props.alternate && "#b9b9b9"};
  padding: 10px;
  font-weight: 400;

  &:hover:not(:active):not(:disabled) {
    box-shadow: 0 0 0 0.075rem rgba(${(props) => props.theme.theme}, 0.5);
    background-color: none;
  }
`;

export const Degraded = styled.div`
  background: ${(props) => props.theme.backgroundSecondary};
  display: flex;
  margin: 0 0.9375rem;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme.fail};
  position: relative;
  z-index: 11;
  border-radius: 0.625rem;

  h4 {
    font-weight: 500;
    font-size: 14px;
    margin: 0;
    padding: 0;
    font-size: inherit;
  }

  span {
    color: ${(props) => props.theme.secondaryTextv2};
    font-size: 12px;
  }
`;

export const WarningWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ContactAddress = styled(Text).attrs({
  size: "sm",
  variant: "secondary",
  weight: "medium",
  noMargin: true
})``;

const ContactsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 4px;
  justify-content: space-between;
`;

const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: space-between;
`;

const AddressesList = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
  gap: 0.5rem;
`;

const AddressBox = styled.div`
  padding: 1rem;
  border-radius: 8px;
  background: ${(props) => props.theme.surfaceTertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  text-wrap: wrap;
  word-break: break-word;
  overflow-wrap: break-word;
`;
