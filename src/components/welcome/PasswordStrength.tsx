import { type DiversityType, passwordStrength } from "check-password-strength";
import { Spacer, Text } from "@arconnect/components-rebrand";
import { useMemo } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { Check, X } from "@untitled-ui/icons-react";

export default function PasswordStrength({ password }: Props) {
  // get strength
  const strength = useMemo(() => passwordStrength(password || ""), [password]);

  const getStrengthInfo = () => {
    const strengthIndex = strength.id + 1;
    switch (strength.value) {
      case "Too weak":
        return {
          bars: 1,
          color: "#F1655B",
          text: `password_strength_${strengthIndex}`
        };
      case "Weak":
        return {
          bars: 2,
          color: "#F1A15B",
          text: `password_strength_${strengthIndex}`
        };
      case "Medium":
        return {
          bars: 3,
          color: "#E8D85B",
          text: `password_strength_${strengthIndex}`
        };
      case "Strong":
        return {
          bars: 4,
          color: "#5BF16E",
          text: `password_strength_${strengthIndex}`
        };
      default:
        return { bars: 0, color: "#544A81", text: "" };
    }
  };

  // checklist elements
  const checklist: ChecklistElement[] = [
    {
      validity: ["lowercase", "uppercase"],
      display: "password_strength_checklist_case"
    },
    {
      validity: ["number"],
      display: "password_strength_checklist_number"
    },
    {
      validity: ["symbol"],
      display: "password_strength_checklist_symbol"
    }
  ];

  const { bars, color, text } = getStrengthInfo();

  return (
    <>
      <ProgressBar>
        {new Array(4).fill("").map((_, i) => (
          <Bar active={bars >= i + 1} key={i} />
        ))}
      </ProgressBar>
      <Spacer y={0.35} />
      <Text noMargin style={{ color }}>
        {browser.i18n.getMessage(text)}
      </Text>
      <Spacer y={1.5} />
      <StrengthChecklist>
        {checklist.map((elem, i) => {
          let valid = true;

          for (const diversity of elem.validity) {
            if (strength.contains.includes(diversity)) continue;
            valid = false;
          }

          return (
            <StrengthCheck isValid={valid} key={i}>
              {(valid && <Check />) || <X height={24} />}
              <Text variant="secondary" noMargin>
                {browser.i18n.getMessage(elem.display)}
              </Text>
            </StrengthCheck>
          );
        })}
        <StrengthCheck isValid={password && password.length >= 5}>
          {(password && password.length >= 5 && <Check height={24} />) || (
            <X height={24} />
          )}
          <Text variant="secondary" noMargin>
            {browser.i18n.getMessage("password_strength_checklist_length", "5")}
          </Text>
        </StrengthCheck>
      </StrengthChecklist>
    </>
  );
}

interface Props {
  password: string;
}

const ProgressBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Bar = styled.div<{ active: boolean }>`
  width: 22%;
  height: 4px;
  background-color: ${(props) =>
    props.active ? props.theme.theme : "rgba(107, 87, 249, 0.50)"};
  transition: all 0.23s ease-in-out;
`;

const StrengthChecklist = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const StrengthCheck = styled.div<{ isValid?: boolean; length?: number }>`
  display: flex;
  align-items: center;
  gap: 0.45rem;

  svg {
    font-size: 1rem;
    width: 1.5em;
    height: 1.5em;
    color: ${(props) => (props.isValid ? "#56C980" : "#F1655B")};
    transition: all 0.17s ease-in-out;
  }
`;

interface ChecklistElement {
  validity: DiversityType[];
  display: string;
}
