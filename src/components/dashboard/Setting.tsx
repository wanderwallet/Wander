import { Checkbox, Input, Text, useInput } from "@arconnect/components-rebrand";
import { setting_element_padding } from "./list/BaseElement";
import type SettingType from "~settings/setting";
import browser from "webextension-polyfill";
import Squircle from "~components/Squircle";
import SearchInput from "./SearchInput";
import useSetting from "~settings/hook";
import styled, { useTheme } from "styled-components";
import { createCoinWithAnimation } from "~api/modules/sign/animation";
import { arconfettiIcon } from "~api/modules/sign/utils";
import { ErrorTypes } from "~utils/error/error.utils";
import { ToggleSwitch } from "~routes/popup/subscriptions/subscriptionDetails";

export interface SettingDashboardViewProps {
  setting: SettingType;
}

export function SettingDashboardView({ setting }: SettingDashboardViewProps) {
  // setting state
  const [settingState, updateSetting] = useSetting(setting.name);

  const theme = useTheme();

  // fixup displayed option
  const fixupBooleanDisplay = (val: string) => {
    if (val === "false" || val === "true") {
      return browser.i18n.getMessage(val === "true" ? "enabled" : "disabled");
    }

    return val[0].toUpperCase() + val.slice(1);
  };

  // search
  const searchInput = useInput();

  // confetti example
  const confetti = async () => {
    const confettiIcon = await arconfettiIcon();
    if (confettiIcon) {
      for (let i = 0; i < 8; i++) {
        setTimeout(() => createCoinWithAnimation(confettiIcon), i * 150);
      }
    }
  };

  // search filter function
  function filterSearchResults(option: string) {
    const query = searchInput.state;

    if (query === "" || !query) {
      return true;
    }

    return option.toLowerCase().includes(query.toLowerCase());
  }

  switch (setting.type) {
    case "boolean":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* <Text variant="secondary" weight="medium" noMargin>
            {browser.i18n.getMessage(setting.description)}
          </Text> */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Text size="md" weight="medium" noMargin>
              {browser.i18n.getMessage(!!settingState ? "enabled" : "disabled")}
            </Text>

            <ToggleSwitch
              width={51}
              height={31}
              checked={!!settingState}
              setChecked={() => {
                updateSetting((val) => !val);
              }}
            />
          </div>
        </div>
      );

    case "number":
    case "string":
      return (
        <Input
          label={browser.i18n.getMessage(setting.displayName)}
          labelStyle={{
            fontSize: 16,
            fontWeight: 500,
            color: theme.primaryText
          }}
          type={setting.type === "string" ? "text" : "number"}
          value={settingState}
          onChange={(e) => {
            const val =
              setting.type === "string"
                ? // @ts-expect-error
                  e.target.value
                : // @ts-expect-error
                  Number(e.target.value);

            updateSetting(val);
          }}
          fullWidth
        />
      );

    case "pick":
      const showSearchInput =
        setting.name !== "gateways" &&
        setting?.options &&
        setting.options.length > 6;

      return (
        <>
          {/** search for "pick" settings with more than 6 options */}
          {showSearchInput && (
            <>
              <SearchWrapper>
                <SearchInput
                  placeholder={browser.i18n.getMessage(
                    setting?.inputPlaceholder || "search_pick_option"
                  )}
                  {...searchInput.bindings}
                />
              </SearchWrapper>
            </>
          )}
          <RadioWrapper hidePadding={!showSearchInput}>
            {setting?.options &&
              setting.options.filter(filterSearchResults).map((option, i) => {
                if (setting.name === "gateways") {
                  return (
                    <Checkbox
                      label={option.host}
                      checked={settingState.host === option.host}
                      onChange={() => updateSetting(option)}
                      key={i}
                    />
                  );
                } else {
                  return (
                    <Checkbox
                      label={fixupBooleanDisplay(option.toString())}
                      checked={settingState === option}
                      onChange={() => {
                        updateSetting(option);
                        if (setting.name === "arconfetti") {
                          confetti();
                        }
                      }}
                      key={i}
                    />
                  );
                }
              })}
          </RadioWrapper>
        </>
      );

    default:
      throw new Error(
        setting.type
          ? ErrorTypes.MissingSettingsType
          : ErrorTypes.UnexpectedSettingsType
      );
  }
}

export const RadioWrapper = styled.div<{ hidePadding?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  ${(props) => !props.hidePadding && `padding: 1.5rem 0;`}
`;

export const Radio = styled(Squircle).attrs((props) => ({
  outline: `rgba(${props.theme.theme}, .7)`
}))`
  position: relative;
  color: rgb(${(props) => props.theme.background});
  width: 1rem;
  height: 1rem;
`;

export const RadioInner = styled(Squircle)`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.72rem;
  height: 0.72rem;
  color: rgb(${(props) => props.theme.theme});
  transform: translate(-50%, -50%);
  transition: all 0.23s ease-in-out;
`;

export const RadioItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: ${setting_element_padding};
  border-radius: 20px;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    background-color: rgba(
      ${(props) => props.theme.theme},
      ${(props) => (props.theme.displayTheme === "light" ? "0.14" : "0.04")}
    );
  }
`;

const SearchWrapper = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background-color: ${(props) => props.theme.cardBackground};
`;
