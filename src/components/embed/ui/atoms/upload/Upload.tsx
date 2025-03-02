import React, { useState } from "react";
import styles from "./Upload.module.css";
import type { UploadBaseProps } from "./Upload.types";
import { Loading } from "../loading";
import { Box, Text, UploadIcon, CheckIcon } from "..";

const Upload = React.forwardRef<HTMLDivElement, UploadBaseProps>(
  (
    {
      title,
      description,
      loadingText,
      className,
      isFullWidth,
      isBlurry,
      isLoading,
      onFileChange,
      textInputRef,
      ...props
    },
    ref
  ) => {
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
      setDragging(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      if (event.dataTransfer.files && event.dataTransfer.files[0]) {
        setFile(event.dataTransfer.files[0]);
      }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        setFile(event.target.files[0]);
      }
    };

    const Component = "div";

    const handleChildren = () => {
      if (isLoading) {
        return (
          <Box alignment="center">
            <Loading />
            <Text variant="bodyMd">{loadingText}</Text>
          </Box>
        );
      }

      return (
        <Box alignment="center">
          {file && !isLoading ? (
            <>
              <CheckIcon style={{ color: "#0D6CE9" }} width={54} height={54} />
              <Text variant="bodyMd" style={{ color: "#0D6CE9" }}>
                {file.name}
              </Text>
              <br />
            </>
          ) : (
            <>
              <UploadIcon color="#757575" />
              <Text variant="bodyMd" style={{ color: "#0D6CE9" }}>
                {title}
              </Text>
            </>
          )}

          <Text variant="bodyMd">{description}</Text>
        </Box>
      );
    };

    return (
      <Component
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
        className={`
        ${styles["upload"]}
        ${className}
        ${isBlurry ? styles["upload__blurry"] : ""}
        ${isFullWidth ? styles["upload__full__width"] : ""}
      `}
        {...props}
      >
        <input
          ref={textInputRef}
          id="file-input"
          type="file"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        {handleChildren()}
      </Component>
    );
  }
);

Upload.displayName = "Upload";

export { Upload };
