import {
  Wrapper,
  Header,
  Footer,
  CenterText,
  PicWrapper,
  UploadIcon,
  AutoContactPic,
  ContactPic,
  InputWrapper,
  ContactInput,
  ContactNotes,
  SubTitle,
  Title
} from "./ContactSettings";
import {
  Button,
  Modal,
  Spacer,
  useModal,
  useToasts
} from "@arconnect/components-rebrand";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { findGateway } from "~gateways/wayfinder";
import { uploadUserAvatar, getUserAvatar } from "~lib/avatar";
// import { getAllArNSNames } from "~lib/arns";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { gql } from "~gateways/api";
import { useTheme } from "~utils/theme";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { RemoveButton } from "~routes/popup/settings/wallets/[address]";
// import { isAddressFormat } from "~utils/format";

export interface AddContactDashboardViewProps extends CommonRouteProps {
  isQuickSetting?: boolean;
}

export function AddContactDashboardView({
  isQuickSetting
}: AddContactDashboardViewProps) {
  const { navigate } = useLocation();
  const { address } = useSearchParams<{ address: string }>();

  // contacts
  const [storedContacts, setStoredContacts] = useStorage(
    {
      key: "contacts",
      instance: ExtensionStorage
    },
    []
  );

  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const theme = useTheme();
  const { setToast } = useToasts();

  const [contact, setContact] = useState({
    name: "",
    address: "",
    profileIcon: "",
    notes: "",
    ArNSAddress: "",
    avatarId: ""
  });

  useEffect(() => {
    if (address) {
      setContact({ ...contact, address: address });
    }
  }, []);

  // const [loading, setLoading] = useState(false);
  // const [arnsResults, setArnsResults] = useState([]);
  const [lastRecipients, setLastRecipients] = useState<string[]>([]);

  const generateProfileIcon = (name, address) => {
    if (name && name.length > 0) {
      return name[0].toUpperCase();
    } else if (address && address.length > 0) {
      return address[0].toUpperCase();
    }
    return "";
  };

  const handleAvatarUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      try {
        const avatarTxId = await uploadUserAvatar(selectedFile);
        setToast({
          type: "success",
          content: browser.i18n.getMessage("uploaded_avatar"),
          duration: 5000,
          action: {
            name: browser.i18n.getMessage("copyId"),
            task: () => copy(avatarTxId)
          }
        });
        setContact({
          ...contact,
          avatarId: avatarTxId
        });
      } catch (error) {
        setToast({
          type: "error",
          content: `File size too large. ${error}`,
          duration: 5000
        });
        console.error("Error uploading avatar:", error);
      }
    }
  };

  useEffect(() => {
    if (contact.avatarId) {
      getUserAvatar(contact.avatarId)
        .then((imageUrl) => {
          console.log("fetched avatar:", imageUrl);
          setContact({
            ...contact,
            profileIcon: imageUrl
          });
        })
        .catch((error) => {
          console.error("Error fetching avatar:", error);
        });
    }
  }, [contact.avatarId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContact({
      ...contact,
      [name]: value
    });
  };

  // TODO: Uncomment when getAllArNSNames is optimized
  // async function fetchArnsAddresses(ownerAddress) {
  //   try {
  //     setLoading(true);
  //     const arnsNames = await getAllArNSNames(ownerAddress);
  //     setArnsResults(arnsNames || []);
  //   } catch (error) {
  //     console.error("Error fetching ArNS addresses:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  useEffect(() => {
    // if (contact.address && isAddressFormat(contact.address)) {
    //   fetchArnsAddresses(contact.address);
    // }

    (async () => {
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
        .map((tx) => tx.node.recipient);

      console.log(recipients);
      setLastRecipients([...new Set(recipients)]);
    })();
  }, [contact.address, activeAddress]);

  const saveNewContact = async () => {
    // check if the contact address already exists
    const addressUsed = storedContacts.some(
      (existingContact) => existingContact.address === contact.address
    );

    if (addressUsed) {
      setToast({
        type: "error",
        content: browser.i18n.getMessage("address_in_use"),
        duration: 3000
      });
      return;
    }

    const newContact = {
      name: contact.name,
      address: contact.address,
      profileIcon: contact.profileIcon,
      notes: contact.notes,
      ArNSAddress: contact.ArNSAddress,
      avatarId: contact.avatarId
    };

    try {
      // add new contact to contacts array
      const updatedContacts = [newContact, ...storedContacts];
      await ExtensionStorage.set("contacts", updatedContacts);
      setContact({
        name: "",
        address: "",
        profileIcon: "",
        notes: "",
        ArNSAddress: "",
        avatarId: ""
      });

      navigate(
        `/${isQuickSetting ? "quick-settings/" : ""}contacts/${contact.address}`
      );
    } catch (error) {
      console.error("Error updating contacts:", error);
    }
  };

  const removeContactModal = useModal();

  // update this to just re-route to contacts and leave this new contact behind
  const confirmRemoveContact = async () => {
    setContact({
      name: "",
      address: "",
      profileIcon: "",
      notes: "",
      ArNSAddress: "",
      avatarId: ""
    });

    removeContactModal.setOpen(false);
    navigate(`/${isQuickSetting ? "quick-settings/" : ""}contacts`);
  };

  const areFieldsEmpty = () => {
    return !contact.address;
  };

  return (
    <Wrapper>
      <div>
        {!isQuickSetting && (
          <div>
            <Spacer y={0.45} />
            <Header>
              <Title>{browser.i18n.getMessage("add_new_contact")}</Title>
            </Header>
          </div>
        )}
        <SubTitle color="primary">
          {browser.i18n.getMessage("contact_avatar")}
        </SubTitle>
        <PicWrapper>
          {contact.avatarId && contact.profileIcon && (
            <ContactPic small={isQuickSetting} src={contact.profileIcon} />
          )}
          {!contact.avatarId && !contact.profileIcon && (
            <AutoContactPic small={isQuickSetting}>
              {generateProfileIcon(contact.name, contact.address)}
            </AutoContactPic>
          )}
          <label htmlFor="avatarUpload" style={{ cursor: "pointer" }}>
            <UploadIcon />
          </label>
          <input
            id="avatarUpload"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarUpload}
          />
        </PicWrapper>
        <SubTitle color="primary">{browser.i18n.getMessage("name")}*</SubTitle>
        <InputWrapper>
          <ContactInput
            fullWidth
            style={{ paddingLeft: "0px" }}
            small={isQuickSetting}
            name="name"
            placeholder={browser.i18n.getMessage("first_last_name")}
            value={contact.name}
            onChange={handleInputChange}
          />
        </InputWrapper>
        <SubTitle color="primary">
          {browser.i18n.getMessage("arweave_account_address")}*
        </SubTitle>
        <InputWrapper>
          <AddressInput
            style={{ paddingLeft: "0px" }}
            type="text"
            list="addressOptions"
            fullWidth
            small={isQuickSetting}
            name="address"
            placeholder={
              contact.address
                ? contact.address
                : browser.i18n.getMessage("account_address")
            }
            value={contact.address}
            onChange={handleInputChange}
          />
          <datalist id="addressOptions">
            {lastRecipients.map((recipient, i) => (
              <option key={i} value={recipient}>
                {recipient}
              </option>
            ))}
          </datalist>
        </InputWrapper>
        {/* <SubTitle color="primary">
          {browser.i18n.getMessage("ArNS_address")}
        </SubTitle>
        <InputWrapper>
          <SelectInput
            fullWidth
            small={isQuickSetting}
            name="ArNSAddress"
            value={contact.ArNSAddress}
            onChange={(e) =>
              setContact({ ...contact, ArNSAddress: e.target.value })
            }
          >
            <option value="">
              {loading
                ? browser.i18n.getMessage("searching_ArNS_addresses")
                : arnsResults.length === 0
                ? browser.i18n.getMessage("no_ArNS_address_found")
                : browser.i18n.getMessage("select_ArNS_address")}
            </option>
            {arnsResults.map((arnsName) => (
              <option key={arnsName} value={arnsName}>
                {browser.i18n.getMessage("arweave_url") + arnsName}
              </option>
            ))}
          </SelectInput>
        </InputWrapper> */}
        <SubTitle color="primary">{browser.i18n.getMessage("notes")}</SubTitle>
        <NewContactNotes
          small={isQuickSetting}
          placeholder={browser.i18n.getMessage("type_message_here")}
          value={contact.notes || ""}
          onChange={(e) => setContact({ ...contact, notes: e.target.value })}
        />
      </div>
      <>
        <Footer>
          <Button
            fullWidth
            onClick={saveNewContact}
            disabled={areFieldsEmpty()}
          >
            {browser.i18n.getMessage(
              isQuickSetting ? "save_contact" : "save_new_contact"
            )}
          </Button>
          <RemoveButton
            fullWidth
            onClick={() => removeContactModal.setOpen(true)}
          >
            {browser.i18n.getMessage("remove_contact")}
          </RemoveButton>
        </Footer>
        <Modal
          {...removeContactModal.bindings}
          root={document.getElementById("__plasmo")}
          actions={
            <>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => removeContactModal.setOpen(false)}
              >
                {browser.i18n.getMessage("no")}
              </Button>
              <Button fullWidth onClick={confirmRemoveContact}>
                {browser.i18n.getMessage("yes")}
              </Button>
            </>
          }
        >
          <CenterText size="xl" weight="semibold">
            {browser.i18n.getMessage("remove_contact")}
          </CenterText>
          <Spacer y={0.75} />
          <CenterText noMargin>
            {browser.i18n.getMessage("remove_contact_question")}
          </CenterText>
          <Spacer y={1} />
        </Modal>
      </>
    </Wrapper>
  );
}

const AddressInput = styled(ContactInput)`
  ::-webkit-calendar-picker-indicator {
    display:none !important;
`;

const NewContactNotes = styled(ContactNotes)<{ small?: boolean }>`
  height: ${(props) => (props.small ? "130px;" : "235px;")};
`;
