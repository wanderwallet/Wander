import { useTheme } from "styled-components";

export default function Online({ size = 8 }) {
  const theme = useTheme();

  return (
    <div
      style={{
        height: size,
        width: size,
        borderRadius: "50%",
        backgroundColor: theme.success
      }}
    />
  );
}
