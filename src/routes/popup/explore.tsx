import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import browser from "webextension-polyfill";
import { PageType, trackPage } from "~utils/analytics";
import styled from "styled-components";
import { Input, Section, useInput, Text } from "@arconnect/components-rebrand";
import { apps, categories, type App } from "~utils/apps";
import {
  ArrowLeft,
  ArrowRight,
  LinkExternal01
} from "@untitled-ui/icons-react";
import { getAppURL, truncateMiddle } from "~utils/format";
import WanderIcon from "url:assets/icon.svg";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";

export function ExploreView() {
  const [filteredApps, setFilteredApps] = useState(apps);
  const searchInput = useInput();
  const categoriesRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: "left" | "right") => {
    if (categoriesRef.current) {
      const scrollAmount = 100;
      categoriesRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  }, []);

  const handleCategoryClick = useCallback((category: string) => {
    setFilteredApps(category === "All" ? apps : filterApps(apps, "", category));
  }, []);

  useEffect(() => {
    trackPage(PageType.EXPLORE);
  }, []);

  useEffect(() => {
    setFilteredApps(filterApps(apps, searchInput.state));
  }, [searchInput.state]);

  return (
    <Wrapper>
      <FixedHeader>
        <Header>
          <img src={WanderIcon} alt="Wander Icon" width={38.407} height={18} />
          <ScrollButton direction="left" onClick={() => scroll("left")}>
            <ArrowLeft height={20} width={20} />
          </ScrollButton>
          <Categories ref={categoriesRef}>
            {categories.map((category) => (
              <Category
                key={category.title}
                onClick={() => handleCategoryClick(category.title)}
              >
                <CategoryIcon as={category.icon} />
                {category.title}
              </Category>
            ))}
          </Categories>
          <ScrollButton direction="right" onClick={() => scroll("right")}>
            <ArrowRight height={20} width={20} />
          </ScrollButton>
        </Header>
        <Input
          {...searchInput.bindings}
          sizeVariant="small"
          variant="search"
          fullWidth
          placeholder="Search for an app"
        />
      </FixedHeader>
      <AppList>
        {filteredApps.map((app, index) => (
          <AppWrapper
            key={index}
            onClick={() => {
              browser.tabs.create({ url: app.url });
            }}
          >
            <LogoDescriptionWrapper>
              {app.useAppIconWrapper ? (
                <AppLinearGradientIconWrapper
                  source={app.icon}
                  alt={app.name}
                  objectFit={app.objectFit}
                  showBorder={app.showBorder}
                  imageSize={app.imageSize}
                />
              ) : (
                <AppIconWrapper
                  source={app.icon}
                  alt={app.name}
                  backgroundColor={app.backgroundColor}
                  objectFit={app.objectFit}
                  showBorder={app.showBorder}
                  imageSize={app.imageSize}
                />
              )}
              <Description>
                <Title>
                  <AppTitle>{app.name}</AppTitle>
                  <Pill>{app.category}</Pill>
                </Title>
                <AppDescription>
                  {truncateMiddle(getAppURL(app.url), 30)}
                </AppDescription>
              </Description>
            </LogoDescriptionWrapper>
            <LinkExternalIcon />
          </AppWrapper>
        ))}
      </AppList>
    </Wrapper>
  );
}

const filterApps = (
  apps: App[],
  searchTerm: string = "",
  category?: string
): App[] => {
  const lowercaseSearch = searchTerm.toLowerCase();
  return apps.filter((app: App) => {
    if (category && category !== app.category) return false;

    return (
      !searchTerm ||
      app.name.toLowerCase().includes(lowercaseSearch) ||
      app.category.toLowerCase().includes(lowercaseSearch) ||
      app.url.toLowerCase().includes(lowercaseSearch)
    );
  });
};

const IconWrapper = styled.div<{
  backgroundColor?: string;
  showBorder?: boolean;
}>`
  background-color: ${(props) => props.backgroundColor || "white"};
  border-radius: 12px;
  ${(props) =>
    props.showBorder && `border: 1px solid ${props.theme.borderDefault};`}
  overflow: hidden;
  height: 40px;
  width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const IconImage = styled.img<{
  objectFit?: "contain" | "cover";
  size?: string;
}>`
  width: ${(props) => props.size || "100%"};
  height: ${(props) => props.size || "100%"};
  object-fit: ${(props) => props.objectFit || "contain"};
