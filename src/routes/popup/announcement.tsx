import browser from "webextension-polyfill";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { getAnnouncement } from "~utils/announcements";
import { useMemo } from "react";
import { Flex } from "~components/common/Flex";
import { isURL } from "~utils/urls/isURL";
import dayjs from "dayjs";
import { Text } from "@arconnect/components-rebrand";
import { Announcement01 } from "@untitled-ui/icons-react";

export interface AnnouncementViewParams {
  id: string | number;
}

export type AnnouncementViewProps = CommonRouteProps<AnnouncementViewParams>;

export function AnnouncementView({ params: { id } }: AnnouncementViewProps) {
  const announcement = useMemo(() => getAnnouncement(id), [id]);

  return (
    <Wrapper>
      <div>
        <HeadV2 title={browser.i18n.getMessage("announcement")} />
        <Flex direction="column" gap={16} padding="0px 24px">
          <Flex direction="row" gap={8} align="center">
            <AnnouncementIconWrapper>
              <AnnouncementIcon />
            </AnnouncementIconWrapper>
            <Flex direction="column" gap={4}>
              <PrimaryText style={{ whiteSpace: "nowrap" }}>{announcement?.title}</PrimaryText>
              <SecondaryText size="sm" style={{ whiteSpace: "nowrap" }}>
                {dayjs(announcement?.timestamp).format("MMM D, YYYY")}
              </SecondaryText>
            </Flex>
          </Flex>
          <SecondaryText>
            {announcement?.description?.split(" ").map((word, i) => {
              const isLink = isURL(word);
              if (isLink) {
                const displayText = word.replace(/^(https?:\/\/|www\.)/, "");
                const href = word.endsWith(".") ? word.slice(0, -1) : word;
                return (
                  <AnnouncementLink key={i} href={href} target="_blank" rel="noopener noreferrer">
                    {displayText}
                  </AnnouncementLink>
                );
              }
              return ` ${word} `;
            }) || "Announcement description"}
          </SecondaryText>
        </Flex>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
`;

const AnnouncementLink = styled.a`
  color: ${({ theme }) => theme.theme};
  text-decoration: none;
  display: inline;
`;

const AnnouncementIconWrapper = styled.div`
  display: flex;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  border-radius: 50px;
  background: ${({ theme }) => theme.surfaceSecondary};
`;

const PrimaryText = styled(Text).attrs({
  noMargin: true,
  weight: "semibold",
})``;

const SecondaryText = styled(Text).attrs({
  noMargin: true,
  weight: "medium",
  size: "sm",
  variant: "secondary",
})``;

const AnnouncementIcon = styled(Announcement01)`
  height: 24px;
  width: 24px;
  color: ${({ theme }) => theme.theme};
`;
