import { useState } from "react";
import clsx from "clsx";
import defaultPlaceholderUrl from "url:/assets/placeholder.png";
import { sleep } from "~utils/promises/sleep";
import { useTheme } from "~components/embed/contexts/ThemeContext";

import styles from "./Image.module.scss";

const fakeDelay = process.env.NODE_ENV === "development" ? 2500 : 0;

type BorderRadiusVariant = "none" | "rounded" | "circular";

interface ImageProps {
  src: string;
  srcDark?: string;
  width: number;
  height: number;
  alt?: string;
  className?: string;
  fullWidth?: boolean;
  borderRadius?: BorderRadiusVariant;
  backgroundColor?: string;
  placeholderURL?: string;
  style?: React.CSSProperties;
}

export default function Image({
  src,
  srcDark,
  width,
  height,
  alt = "",
  className,
  fullWidth,
  borderRadius = "none",
  backgroundColor = "transparent",
  placeholderURL = defaultPlaceholderUrl,
  style,
}: ImageProps) {
  const theme = useTheme();
  const displayTheme = theme.mode;

  const [isLoaded, setIsLoaded] = useState(false);

  const pictureClassName = clsx(className, styles.root, {
    [styles.fullWidth]: fullWidth,
    [styles.isRounded]: borderRadius === "rounded",
    [styles.isCircular]: borderRadius === "circular",
    [styles.isLoaded]: isLoaded,
  });

  const pictureStyle = {
    "--imgWidth": `${width}px`,
    "--imgHeight": fullWidth ? "auto" : `${height}px`,
    "--imgAspectRatio": fullWidth ? width / height : "auto",
    "--imgBackgroundColor": backgroundColor,
    "--imgPlaceholderBackgroundURL": placeholderURL && placeholderURL !== "none" ? `url(${placeholderURL})` : "none",
    ...style,
  };

  const imgClassName = clsx(styles.img, {
    [styles.isLoaded]: isLoaded,
  });

  const handleImageLoaded = async () => {
    if (fakeDelay) await sleep(fakeDelay + Math.random() * fakeDelay * 2);

    setIsLoaded(true);
  };

  return (
    <picture className={pictureClassName} style={pictureStyle}>
      {srcDark ? (
        <source srcSet={displayTheme === "light" ? src : srcDark} media="(prefers-color-scheme: dark)" />
      ) : null}

      <img
        className={imgClassName}
        src={displayTheme === "dark" && srcDark ? srcDark : src}
        width={width}
        height={height}
        alt={alt}
        draggable={false}
        onLoad={handleImageLoaded}
      />
    </picture>
  );
}
