import { Modal } from "@arconnect/components-rebrand";
import { useRef } from "react";
import { ContentWrapper, Content } from "./Components";
import { QRCodeSVG } from "qrcode.react";
import styled from "styled-components";
import { XClose } from "@untitled-ui/icons-react";

interface Props {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  address: string;
}

const QRModal = ({ isOpen, setOpen, address }: Props) => {
  const modalRef = useRef(null);

  return (
    <Modal
      root={document.getElementById("__plasmo")}
      open={isOpen}
      setOpen={setOpen}
    >
      <ContentWrapper style={{ position: "relative" }} ref={modalRef}>
        <CloseButton>
          <XClose onClick={() => setOpen(false)} />
        </CloseButton>
        <Content>
          <QRCodeWrapper>
            <QRCodeSVG
              fgColor="#fff"
              bgColor="transparent"
              size={176}
              value={address ?? ""}
            />
          </QRCodeWrapper>
        </Content>
      </ContentWrapper>
    </Modal>
  );
};

const QRCodeWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => props.theme.primary};
  border-radius: 24px;
  padding: 16px;
  width: 176px;
  height: 176px;
`;

const CloseButton = styled.div`
  position: absolute;
  top: -16px;
  right: -16px;
  cursor: pointer;
`;

export default QRModal;
