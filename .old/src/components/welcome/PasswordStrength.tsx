import { type DiversityType, passwordStrength } from "check-password-strength";
import { Spacer, Text } from "@arconnect/components-rebrand";
import { useMemo } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { Check, X, AlertTriangle } from "@untitled-ui/icons-react";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";

export interface PasswordStrengthProps {
  password: string;
  passwordsMatch: boolean;
  minLength: number;
}

export default function PasswordStrength({ password, passwordsMatch, minLength }: PasswordStrengthProps) {
  // get strength
  const strength = useMemo(() => passwordStrength(password || ""), [password]);

  const getStrengthInfo = () => {
    const strengthIndex = strength.id + 1;
    switch (strength.value) {
      case "Too weak":
        return {
          bars: 1,
          color: "#F1655B",
          text: `password_strength_${strengthIndex}`,
        };
      case "Weak":
        return {
          bars: 2,
          color: "#F1A15B",
          text: `password_strength_${strengthIndex}`,
        };
      case "Medium":
        return {
          bars: 3,
          color: "#E8D85B",
          text: `password_strength_${strengthIndex}`,
        };
      case "Strong":
        return {
          bars: 4,
          color: IS_EMBEDDED_APP ? "#007229" : "#5BF16E",
          text: `password_strength_${strengthIndex}`,
        };
      default:
        return { bars: 0, color: "#544A81", text: "" };
    }
  };

  // checklist elements
  const checklist: ChecklistElement[] = [
    {
      validity: ["lowercase", "uppercase"],
      display: "password_strength_checklist_case",
    },
    {
      validity: ["number"],
      display: "password_strength_checklist_number",
    },
    {
      validity: ["symbol"],
      display: "password_strength_checklist_symbol",
    },
  ];

  const { bars, color, text } = getStrengthInfo();

  return (
    <div style={{ width: "100%" }}>
      <ProgressBar>
        {new Array(4).fill("").map((_, i) => (
          <Bar active={bars >= i + 1} key={i} />
        ))}
      </ProgressBar>

      <Spacer y={0.35} />

      <Text noMargin style={{ color }}>
        {browser.i18n.getMessage(text)}
      </Text>

      <Spacer y={1} />

      <StrengthChecklist>
        <StrengthCheck $status={passwordsMatch ? "valid" : "error"}>
          {passwordsMatch ? <Check /> : <X />}
          <Text variant="secondary" noMargin>
            {browser.i18n.getMessage(passwordsMatch ? "passwords_match" : "passwords_not_match")}
          </Text>
        </StrengthCheck>
        <StrengthCheck $status={strength.length >= minLength ? "valid" : "error"}>
          {strength.length >= minLength ? <Check /> : <X />}
          <Text variant="secondary" noMargin>
            {browser.i18n.getMessage("password_strength_checklist_length", `${minLength}`)}
          </Text>
        </StrengthCheck>
        {checklist.map((elem, i) => {
          const valid = elem.validity.every((diversity) => {
            return strength.contains.includes(diversity);
          });

          return (
            <StrengthCheck $status={valid ? "valid" : "warning"} key={i}>
              {valid ? <Check /> : <AlertTriangle />}
              <Text variant="secondary" noMargin>
                {browser.i18n.getMessage(elem.display)}
              </Text>
            </StrengthCheck>
          );
        })}
      </StrengthChecklist>
    </div>
  );
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
    props.active
      ? IS_EMBEDDED_APP
        ? "rgba(13, 108, 233)"
        : props.theme.theme
      : IS_EMBEDDED_APP
        ? "rgba(13, 108, 233, 0.50)"
        : "rgba(107, 87, 249, 0.50)"};
  transition: all 0.23s ease-in-out;
`;

const StrengthChecklist = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const iconColors = IS_EMBEDDED_APP
  ? ({
      valid: "#007229",
      warning: "#B90",
      error: "#D22B1F",
    } as const)
  : ({
      valid: "#56C980",
      warning: "#B90",
      error: "#F1655B",
    } as const);

const StrengthCheck = styled.div<{ $status: "valid" | "warning" | "error" }>`
  display: flex;
  align-items: center;
  gap: 0.45rem;

  svg {
    width: 1.25em;
    height: 1.25em;
    color: ${(props) => iconColors[props.$status]};
    transition: all 0.17s ease-in-out;
  }
`;

interface ChecklistElement {
  validity: DiversityType[];
  display: string;
}
