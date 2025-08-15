import React, { useState, useRef, forwardRef } from "react";
import styles from "./Upload.module.css";
import { Box } from "../box";
import { Text } from "../text";
import { UploadIcon } from "../icon";
import { CheckIcon } from "../icon";
import { Loading } from "../loading";
import type { FileUploadProps } from "./Upload.types";
import prettyBytes from "pretty-bytes";

const Upload = forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      // Default values for props
      placeholder = "Click to upload, or drag and drop",
      fileLabel = "a file",
      loadingText = "Loading...",
      className = "",
      isFullWidth = false,
      isBlurry = false,
      isLoading = false,
      acceptedFileTypes = "application/json",
      maxFileSizeInMB = 10,
      onFileSelect,
      onFileRead,
      onFileParse,
      onError,
      ...props
    },
    ref,
  ) => {
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Convert max file size to bytes
    const maxFileSizeInBytes = maxFileSizeInMB * 1024 * 1024;

    // Handle file validation
    const validateFile = (file: File): boolean => {
      // Check file type if acceptedFileTypes is specified
      if (acceptedFileTypes && !file.type.match(acceptedFileTypes)) {
        setFileError(`File type not supported. Please upload ${acceptedFileTypes} files only.`);
        return false;
      }

      // Check file size
      if (file.size > maxFileSizeInBytes) {
        setFileError(`File size exceeds the limit of ${maxFileSizeInMB}MB.`);
        return false;
      }

      setFileError(null);
      return true;
    };

    // Process the file after selection
    const processFile = (file: File) => {
      if (!validateFile(file)) return;

      setFile(file);

      // Call onFileSelect callback if provided
      if (onFileSelect) {
        onFileSelect(file);
      }

      // Read file content if onFileRead or onFileParse callbacks are provided
      if (onFileRead || onFileParse) {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;

            // Call onFileRead callback if provided
            if (onFileRead) {
              onFileRead(content, file);
            }

            // Parse JSON and call onFileParse callback if provided
            if (onFileParse && file.type === "application/json") {
              const parsedData = JSON.parse(content);
              onFileParse(parsedData, file);
            }
          } catch (error) {
            setFileError("Error reading file. Please try again.");
            if (onError && error instanceof Error) {
              onError(error);
            }
          }
        };

        reader.onerror = (error) => {
          setFileError("Error reading file. Please try again.");
          if (onError) {
            onError(new Error("File reading failed"));
          }
        };

        reader.readAsText(file);
      }
    };

    // Event handlers
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(true);
    };

    const handleDragLeave = () => {
      setDragging(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      if (event.dataTransfer.files && event.dataTransfer.files[0]) {
        processFile(event.dataTransfer.files[0]);
      }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        processFile(event.target.files[0]);
      } else {
        setFile(null);
      }
    };

    const handleClick = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    // Render the component content based on state
    const renderContent = () => {
      if (isLoading) {
        return (
          <Box alignment="center" className={styles.upload__content}>
            <Loading />
            <Text variant="bodyMd">{loadingText}</Text>
          </Box>
        );
      }

      if (fileError) {
        return (
          <Box alignment="center" className={styles.upload__content}>
            <Text variant="bodyMd" style={{ color: "#E53935" }}>
              {fileError}
            </Text>
          </Box>
        );
      }

      return file && !isLoading ? (
        <>
          <CheckIcon style={{ color: "#0D6CE9", width: "54px", height: "54px" }} />
          <Text variant="bodyMd" className={styles.upload__filename}>
            {file.name}
          </Text>
          <Text variant="bodyMd" style={{ fontWeight: "bold" }}>
            {prettyBytes(file.size, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </>
      ) : (
        <>
          <UploadIcon style={{ color: "#757575" }} />
          <Text variant="bodyMd" className={styles.upload__description}>
            {placeholder} {fileLabel}
          </Text>
        </>
      );
    };

    return (
      <div
        ref={ref}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          ${styles.upload}
          ${dragging ? styles.upload__dragging : ""}
          ${isBlurry ? styles.upload__blurry : ""}
          ${isFullWidth ? styles.upload__full__width : ""}
          ${className}
        `}
        {...props}>
        <input
          ref={fileInputRef}
          accept={acceptedFileTypes}
          type="file"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        {renderContent()}
      </div>
    );
  },
);

Upload.displayName = "Upload";

export { Upload };
