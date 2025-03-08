import { Text } from "@arconnect/components-rebrand";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { motion } from "framer-motion";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  subtitle: string;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  subtitle
}) => {
  return (
    <PaginationContainer>
      <InactivePagination>
        {[...Array(totalPages)].map((_, index) => (
          <PaginationDot key={index}>
            {index <= currentPage - 1 && (
              <ActiveDot
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
            )}
          </PaginationDot>
        ))}
      </InactivePagination>
      <Text size="sm" weight="medium" noMargin>
        {browser.i18n.getMessage("step")} {currentPage}:{" "}
        {browser.i18n.getMessage(subtitle)}
      </Text>
    </PaginationContainer>
  );
};

export const CheckIcon = () => (
  <svg
    width="11"
    height="8"
    viewBox="0 0 11 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.67794 6.31171L1.30728 3.82401L0.5 4.66517L3.67794 8L10.5 0.841163L9.69841 0L3.67794 6.31171Z"
      fill="white"
    />
  </svg>
);

const PaginationContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InactivePagination = styled.div`
  display: flex;
  height: 8px;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  justify-content: stretch;
`;

const PaginationDot = styled.div`
  width: 100%;
  height: 4px;
  border-radius: 50px;
  background: rgba(107, 87, 249, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
`;

const ActiveDot = styled(motion.div)`
  width: 100%;
  height: 100%;
  border-radius: 50px;
  background: ${(props) => props.theme.theme};
`;

export default Pagination;
