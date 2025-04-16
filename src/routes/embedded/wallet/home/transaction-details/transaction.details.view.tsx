import { Spacer } from "@arconnect/components-rebrand";
import Arweave from "arweave";
import BigNumber from "bignumber.js";
import { useMemo, useState } from "react";
import type { DecodedTag } from "~api/modules/sign/tags";
import {
  Card,
  Row,
  Text,
  Box,
  XClose,
  ChevronRight
} from "~components/embed/ui";
import { defaultGateway } from "~gateways/gateway";
import useSetting from "~settings/hook";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { humanizeTimestampTags } from "~utils/timestamp";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import { isSplitTransaction } from "~api/modules/sign/transaction_builder";
import { getTagValue } from "~tokens/aoTokens/ao";
import { formatAddress } from "~utils/format";
import prettyBytes from "pretty-bytes";

export function WalletTransactionDetailsEmbeddedView() {
  const { navigate } = useLocation();
  const { authRequest, rejectRequest } = useCurrentAuthRequest("sign");
  const { url = "", address, transaction } = authRequest;

  // quantity
  const quantity = useMemo(() => {
    if (!transaction?.quantity) {
      return BigNumber("0");
    }

    const arweave = new Arweave(defaultGateway);
    const ar = arweave.ar.winstonToAr(transaction.quantity);

    return BigNumber(ar);
  }, [transaction]);

  // currency setting
  const [currency] = useSetting<string>("currency");

  const [showTags, setShowTags] = useState(false);

  // transaction fee
  const fee = useMemo(() => {
    if (!transaction?.reward) {
      return "0";
    }

    const arweave = new Arweave(defaultGateway);

    return arweave.ar.winstonToAr(transaction.reward);
  }, [transaction]);

  // transaction size
  const size = useMemo(() => {
    if (!transaction || isSplitTransaction(transaction)) return 0;

    return transaction?.sizeInBytes ?? transaction?.data?.length ?? 0;
  }, [transaction]);

  // tags
  const tags = useMemo<DecodedTag[]>(() => {
    if (!transaction || isSplitTransaction(transaction)) return [];

    // @ts-expect-error
    const tags = transaction.get("tags") as Tag[];
    const decodedTags = tags.map((tag) => ({
      name: tag.get("name", { decode: true, string: true }),
      value: tag.get("value", { decode: true, string: true })
    }));

    return humanizeTimestampTags(decodedTags);
  }, [transaction]);

  const headerTitle = useMemo(() => {
    if (!tags.length) return browser.i18n.getMessage("titles_sign");

    const actionValue = getTagValue("Action", tags);
    const isAOTransaction = tags.some(
      (tag) => tag.name === "Data-Protocol" && tag.value === "ao"
    );

    if (isAOTransaction && actionValue) {
      return actionValue.replace(/-/g, " ");
    }

    return browser.i18n.getMessage("titles_sign");
  }, [tags]);

  const recipient = useMemo(() => {
    if (tags.length === 0) return transaction?.target || "";

    // AO Token
    const isAOTransferTx =
      tags.some((tag) => tag.name === "Data-Protocol" && tag.value === "ao") &&
      tags.some((tag) => tag.name === "Action" && tag.value === "Transfer");
    if (isAOTransferTx) {
      const recipientTag = tags.find((tag) => tag.name === "Recipient");
      if (recipientTag?.value) return recipientTag.value;
    }

    return transaction?.target || "";
  }, [tags]);

  const handleCancel = () => {
    postEmbeddedMessage({
      type: "embedded_close",
      data: null
    });
    navigate("/wallet");
    rejectRequest();
  };

  return (
    <Card
      size="auto"
      headerText="Transaction details"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      hasCloseButton={true}
      customIcon={<XClose fontSize={24} color={"#666666"} />}
      onCloseButtonClick={handleCancel}
      style={{ padding: "2rem" }}
    >
      <Box style={{ gap: "0.5rem" }} alignment="left">
        {transaction?.id && (
          <TransactionTag name="Transaction ID" value={transaction.id} />
        )}
        <TransactionTag name="From" value={formatAddress(address, 6)} />
        {recipient && (
          <TransactionTag name="To" value={formatAddress(recipient, 6)} />
        )}
        <TransactionTag name="Network Fee" value={`${fee} AR`} />
        <TransactionTag name="Size" value={prettyBytes(size)} />
        <Spacer y={0.1} />
        <Row
          alignment="center"
          justifyContent="start"
          style={{ gap: "0.3rem", cursor: "pointer" }}
          onClick={() => setShowTags((prev) => !prev)}
        >
          <Text variant="bodySm" style={{ color: "#666666" }}>
            Tags
          </Text>
          <div
            style={{
              display: "inline-flex",
              transition: "transform 0.2s ease",
              transform: showTags ? "rotate(90deg)" : "rotate(0deg)"
            }}
          >
            <ChevronRight fontSize={24} color={"#666666"} />
          </div>
          {showTags && (
            <Box style={{ gap: "0.5rem" }} alignment="left">
              {tags.map((tag) => (
                <TransactionTag
                  key={tag.name}
                  name={tag.name}
                  value={tag.value}
                />
              ))}
            </Box>
          )}
        </Row>
      </Box>

      <Box hasBorder alignment="left" style={{ margin: "1rem" }}>
        <Text variant="bodySm" style={{ color: "#666666" }}>
          Message
        </Text>
        <Text variant="bodySm" style={{ color: "#121212" }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
          varius enim in eros elementum tristique. Duis cursus, mi quis viverra
          ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.
        </Text>
      </Box>
    </Card>
  );
}

function TransactionTag({ name, value }: DecodedTag) {
  return (
    <Row isFullWidth justifyContent="between">
      <Text variant="bodySm" style={{ color: "#666666" }}>
        {name}
      </Text>
      <Text variant="bodySm" style={{ color: "#121212" }}>
        {value}
      </Text>
    </Row>
  );
}
