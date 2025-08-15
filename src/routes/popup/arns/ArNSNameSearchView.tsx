import { mARIOToken, type AoArNSNameData } from "@ar.io/sdk/web";
import { ButtonV2 } from "@arconnect/components";
import { Spacer, Text, useInput } from "@arconnect/components-rebrand";
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
    return "Maximum length for names is 51 characters.";
  } else if (!/^[a-zA-Z0-9-]*$/.test(safeDomain)) {
    return "Name can only contain letters, numbers, and hyphens.";
  } else if (/^-|-$/g.test(safeDomain)) {
    return "Name cannot start or end with a hyphen.";
  } else if (safeDomain === "www") {
    return "Name cannot be 'www'.";
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
            setErrorMessage("An error occurred while searching for the ArNS name. Please try again.");
            setSearchState("error");
          } else {
            const fees = registrationFees[lowerCaseDomain(debouncedSearchTerm).length.toString()];
            setSearchResults({ arnsRecord, fees });
            setSearchState("notFound");
          }
        }
      } catch (error: any) {
        console.error(error);
        setErrorMessage("An error occurred while searching for the ArNS name. Please try again.");
        setSearchState("error");
      }
    };

    search();
  }, [debouncedSearchTerm]);

  const handleRegister = (name: string) => {
    navigate(`/arns/purchase-name/${name}`);
  };

  return (
    <Flex direction="column" height="100vh">
      <HeadV2 title="Purchase ArNS" />
      <Flex direction="column" padding="0 1.5rem" flex={1}>
        <SearchWrapper>
          <Text>Search for an ArNS Name</Text>
          <SearchInput small placeholder={"Search ArNS"} {...searchInput.bindings} />
        </SearchWrapper>
        {errorMessage && (
          <Text variant="secondary" size="xs" style={{ textAlign: "center", color: "red", marginTop: "0.5rem" }}>
            {errorMessage}
          </Text>
        )}
        <Spacer y={1} />

        {searchState === "ready" && (
          <Flex gap="0.5rem" direction="column" align="center" textAlign="center" flex={1} justify="center">
            <ArioIcon />
            <Text>Enter an ArNS name to search for its availability</Text>
          </Flex>
        )}

        {searchState === "searching" && (
          <StatusContainer>
            <WanderLoading />
            <StatusDescription>Searching...</StatusDescription>
          </StatusContainer>
        )}

        {searchState === "found" && (
          <Text variant="secondary" style={{ textAlign: "center" }}>
            <span
              style={{
                color: "rgba(151, 135, 255, 1)",
              }}>
              {debouncedSearchTerm}
            </span>{" "}
            has already been registered
          </Text>
        )}

        {searchState === "notFound" && (
          <Flex gap="0.5rem" direction="column" flex={1} align="center" textAlign="center">
            <Flex gap="0.5rem" padding="0.5rem">
              <Text style={{ wordBreak: "break-word" }}>
                <span
                  style={{
                    color: "rgba(151, 135, 255, 1)",
                  }}>
                  {debouncedSearchTerm}
                </span>{" "}
                is available!
              </Text>
              <SvgSuccessCheckSimple />
            </Flex>
            <ResultCard direction="column" gap="1rem">
              <Flex gap="0.5rem">
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
                    {formattedFees?.oneYearLeaseFee} {ticker} for 1 year; OR{" "}
                  </Text>
                  <Text size="xs" variant="secondary" style={{ textWrap: "nowrap", textAlign: "right" }}>
                    {formattedFees?.permabuyFee} {ticker} to permabuy
                  </Text>
                </Flex>
              </Flex>
              <ButtonV2 onClick={() => handleRegister(debouncedSearchTerm)} fullWidth>
                Register
              </ButtonV2>
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
