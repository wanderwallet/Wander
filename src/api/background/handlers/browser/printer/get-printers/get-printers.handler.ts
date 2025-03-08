import { WANDER_PRINTER_ID } from "~api/background/handlers/browser/printer/printer.constants";

/**
 * Printer info request callback type
 */
type PrinterInfoCallback = (p: chrome.printerProvider.PrinterInfo[]) => void;

/**
 * Returns a list of "virtual" printers,
 * in our case "Print/Publish to Arweave"
 */
export function handleGetPrinters(callback: PrinterInfoCallback) {
  callback([
    {
      id: WANDER_PRINTER_ID,
      // TODO: Add to i18n:
      name: "Print to Arweave",
      description:
        "Publish the content you want to print on Arweave, permanently."
    }
  ]);
}
