import { Modal, Text } from "@arconnect/components-rebrand";
import { useRef } from "react";
import { Content, ContentWrapper } from "~components/modals/Components";

interface Props {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  statusText: string;
}

const TransactionStatusModal = ({ isOpen, setOpen, statusText }: Props) => {
  const modalRef = useRef(null);

  return (
    <Modal root={document.getElementById("__plasmo")} open={isOpen} setOpen={() => {}}>
      <ContentWrapper style={{ position: "relative" }} ref={modalRef}>
        <Content>
          <Text size="sm" weight="semibold">
            {statusText}
          </Text>
        </Content>
      </ContentWrapper>
    </Modal>
  );
};
export default TransactionStatusModal;
