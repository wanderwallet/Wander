import styled from "styled-components";

export type Contact = {
  name: string;
  address: string;
  profileIcon: string;
  notes: string;
  ArNSAddress: string;
  avatarId: string;
};

export const generateProfileIcon = (name) => {
  if (name && name.length > 0) {
    return name[0].toUpperCase();
  }
  return "";
};

export type Contacts = Contact[];

export const ProfilePicture = styled.img<{ size?: string }>`
  width: ${(props) => (props.size ? props.size : "34px")};
  height: ${(props) => (props.size ? props.size : "34px")};
  border-radius: 50%;
  margin-right: 10px;
`;

export const AutoContactPic = styled.div<{ size?: string }>`
  width: ${(props) => (props.size ? props.size : "34px")};
  height: ${(props) => (props.size ? props.size : "34px")};
  display: flex;
  background-color: #ab9aff26;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  margin-right: 10px;
`;
