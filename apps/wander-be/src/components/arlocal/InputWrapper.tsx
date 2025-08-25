import { IconButton } from "~components/IconButton";
import { Button } from "@arconnect/components-rebrand";
import styled from "styled-components";

export const InputWithBtn = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.8rem;

  ${Button} {
    padding-top: 0.9rem;
    padding-bottom: 0.9rem;
  }

  ${IconButton} {
    padding: 0.9rem;
  }
`;

export const InputWrapper = styled.div`
  width: 100%;
`;
