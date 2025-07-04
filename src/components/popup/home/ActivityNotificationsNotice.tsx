import { AnimatedStarContainer, defaultStars } from "~components/common/AnimatedStarContainer";
import { Text } from "@arconnect/components-rebrand";
import { useState } from "react";
import { ExtensionStorage } from "~utils/storage";
import { EXPLORE_TIER_BENEFITS } from "~utils/tier/constants";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { Flex } from "~components/common/Flex";
import { useTheme } from "styled-components";

const stars = defaultStars.toSpliced(1, 1);

export function ActivityNotificationsNotice() {
  const [isOpen, setOpen] = useState(false);
  const theme = useTheme();

  const handleCloseCTA = () => {
    ExtensionStorage.set(EXPLORE_TIER_BENEFITS, false);
    setOpen(false);
  };

  useAsyncEffect(async () => {
    const storedValue = await ExtensionStorage.get<boolean>(EXPLORE_TIER_BENEFITS);
    setOpen(storedValue ?? true);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatedStarContainer stars={stars} onClick={() => setOpen(true)} onClose={handleCloseCTA} showCloseButton>
      <Flex direction="row" align="center" gap={8}>
        <NotificationTextIcon color={theme.displayTheme === "light" ? "#121212" : "#EEEEEE"} />
        <Text style={{ fontSize: 12.5 }} weight="semibold" noMargin>
          Activity and notifications is now feed.
        </Text>
      </Flex>
    </AnimatedStarContainer>
  );
}

const NotificationTextIcon = ({ color = "#EEEEEE" }: { color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M21.1213 2.87868C22.2929 4.05025 22.2929 5.94975 21.1213 7.12132C19.9497 8.29289 18.0503 8.29289 16.8787 7.12132C15.7071 5.94975 15.7071 4.05025 16.8787 2.87868C18.0503 1.70711 19.9497 1.70711 21.1213 2.87868Z"
      fill={color}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M21 10.8055C21 10.3967 21 10.1923 20.9336 10.0767C20.867 9.96054 20.7993 9.90325 20.6737 9.85673C20.5487 9.81041 20.3097 9.85052 19.8318 9.93073C18.2913 10.1892 16.6531 9.72419 15.4645 8.53553C14.2758 7.34688 13.8108 5.70865 14.0693 4.1682C14.1495 3.69025 14.1896 3.45128 14.1433 3.32628C14.0968 3.20073 14.0395 3.13302 13.9233 3.06637C13.8077 3 13.6033 3 13.1945 3H7.7587C6.95375 2.99999 6.28936 2.99998 5.74818 3.04419C5.18608 3.09012 4.66938 3.18868 4.18404 3.43598C3.43139 3.81947 2.81947 4.43139 2.43598 5.18404C2.18868 5.66937 2.09012 6.18608 2.0442 6.74818C1.99998 7.28936 1.99999 7.95371 2 8.75867V16.2413C1.99999 17.0463 1.99998 17.7106 2.0442 18.2518C2.09012 18.8139 2.18868 19.3306 2.43598 19.816C2.81947 20.5686 3.43139 21.1805 4.18404 21.564C4.66938 21.8113 5.18608 21.9099 5.74818 21.9558C6.28937 22 6.95372 22 7.75868 22H15.2413C16.0463 22 16.7106 22 17.2518 21.9558C17.8139 21.9099 18.3306 21.8113 18.816 21.564C19.5686 21.1805 20.1805 20.5686 20.564 19.816C20.8113 19.3306 20.9099 18.8139 20.9558 18.2518C21 17.7106 21 17.0463 21 16.2413V10.8055ZM6 13C6 12.4477 6.44772 12 7 12H15C15.5523 12 16 12.4477 16 13C16 13.5523 15.5523 14 15 14H7C6.44772 14 6 13.5523 6 13ZM6 17C6 16.4477 6.44772 16 7 16H13C13.5523 16 14 16.4477 14 17C14 17.5523 13.5523 18 13 18H7C6.44772 18 6 17.5523 6 17Z"
      fill={color}
    />
  </svg>
);
