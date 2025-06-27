import { ListItem } from "@arconnect/components-rebrand";
import { ContentWrapper } from "~components/modals/Components";
import SliderMenu from "~components/SliderMenu";
import { Check } from "@untitled-ui/icons-react";
import styled from "styled-components";
import browser from "webextension-polyfill";

export enum FeedFilter {
  NO_FILTERS = "no_filters",
  TRANSACTIONS = "transactions",
  ANNOUNCEMENTS = "announcements",
}

const filtersMap = {
  [FeedFilter.NO_FILTERS]: browser.i18n.getMessage("no_filters"),
  [FeedFilter.TRANSACTIONS]: browser.i18n.getMessage("transactions"),
  [FeedFilter.ANNOUNCEMENTS]: browser.i18n.getMessage("announcements"),
} as const;

const filters = Object.keys(filtersMap) as FeedFilter[];

interface FeedFilterPopupProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  setFilter: (filter: FeedFilter) => void;
  filter: FeedFilter;
}

export const FeedFilterPopup = ({ isOpen, setOpen, filter, setFilter }: FeedFilterPopupProps) => {
  return (
    <SliderMenu title="Filters" isOpen={isOpen} onClose={() => setOpen(false)}>
      <ContentWrapper style={{ gap: 16 }}>
        {filters.map((filterValue) => (
          <ListItem
            key={filterValue}
            title={filtersMap[filterValue]}
            titleStyle={{ fontSize: 16, fontWeight: 600 }}
            hideSquircle
            rightIcon={filter === filterValue ? <CheckIcon /> : undefined}
            onClick={() => setFilter(filterValue)}
          />
        ))}
      </ContentWrapper>
    </SliderMenu>
  );
};

const CheckIcon = styled(Check)`
  width: 24px;
  height: 24px;
  color: ${({ theme }) => theme.theme};
`;
