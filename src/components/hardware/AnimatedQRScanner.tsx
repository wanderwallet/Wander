import { Loading, Spacer, Text, useToasts } from "@arconnect/components";
import { AnimatedQRScanner as Scanner } from "@arconnect/keystone-sdk";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import { CameraOffIcon } from "@iconicicons/react";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function AnimatedQRScanner({ className, ...props }: Props) {
  // toasts
  const { setToast } = useToasts();

  // camera allowed
  const [cameraAllowed, setCameraAllowed] = useState(true);

  const isWebWorkerAvailable = useMemo(() => typeof Worker !== "undefined", [Worker]);

  useEffect(() => {
    (async () => {
      // get if camera permission is granted
      const cameraPerms = await navigator.permissions.query({
        // @ts-expect-error
        name: "camera",
      });
      const listener = () => {
        setCameraAllowed(cameraPerms.state === "granted");

        if (cameraPerms.state !== "granted") return;

        // notify the user to refresh the page
        // when they grant camera permissions
        setToast({
          type: "info",
          duration: 4500,
          content: browser.i18n.getMessage("keystone_allowed_camera"),
        });
      };

      setCameraAllowed(cameraPerms.state === "granted");

      // listen for camera permission changes
      cameraPerms.addEventListener("change", listener);

      return () => cameraPerms.removeEventListener("change", listener);
    })();
  }, []);

  return (
    <Outline>
      <LoadingSection>
        {(cameraAllowed && (
          <>
            <LoadingCamera />
            <Spacer y={0.85} />
            <ModalText>{browser.i18n.getMessage("keystone_loading_camera")}</ModalText>
          </>
        )) || (
          <>
            <DeniedCamera />
            <Spacer y={0.85} />
            <ModalText>{browser.i18n.getMessage("keystone_disabled_camera")}</ModalText>
          </>
        )}
      </LoadingSection>
      <Wrapper>{isWebWorkerAvailable && <Scanner {...props} />}</Wrapper>
    </Outline>
  );
}

const Outline = styled.div`
  position: relative;
  padding: 10px;
  border: 2px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 18px;
  width: max-content;
`;

const LoadingSection = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  top: 50%;
  left: 50%;
  width: 90%;
  transform: translate(-50%, -50%);
  z-index: 1;
`;

const ModalText = styled(Text).attrs({
  noMargin: true,
})`
  text-align: center;
`;

const LoadingCamera = styled(Loading)`
  color: rgb(${(props) => props.theme.theme});
  width: 1.85rem;
  height: 1.85rem;
`;

const DeniedCamera = styled(CameraOffIcon)`
  font-size: 2rem;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.theme});
`;

const Wrapper = styled.div`
  position: relative;
  width: 400px;
  height: 400px;
  overflow: hidden;
  border-radius: 8px;
  z-index: 10;

  @media screen and (max-width: 1080px) {
    width: 340px;
    height: 340px;
  }

  @media screen and (max-width: 720px) {
    // what we subtract here:
    // - section padding * 2 (2 * 20px)
    // - scanner outline padding * 2 (2 * 10px)
    // - scanner outline border * 2 (2 * 2px)
    width: calc(100vw - 40px - 20px - 4px);
    height: calc(100vw - 40px - 20px - 4px);
  }
`;

interface Props extends ComponentProps<typeof Scanner> {
  className?: string;
}
