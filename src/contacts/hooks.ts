import { useState, useEffect } from "react";
import type { Contact, Contacts } from "~components/Recipient";
import { gql } from "~gateways/api";
import { findGateway } from "~gateways/wayfinder";
import { getUserAvatar } from "~lib/avatar";
import { multiSort } from "~utils/multi_sort";
import { ExtensionStorage } from "~utils/storage";
import { svgie } from "~utils/svgies";

export type Recipient = {
  address: string;
  timestamp?: number;
};

export const useContacts = (activeAddress: string) => {
  const [storedContacts, setContacts] = useState<Contacts>([]);
  const [lastRecipients, setLastRecipients] = useState<Recipient[]>([]);

  useEffect(() => {
    const getContacts = async () => {
      try {
        const storedContacts: Contacts = await ExtensionStorage.get("contacts");

        if (storedContacts) {
          const namedContacts = storedContacts.filter(
            (contact) => contact.name
          );
          const addressOnlyContacts = storedContacts.filter(
            (contact) => !contact.name
          );

          namedContacts.sort((a, b) => a.name.localeCompare(b.name));

          const sortedAddressOnlyContacts = multiSort(addressOnlyContacts);

          const sortedContacts = [
            ...namedContacts,
            ...sortedAddressOnlyContacts
          ];

          const contactsWithImages = await Promise.all(
            sortedContacts.map(enrichContact)
          );
          setContacts(contactsWithImages);
        }
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
      }
    };

    const getRecentAddresses = async () => {
      if (!activeAddress) return;
      const gateway = await findGateway({ graphql: true });

      // fetch last outgoing txs
      const { data } = await gql(
        `
          query($address: [String!]) {
            transactions(owners: $address, first: 100) {
              edges {
                node {
                  recipient
                  block { timestamp }
                }
              }
            }
          }
        `,
        { address: activeAddress },
        gateway
      );

      // filter addresses
      const recipients = data.transactions.edges
        .filter((tx) => tx.node.recipient !== "")
        .map((tx) => ({
          address: tx.node.recipient,
          timestamp: tx.node.block?.timestamp
        }));

      const uniqueRecipients = recipients.filter(
        (recipient, index, self) =>
          index === self.findIndex((t) => t.address === recipient.address)
      );

      setLastRecipients(uniqueRecipients);
    };
    getContacts();
    getRecentAddresses();
  }, [activeAddress]);

  return { lastRecipients, storedContacts };
};

export const useContact = (contactAddress?: string): Contact => {
  const [contact, setContact] = useState<Contact | null>(null);
  useEffect(() => {
    const fetchContact = async () => {
      if (!contactAddress) {
        setContact(null);
        return;
      }
      // Fetch stored contacts
      const storedContacts: Contacts = await ExtensionStorage.get("contacts");

      let foundContact = storedContacts?.find(
        (c) => c.address === contactAddress
      );
      if (foundContact) {
        foundContact = await enrichContact(foundContact);
      }
      setContact(foundContact || null);
    };

    if (contactAddress) {
      fetchContact();
    }
  }, [contactAddress]);
  return contact;
};

export const enrichContact = async (contact: Contact) => {
  let updatedContact = { ...contact };

  if (contact.avatarId) {
    try {
      const profileImage = await getUserAvatar(contact.avatarId);
      updatedContact = {
        ...updatedContact,
        profileIcon: profileImage
      };
    } catch (error) {
      console.error(
        `Failed to fetch profile image for avatarId ${contact.avatarId}:`,
        error
      );
    }
  } else {
    const svgieAvatar = svgie(contact.address, { asDataURI: true });
    if (svgieAvatar) {
      updatedContact = {
        ...updatedContact,
        profileIcon: svgieAvatar
      };
    }
  }

  return updatedContact;
};
