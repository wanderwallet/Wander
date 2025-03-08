import {
  useToasts,
  Section,
  useInput,
  Button,
  Input,
  Text
} from "@arconnect/components-rebrand";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState, type Key } from "react";
import HeadV2 from "~components/popup/HeadV2";
import { WarningIcon } from "~components/popup/Token";
import browser from "webextension-polyfill";
import { Degraded, WarningWrapper } from "~routes/popup/send";
import { getKeyfile, type DecryptedWallet } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import {
  AddressField,
  ContentWrapper,
  QRCodeWrapper,
  Wrapper
} from "~routes/popup/receive";
import { dataToFrames } from "qrloop";
import { checkPassword } from "~wallets/auth";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { CopyToClipboard } from "~components/CopyToClipboard";

export interface GenerateQRViewParams {
  address: string;
}

export type GenerateQRViewProps = CommonRouteProps<GenerateQRViewParams>;

export function GenerateQRView({ params: { address } }: GenerateQRViewProps) {
  const { navigate } = useLocation();
  const [wallet, setWallet] = useState<DecryptedWallet>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const { setToast } = useToasts();
  const passwordInput = useInput();

  const isHardware = wallet?.type === "hardware";

  async function generateQr() {
    try {
      setLoading(true);
      const isPasswordCorrect = await checkPassword(passwordInput.state);
      if (isPasswordCorrect) {
        const wallet = await getKeyfile(address);
        setWallet(wallet);
      } else {
        passwordInput.setStatus("error");
        setToast({
          type: "error",
          content: browser.i18n.getMessage("invalidPassword"),
          duration: 2200
        });
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if ((wallet as any)?.keyfile) {
      setFrames(dataToFrames(JSON.stringify((wallet as any)?.keyfile)));
      freeDecryptedWallet((wallet as any).keyfile);
    }
  }, [wallet]);

  useEffect(() => {
    return () => setFrames([]);
  }, []);

  return (
    <>
      <HeadV2
        title={
          wallet
            ? wallet?.nickname ?? "Account"
            : browser.i18n.getMessage("generate_qr_code")
        }
        showOptions={false}
      />
      <Wrapper style={{ height: "calc(100vh - 100px)" }}>
        {wallet ? (
          <div>
            {isHardware ? (
              <Degraded
                style={{
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <WarningWrapper>
                  <WarningIcon color="#fff" />
                </WarningWrapper>
                <div>
                  <span>
                    {browser.i18n.getMessage("cannot_generate_qr_code")}
                  </span>
                </div>
              </Degraded>
            ) : (
              <ContentWrapper>
                <Section>
                  <QRCodeWrapper size={297}>
                    <div
                      style={{
                        backgroundColor: "#fff",
                        padding: "12px",
                        borderRadius: "12px"
                      }}
                    >
                      <QRCodeLoop frames={frames} fps={5} size={275} />
                    </div>
                  </QRCodeWrapper>
                </Section>
                <Section showPaddingVertical={false}>
                  <AddressField>
                    <Text size="sm" weight="medium" noMargin>
                      {wallet.address}
                    </Text>

                    <CopyToClipboard
                      onCopy={setCopied}
                      showToast={false}
                      label={browser.i18n.getMessage(
                        copied ? "copied" : "copy"
                      )}
                      labelAs={({ children }) => (
                        <Text
                          variant="secondary"
                          size="sm"
                          weight="semibold"
                          noMargin
                        >
                          {children}
                        </Text>
                      )}
                      text={wallet.address}
                    />
                  </AddressField>
                </Section>
              </ContentWrapper>
            )}
          </div>
        ) : (
          <Section
            style={{ justifyContent: "space-between", flex: 1 }}
            showPaddingVertical={false}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Text noMargin>
                {browser.i18n.getMessage("generate_qr_code_title")}
              </Text>
              <Input
                sizeVariant="small"
                type="password"
                placeholder={browser.i18n.getMessage("password")}
                {...passwordInput.bindings}
                fullWidth
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  generateQr();
                }}
              />
            </div>

            <Button fullWidth onClick={generateQr} loading={loading}>
              {browser.i18n.getMessage("generate")}
            </Button>
          </Section>
        )}
      </Wrapper>
    </>
  );
}

const QRCodeLoop = ({
  frames,
  size,
  fps
}: {
  frames: string[];
  size: number;
  fps: number;
}) => {
  const [frame, setFrame] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const nextFrame = (frame: number, frames: string[]) => {
      frame = (frame + 1) % frames.length;
      return frame;
    };

    let lastT: number;
    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!lastT) lastT = t;
      if ((t - lastT) * fps < 1000) return;
      lastT = t;
      setFrame((prevFrame) => nextFrame(prevFrame, frames));
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [frames, fps]);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        backgroundColor: "#000"
      }}
    >
      {frames.map((chunk: any, i: Key) => (
        <div
          key={i}
          style={{ position: "absolute", opacity: i === frame ? 1 : 0 }}
        >
          <QRCodeSVG
            fgColor="#fff"
            bgColor="transparent"
            size={size}
            value={chunk}
          />
        </div>
      ))}
    </div>
  );
};
