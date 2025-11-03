import { Button, Spacer, Text, useInput } from "@arconnect/components-rebrand";
import React, { useState, useEffect, useMemo } from "react";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { SettingsList } from "./list/BaseElement";
import ContactListItem from "./list/ContactListItem";
import { useRoute } from "wouter";
import browser from "webextension-polyfill";
import SearchInput from "./SearchInput";
import styled from "styled-components";
import { formatAddress } from "~utils/format";
import { multiSort } from "~utils/multi_sort";
import { enrichContact } from "~contacts/hooks";
import { EventType, trackEvent } from "~utils/analytics";
import type { Contacts } from "~components/Recipient";
import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";

export interface ContactsDashboardViewParams {
  contact?: string;
}

export interface ContactsDashboardViewProps extends CommonRouteProps<ContactsDashboardViewParams> {
  isQuickSetting?: boolean;
}

export function ContactsDashboardView({ isQuickSetting }: ContactsDashboardViewProps) {
  const { navigate } = useLocation();
  // TODO: Replace with useParams:
  const [matches, params] = useRoute<{ contact?: string }>("/contacts/:contact?");

  // contacts
  const [storedContacts, setStoredContacts] = useStorage(
    {
      key: "contacts",
      instance: ExtensionStorage,
    },
    [],
  );

  const [contacts, setContacts] = useState<SettingsContactData[]>([]);

  useEffect(() => {
    trackEvent(EventType.CONTACTS, {});
  }, []);

  useAsyncEffect(async () => {
    const storedContacts = await ExtensionStorage.get<Contacts>("contacts");

    if (!storedContacts) return;

    const namedContacts = storedContacts.filter((contact) => contact.name);
    const addressOnlyContacts = storedContacts.filter((contact) => !contact.name);

    namedContacts.sort((a, b) => {
      const nameComparison = a.name.localeCompare(b.name);
      if (nameComparison !== 0) {
        return nameComparison;
      }

      return multiSort([a, b])[0] === a ? -1 : 1;
    });

    const sortedAddressOnlyContacts = multiSort(addressOnlyContacts);

    const sortedContacts = [...namedContacts, ...sortedAddressOnlyContacts];

    const enrichedContacts = await Promise.all(sortedContacts.map(async (contact) => await enrichContact(contact)));

    setContacts(enrichedContacts);
  }, [storedContacts]);

  function groupContactsByFirstLetter(contacts) {
    return contacts.reduce((groups, contact) => {
      let firstLetter = contact.name ? contact.name[0].toUpperCase() : contact.address[0].toUpperCase();

      if (!firstLetter.match(/[A-Z]/)) {
        firstLetter = "0-9";
      }

      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(contact);
      return groups;
    }, {});
  }

  const groupedContacts = useMemo(() => groupContactsByFirstLetter(contacts), [contacts]);

  // active subsetting
  const activeContact = useMemo(() => (params?.contact ? decodeURIComponent(params.contact) : undefined), [params]);

  // Update the URL when a contact is clicked
  const handleContactClick = (contactAddress: string) => {
    navigate(`/${isQuickSetting ? "quick-settings/" : ""}contacts/${encodeURIComponent(contactAddress)}`);
  };

  const searchInput = useInput();

  // search filter function
  function filterSearchResults(contact: SettingsContactData) {
    const query = searchInput.state;

    if (query === "" || !query) {
      return true;
    }

    return (
      contact.name.toLowerCase().includes(query.toLowerCase()) ||
      contact.address.toLowerCase().includes(query.toLowerCase())
    );
  }

  const addContact = () => {
    trackEvent(EventType.ADD_CONTACT, { fromContactSettings: true });
    navigate(`/${isQuickSetting ? "quick-settings/" : ""}contacts/new`);
  };

  return (
    <Wrapper>
      <SearchWrapper small={isQuickSetting}>
        <SearchInput
          sizeVariant={isQuickSetting ? "small" : "normal"}
          placeholder={browser.i18n.getMessage("search_contacts")}
          {...searchInput.bindings}
          sticky
        />
        <AddContactButton onClick={addContact}>
          {browser.i18n.getMessage(isQuickSetting ? "new" : "add_contact")}
        </AddContactButton>
      </SearchWrapper>
      <Title>{browser.i18n.getMessage("your_contacts")}</Title>
      <Spacer y={0.5} />
      <SettingsList style={isQuickSetting ? { flex: 1, overflowY: "auto", minHeight: 0 } : {}}>
        {Object.entries(groupedContacts).map(([letter, contacts]) => {
          const filteredContacts = (contacts as SettingsContactData[]).filter(filterSearchResults);

          if (filteredContacts.length === 0) {
            return null;
          }

          return (
            <React.Fragment key={letter}>
              <LetterHeader>{letter}</LetterHeader>
              {filteredContacts.map((contact) => (
                <React.Fragment key={contact.address}>
                  {/* Check if contact has name */}
                  {contact.name && (
                    <ContactListItem
                      small={isQuickSetting}
                      name={contact.name}
                      address={formatAddress(contact.address, 8)}
                      profileIcon={contact.profileIcon}
                      active={activeContact === contact.address}
                      onClick={() => handleContactClick(contact.address)}
                      style={{ flexShrink: 0 }}
                    />
                  )}
                  {/* Address only contacts */}
                  {!contact.name && (
                    <ContactListItem
                      small={isQuickSetting}
                      name={formatAddress(contact.address, 4)}
                      address={formatAddress(contact.address, 8)}
                      profileIcon={contact.profileIcon}
                      active={activeContact === contact.address}
                      onClick={() => handleContactClick(contact.address)}
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        })}
        <Spacer y={0.5} />
      </SettingsList>
    </Wrapper>
  );
}

interface SettingsContactData {
  name?: string;
  address: string;
  profileIcon: string;
  arNSAdress?: string;
  notes?: string;
}

const Wrapper = styled.div`
  position: relative;
  height: calc(100vh - 78px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;

const LetterHeader = styled.div`
  font-size: 12px;
`;

const SearchWrapper = styled.div<{ small?: boolean }>`
  position: sticky;
  display: grid;
  gap: 8px;
  top: -32px;
  margin-top: -32px;
  padding: 32px 0 24px;
  z-index: 20;
  grid-template-columns: auto auto;
  ${(props) => !props.small && `background-color: ${props.theme.cardBackground}`}
`;

const AddContactButton = styled(Button)`
  width: 100%;
  height: 100%;
`;

const Title = styled(Text).attrs({ heading: true })`
  color: ${(props) => `rgb(${props.theme.primaryText})`};
  font-size: 1.25rem;
`;
