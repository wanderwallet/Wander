import StarIcon from "./StarIcon";

type StarProps = {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  opacity: number;
  size: number;
};

const stars: readonly StarProps[] = [
  { left: 178, top: 70, opacity: 0.4, size: 41 },
  { right: 72.8, top: 81, opacity: 0.4, size: 60 },
  { right: 429, top: 199, opacity: 0.4, size: 41 },
  { left: 429, top: 292, opacity: 0.2, size: 60 },
  { right: 161, bottom: 464, opacity: 0.4, size: 94 },
  { left: 78, bottom: 382, opacity: 0.4, size: 41 },
  { right: 528, bottom: 253, opacity: 0.4, size: 41 },
  { left: 456, bottom: 199, opacity: 0.4, size: 95 },
  { right: 132, bottom: 101, opacity: 0.4, size: 60 }
] as const;

const unlockStars = [
  { right: 50, top: 50, opacity: 0.4, size: 15 },
  { left: 50, top: 100, opacity: 0.4, size: 22 },
  { right: 80, top: 220, opacity: 0.4, size: 15 },
  { left: 60, top: 230, opacity: 0.4, size: 35 }
] as const;

const starsByScreen = {
  welcome: stars,
  setup: stars.slice(2, 8),
  unlock: unlockStars
};

interface StarIconsProps {
  screen?: "welcome" | "setup" | "unlock";
}

export default function StarIcons({ screen = "welcome" }: StarIconsProps) {
  const isLessOpacity = screen === "setup";
  const displayStars = starsByScreen[screen];

  return displayStars.map((star, index) => (
    <StarIcon
      key={`star-${index}`}
      {...star}
      opacity={isLessOpacity ? 0.1 : star.opacity}
    />
  ));
}
