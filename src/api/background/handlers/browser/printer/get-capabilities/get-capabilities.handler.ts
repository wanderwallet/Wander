import { WANDER_PRINTER_ID } from "~api/background/handlers/browser/printer/printer.constants";

/**
 * Printer capabilities request callback type
 */
type PrinterInfoCallback = (
  capabilities: chrome.printerProvider.PrinterCapabilities["capabilities"]
) => void;

/**
 * Tells Chrome about the virtual printer's
 * capabilities in CDD format
 */
export function handleGetCapabilities(
  printerId: string,
  callback: PrinterInfoCallback
) {
  // only return capabilities for the Wander printer
  if (printerId !== WANDER_PRINTER_ID) return;

  // mimic a regular printer's capabilities
  callback({
    version: "1.0",
    printer: {
      supported_content_type: [
        { content_type: "application/pdf" },
        { content_type: "image/pwg-raster" }
      ],
      color: {
        option: [
          { type: "STANDARD_COLOR", is_default: true },
          { type: "STANDARD_MONOCHROME" }
        ]
      },
      copies: {
        default_copies: 1,
        max_copies: 100
      },
      media_size: {
        option: [
          {
            name: "ISO_A4",
            width_microns: 210000,
            height_microns: 297000,
            is_default: true
          },
          {
            name: "NA_LETTER",
            width_microns: 215900,
            height_microns: 279400
          }
        ]
      },
      page_orientation: {
        option: [
          {
            type: "PORTRAIT",
            is_default: true
          },
          { type: "LANDSCAPE" },
          { type: "AUTO" }
        ]
      },
      duplex: {
        option: [
          { type: "NO_DUPLEX", is_default: true },
          { type: "LONG_EDGE" },
          { type: "SHORT_EDGE" }
        ]
      }
    }
  });
}
