import { InputWithBtn, InputWrapper } from "~components/arlocal/InputWrapper";
import { RefreshButton } from "~components/IconButton";
import { useEffect, useMemo, useState } from "react";
import { urlToGateway } from "~gateways/utils";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { RefreshIcon } from "@iconicicons/react";
import {
  Button,
  Input,
  Spacer,
  useInput,
  Text,
  useToasts
} from "@arconnect/components-rebrand";
import {
  CardBody,
  ConnectionStatus,
  ConnectionText,
  Title,
  Wrapper
} from "./devtools";
import { ArLocalTransaction } from "~components/arlocal/Transaction";
import NoWallets from "~components/devtools/NoWallets";
import Tutorial from "~components/arlocal/Tutorial";
import Mint from "~components/arlocal/Mint";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import axios from "axios";
import { WanderThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { useRemoveCover } from "~wallets/setup/non/non-wallet-setup.hook";
import { useWallets } from "~utils/wallets/wallets.hooks";
import { WalletsProvider } from "~utils/wallets/wallets.provider";

function ArLocal() {
  useRemoveCover();

  // testnet data
  const testnetInput = useInput();
  const [lastUsedTestnet, setLastUsedTestnet] = useStorage<string>(
    {
      key: "last_used_testnet",
      instance: ExtensionStorage
    },
    (val) => val || "http://localhost:1984"
  );

  useEffect(() => {
    if (lastUsedTestnet === testnetInput.state) {
      return;
    }

    testnetInput.setState(lastUsedTestnet);
  }, [lastUsedTestnet]);

  // fetch testnet status
  const [online, setOnline] = useState(false);
  const [loadingTestnet, setLoadingTestnet] = useState(false);

  // load testnet for the first time
  const [loadedTestnet, setLoadedTestnet] = useState(false);

  useEffect(() => {
    (async () => {
      if (!lastUsedTestnet || loadedTestnet) return;

      await loadTestnet(lastUsedTestnet);
      setLoadedTestnet(true);
    })();
  }, [lastUsedTestnet]);

  // try to load in the testnet
  async function loadTestnet(url?: string) {
    const testnetUrl = url || testnetInput.state;

    if (!testnetUrl || testnetUrl === "") {
      return testnetInput.setStatus("error");
    }

    testnetInput.setStatus("default");
    setLoadingTestnet(true);
    await setLastUsedTestnet(testnetUrl);

    try {
      const { data, status, statusText } = await axios.get<{
        network: string;
      }>(testnetUrl);

      // check status
      if (status !== 200) {
        throw new Error(statusText);
      }

      // check if testnet
      if (!data.network.includes("arlocal")) {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("gatewayNotTestnet"),
          duration: 3000
        });

        throw new Error(
          `Gateway not testnet. Gateway network type: ${data.network}`
        );
      }

      setOnline(true);
    } catch (e) {
      console.log("Failed to load gateway", e);
      setOnline(false);
    }

    setTimeout(() => setLoadingTestnet(false), 400);
  }

  // toasts
  const { setToast } = useToasts();

  // arweave client
  const arweave = useMemo(() => {
    // construct client
    const arweave = new Arweave(urlToGateway(lastUsedTestnet));

    return arweave;
  }, [lastUsedTestnet]);

  // mine
  const [mining, setMining] = useState(false);

  async function mine() {
    setMining(true);

    try {
      // mine testnet
      const { status, statusText } = await arweave.api.get("mine");

      if (status !== 200) {
        throw new Error(statusText);
      }

      setToast({
        type: "success",
        content: browser.i18n.getMessage("mined"),
        duration: 2350
      });
    } catch (e) {
      console.log("Failed to mine", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("miningFailed"),
        duration: 2400
      });
    }

    setMining(false);
  }

  const { walletStatus } = useWallets();

  return (
    <Wrapper>
      {walletStatus === "noWallets" && <NoWallets />}
      <CardBody>
        <Title>
          ArLocal {browser.i18n.getMessage("devtools")}
          <Spacer x={0.2} />
          <Text noMargin>by Wander</Text>
        </Title>
        <ConnectionText>
          {browser.i18n.getMessage(online ? "testnetLive" : "testnetDown")}
          <ConnectionStatus connected={online} />
        </ConnectionText>
        <Spacer y={1.5} />
        <InputWithBtn>
          <InputWrapper>
            <Input
              {...testnetInput.bindings}
              type="text"
              label={browser.i18n.getMessage("testnetGatewayUrlLabel")}
              placeholder="http://localhost:1984"
              fullWidth
            />
          </InputWrapper>
          <RefreshButton
            variant="secondary"
            onClick={() => loadTestnet()}
            refreshing={loadingTestnet}
          >
            <RefreshIcon />
          </RefreshButton>
        </InputWithBtn>
        <Spacer y={1} />
        {(!online && <Tutorial />) || (
          <>
            <Mint arweave={arweave} />
            <Spacer y={1} />
            <ArLocalTransaction arweave={arweave} />
            <Spacer y={1} />
            <Button
              fullWidth
              variant="secondary"
              loading={mining}
              onClick={mine}
            >
              {browser.i18n.getMessage("mine")}
            </Button>
          </>
        )}
      </CardBody>
    </Wrapper>
  );
}

export default function ArLocalRoot() {
  return (
    <WanderThemeProvider>
      <WalletsProvider>
        <ArLocal />
      </WalletsProvider>
    </WanderThemeProvider>
  );
}
