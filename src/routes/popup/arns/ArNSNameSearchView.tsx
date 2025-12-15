import { mARIOToken, type AoArNSNameData } from "@ar.io/sdk/web";
import { Button, Spacer, Text, useInput } from "@wanderapp/components";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Flex } from "~components/common/Flex";
import SearchInput from "~components/dashboard/SearchInput";
import { ArioIcon } from "~components/embed";
import SvgSuccessCheckSimple from "~components/embed/ui/atoms/icon/SuccessCheckSimple";
import HeadV2 from "~components/popup/HeadV2";
import { getArNSRecord, getRegistrationFees, useTicker } from "~lib/arns";
import { WanderLoading } from "~routes/welcome/WanderLoading";
import { useDebounce } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";
import { formatArio, lowerCaseDomain } from "./utils";
import browser from "webextension-polyfill";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { trackPage, PageType } from "~utils/analytics";

// Types
type SearchState = "ready" | "searching" | "found" | "notFound" | "error";

const StatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 2rem;
  text-align: center;
  gap: 0.5rem;
  height: 100%;
`;

const StatusDescription = styled.p`
  font-size: 0.9375rem;
  color: rgb(var(--text-color-secondary, #666666));
  margin: 0 0 1.5rem;
  max-width: 300px;
`;

const ResultCard = styled(Flex)`
  background-color: ${(props) => props.theme.surfaceSecondary};
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  align-self: stretch;
  max-width: 100%;
`;

const validateArNSName = (name: string) => {
  const safeDomain = lowerCaseDomain(name.trim());

  if (safeDomain.length > 51) {
    return browser.i18n.getMessage("arns_name_max_length");
  } else if (!/^[a-zA-Z0-9-]*$/.test(safeDomain)) {
    return browser.i18n.getMessage("arns_name_only_letters_numbers_and_hyphens");
  } else if (/^-|-$/g.test(safeDomain)) {
    return browser.i18n.getMessage("arns_name_cannot_start_or_end_with_hyphen");
  } else if (safeDomain === "www") {
    return browser.i18n.getMessage("arns_name_cannot_be_www");
  }

  return undefined;
};

export const ArNSNameSearchView = () => {
  const { navigate } = useLocation();
  const [searchState, setSearchState] = useState<SearchState>("ready");
  const [searchResults, setSearchResults] = useState<{
    arnsRecord: AoArNSNameData;
    fees: {
      lease: Record<number, number>;
      permabuy: number;
    };
  }>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const searchInput = useInput();
  const { data: ticker } = useTicker();

  const formattedFees = useMemo(() => {
    return searchResults
      ? {
          oneYearLeaseFee: formatArio(new mARIOToken(searchResults.fees.lease["1"]).toARIO().valueOf()),
          permabuyFee: formatArio(new mARIOToken(searchResults.fees.permabuy).toARIO().valueOf()),
        }
      : undefined;
  }, [searchResults]);

  // Debounce the search term
  const debouncedSearchTerm = useDebounce(searchInput.state, 500);

  useEffect(() => {
    // show searching state when user starts typing
    setSearchResults(undefined);
    setSearchState("searching");
  }, [searchInput.state]);

  // Handle search when debounced search term changes
  useEffect(() => {
    const search = async () => {
      setSearchResults(undefined);

      if (!debouncedSearchTerm) {
        setSearchState("ready");
        setErrorMessage(undefined);
        return;
      }

      // validation
      const error = validateArNSName(debouncedSearchTerm);
      setErrorMessage(error);

      if (error) {
        setSearchState("error");
        return;
      }

      setSearchState("searching");

      try {
        const arnsRecord = await getArNSRecord(debouncedSearchTerm);

        if (arnsRecord) {
          setSearchState("found");
        } else {
          const registrationFees = await getRegistrationFees();

          if (!registrationFees) {
            setErrorMessage(browser.i18n.getMessage("arns_search_error"));
            setSearchState("error");
          } else {
            const fees = registrationFees[lowerCaseDomain(debouncedSearchTerm).length.toString()];
            setSearchResults({ arnsRecord, fees });
            setSearchState("notFound");
          }
        }
      } catch (error: any) {
        log(LOG_GROUP.ARNS, "ArNS search error: ", error);
        setErrorMessage(browser.i18n.getMessage("arns_search_error"));
        setSearchState("error");
      }
    };

    search();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    trackPage(PageType.ARNS_PURCHASE_SEARCH);
  }, []);

  const handleRegister = (name: string) => {
    navigate(`/arns/purchase-name/${name}`);
  };

  return (
    <Flex direction="column" height="100vh">
      <HeadV2 title={browser.i18n.getMessage("purchase_arns")} />
      <Flex direction="column" padding="0 1.5rem" flex={1}>
        <SearchWrapper>
          <Text weight="medium">{browser.i18n.getMessage("search_for_an_arns_name")}</Text>
          <SearchInput
            sizeVariant="small"
            placeholder={browser.i18n.getMessage("search_arns")}
            autoFocus={true}
            {...searchInput.bindings}
          />
        </SearchWrapper>
        {errorMessage && (
          <Text variant="secondary" size="xs" style={{ textAlign: "center", color: "red", marginTop: "0.5rem" }}>
            {errorMessage}
          </Text>
        )}
        <Spacer y={1} />

        {searchState === "ready" && (
          <Flex gap="0.5rem" direction="column" align="center" textAlign="center" flex={1} justify="center">
            <IconWrapper>
              <ArioIcon />
            </IconWrapper>
            <Text size="lg" weight="medium" noMargin>
              {browser.i18n.getMessage("enter_arns_name_to_search")}
            </Text>
          </Flex>
        )}

        {searchState === "searching" && (
          <StatusContainer>
            <WanderLoading />
            <StatusDescription>{browser.i18n.getMessage("searching")}</StatusDescription>
          </StatusContainer>
        )}

        {searchState === "found" && (
          <Text variant="secondary" style={{ textAlign: "center" }}>
            <span style={{ color: "rgba(151, 135, 255, 1)" }}>{debouncedSearchTerm}</span>{" "}
            {browser.i18n.getMessage("has_already_been_registered")}
          </Text>
        )}

        {searchState === "notFound" && (
          <Flex gap="0.5rem" direction="column" flex={1} align="center" textAlign="center">
            <Flex gap="0.5rem" padding="0.5rem">
              <Text style={{ wordBreak: "break-word" }}>
                <span style={{ color: "rgba(151, 135, 255, 1)" }}>{debouncedSearchTerm}</span>{" "}
                {browser.i18n.getMessage("is_available")}
              </Text>
              <SvgSuccessCheckSimple />
            </Flex>
            <ResultCard direction="column" gap="1rem">
              <Flex gap="0.5rem" align="center">
                <Flex direction="column" gap="0.2rem" style={{ textAlign: "left", minWidth: 0 }} flex={1}>
                  <Text
                    size="base"
                    style={{
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}>
                    {debouncedSearchTerm}
                  </Text>
                  <Text
                    size="xs"
                    variant="secondary"
                    style={{
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}>
                    ar://{debouncedSearchTerm}
                  </Text>
                </Flex>
                <Flex direction="column" gap="0.2rem">
                  <Text size="xs" variant="secondary" style={{ textWrap: "nowrap", textAlign: "right" }}>
                    {browser.i18n.getMessage("one_year_lease_fee", [formattedFees?.oneYearLeaseFee, ticker])}{" "}
                  </Text>
                  <Text size="xs" variant="secondary" style={{ textWrap: "nowrap", textAlign: "right" }}>
                    {browser.i18n.getMessage("permabuy_fee", [formattedFees?.permabuyFee, ticker])}
                  </Text>
                </Flex>
              </Flex>
              <Button onClick={() => handleRegister(debouncedSearchTerm)} fullWidth>
                {browser.i18n.getMessage("register")}
              </Button>
            </ResultCard>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

const SearchWrapper = styled(Flex).attrs({
  direction: "column",
  gap: "0.5rem",
})`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 16px 18px 16px;
  width: 72px;
  border-radius: 150px;
  background: ${({ theme }) => theme.surfaceTertiary};
  box-sizing: border-box;
`;
