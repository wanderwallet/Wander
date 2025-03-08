import { Spacer, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { getPreReleaseVersionLabel, getVersionLabel } from "~utils/runtime";
import { Flex } from "~components/common/Flex";
import WanderIcon from "url:assets/icon.svg";
import IconText from "~components/IconText";
import Image from "~components/common/Image";
import { Check } from "@untitled-ui/icons-react";

export function AboutDashboardView() {
  const preReleaseVersionLabel = getPreReleaseVersionLabel();

  return (
    <Flex direction="column" justify="center" align="center" padding="2rem 0">
      <Flex direction="column" gap={32} justify="center" align="center">
        <Image
          src={WanderIcon}
          alt="Wander Icon"
          width={126.314}
          height={59.199}
        />
        <IconText width={256} height={52.866} />
      </Flex>
      <Spacer y={2} />
      <Flex direction="column" gap={4}>
        <Version>
          {getVersionLabel()}
          {preReleaseVersionLabel ? (
            <DevelopmentVersion>{preReleaseVersionLabel}</DevelopmentVersion>
          ) : null}
        </Version>
        <Version variant="secondary">{process.env.PLASMO_TARGET}</Version>
      </Flex>
      <Spacer y={2} />
      <Text noMargin>
        {browser.i18n.getMessage("permissions_used")}
        <Flex
          direction="column"
          justify="center"
          gap={8}
          style={{ paddingTop: 16 }}
        >
          {(browser.runtime.getManifest().permissions || []).map(
            (permission, i) => (
              <Flex gap={8} align="center">
                <CheckIcon />
                <Text noMargin key={i}>
                  {permission}
                </Text>
              </Flex>
            )
          )}
        </Flex>
      </Text>
    </Flex>
  );
}

const Version = styled(Text).attrs({
  noMargin: true
})`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  text-align: center;
  gap: 0.37rem;
`;

const DevelopmentVersion = styled.span`
  font-size: 0.9em;
  font-weight: 500;
  padding: 0.1rem 0.2rem;
  border-radius: 3px;
  background-color: #ff5100;
  color: #fff;
`;

const CheckIcon = styled(Check)`
  width: 17px;
  height: 17px;
  color: ${({ theme }) => theme.success};
`;
