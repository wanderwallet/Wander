import { Button, Text, Row, Box } from "~components/embed/ui";
import React from "react";

interface SelectorItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const SelectorItem = ({ icon, title, subtitle, isSelected, onClick }: SelectorItemProps) => (
  <Button
    variant="link"
    onClick={onClick}
    style={{
      padding: 0,
      marginBottom: "8px",
      width: "100%",
      height: "auto",
      minHeight: "64px",
    }}>
    <Box
      hasBorder
      style={{
        padding: "12px",
        width: "100%",
        height: "100%",
      }}>
      <Row
        justifyContent="between"
        alignment="center"
        style={{
          width: "100%",
          height: "100%",
        }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            maxWidth: "calc(100% - 24px)",
            height: "100%",
          }}>
          <div
            style={{
              minWidth: "32px",
              width: "32px",
              height: "32px",
              marginRight: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
            {icon}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              overflow: "hidden",
            }}>
            <Text
              variant="bodyMd"
              style={{
                fontWeight: "500",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}>
              {title}
            </Text>
            <Text
              variant="bodySm"
              style={{
                color: "#666666",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}>
              {subtitle}
            </Text>
          </div>
        </div>
        {isSelected && (
          <Text
            variant="bodyMd"
            style={{
              color: "var(--color-accent)",
              flexShrink: 0,
            }}>
            ✓
          </Text>
        )}
      </Row>
    </Box>
  </Button>
);

export default SelectorItem;