`;

const GradientWrapper = styled.div<{ colors?: string[]; showBorder?: boolean }>`
  border-radius: 12px;
  overflow: hidden;
  height: 40px;
  width: 40px;
  background: ${(props) =>
    props.colors
      ? `linear-gradient(135deg, ${props.colors[0]} 0%, ${props.colors[1]} 100%)`
      : "linear-gradient(135deg, #8B57FE 0%, #886DFB 100%)"};
  ${(props) =>
    props.showBorder && `border: 1px solid ${props.theme.borderDefault};`}
  display: flex;
  justify-content: center;
  align-items: center;
`;

interface AppIconProps {
  source: string;
  alt?: string;
  backgroundColor?: string;
  objectFit?: "contain" | "cover";
  showBorder?: boolean;
  imageSize?: string;
}

function AppIconWrapper({
  source,
  alt,
  showBorder,
  backgroundColor,
  objectFit,
  imageSize
}: AppIconProps) {
  return (
    <IconWrapper backgroundColor={backgroundColor} showBorder={showBorder}>
      <IconImage
        src={source}
        alt={alt || ""}
        objectFit={objectFit}
        size={imageSize}
      />
    </IconWrapper>
  );
}

interface AppGradientIconProps {
  source: string;
  alt?: string;
  colors?: string[];
  objectFit?: "contain" | "cover";
  showBorder?: boolean;
  imageSize?: string;
}

function AppLinearGradientIconWrapper({
  source,
  alt,
  colors,
  showBorder,
  objectFit,
  imageSize
}: AppGradientIconProps) {
  return (
    <GradientWrapper colors={colors} showBorder={showBorder}>
      <IconImage
        objectFit={objectFit}
        src={source}
        alt={alt || ""}
        size={imageSize}
      />
    </GradientWrapper>
  );
}

const LinkExternalIcon = styled(LinkExternal01)`
  height: 24px;
  width: 24px;
  cursor: pointer;
  color: ${(props) => props.theme.tertiaryText};
`;

const Description = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const Wrapper = styled(Section).attrs({ showPaddingVertical: false })`
  display: flex;
  flex: 1;
  height: 100%;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 100px;
`;

const AppTitle = styled(Text).attrs({
  noMargin: true,
  weight: "semibold"
})``;

const Pill = styled.div`
  color: ${(props) => props.theme.primaryText};
  background-color: ${(props) => props.theme.surfaceSecondary};
  padding: 4px 8px;
  border-radius: 50px;
  border: 1px solid ${(props) => props.theme.inputField};
  box-sizing: border-box;

  font-size: 10px;
  font-weight: 400;
`;

const AppDescription = styled.p`
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => props.theme.secondaryText};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AppWrapper = styled.button`
  padding-top: 8px;
  padding-bottom: 8px;
  gap: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;

  transition: all 0.125s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const LogoDescriptionWrapper = styled.div`
  gap: 12px;
  display: flex;
`;

const Category = styled.div`
  flex-shrink: 0;
  display: flex;
  padding: 8px 12px;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  background: rgba(
    255,
    255,
    255,
    ${({ theme }) => (theme.displayTheme === "dark" ? "0.08" : "0.80")}
  );
  backdrop-filter: blur(4px);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  color: ${(props) => props.theme.primaryText};

  &:hover {
    background: rgba(
      255,
      255,
      255,
      ${({ theme }) => (theme.displayTheme === "dark" ? "0.12" : "0.90")}
    );
  }

  &:active {
    background: rgba(${({ theme }) => theme.background}, 0.16);
    transform: scale(0.98);
  }
`;

const CategoryIcon = styled.div`
  height: 20px;
  width: 20px;
  color: ${(props) => props.theme.primaryText};
`;

const FixedHeader = styled.div`
  display: flex;
  gap: 1rem;
  flex-direction: column;
  position: fixed;
  width: ${IS_EMBEDDED_APP ? "100%" : "377px"};
  margin: 0 auto;
  left: 0;
  right: 0;
  padding: 24px 24px 16px 24px;
  box-sizing: border-box;
  background: ${({ theme }) =>
    theme.displayTheme === "dark"
      ? `linear-gradient(180deg, #26126f 0%, #111 150px)`
      : `linear-gradient(180deg, #E3D8F6 0%, #FFF 34.57%)`};
  z-index: 100;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  position: relative;
`;

const ScrollButton = styled.button<{ direction: "left" | "right" }>`
  ${(props) => props.direction}: 0;

  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  opacity: 0.8;
  color: ${(props) => props.theme.primaryText};

  &:hover {
    opacity: 1;
  }
`;

const Categories = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: scroll;
  white-space: nowrap;
  cursor: default;
  width: 100%;
  flex: 1;
  min-width: 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }
`;

const AppList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 136px;
`;
