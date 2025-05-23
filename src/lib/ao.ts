import { connect } from "@permaweb/aoconnect";
import { defaultConfig } from "~tokens/aoTokens/config";

const __DEV__ = process.env.NODE_ENV === "development";

const logger = {
  debug: (...args: any[]) => {
    if (__DEV__) console.debug(...args);
  },
  error: (...args: any[]) => {
    if (__DEV__) console.error(...args);
  },
};

export type DryRunResult = {
  Output: any;
  Messages: any[];
  Spawns: any[];
  Error?: any;
};

export const joinUrl = ({ url, path }: { url: string; path: string }) => {
  if (!path) return url;

  // Create a URL object
  const urlObj = new URL(url);

  // Remove leading slash from path if present
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  // Ensure the URL object's pathname ends with a slash if it's not empty
  urlObj.pathname = urlObj.pathname.replace(/\/?$/, "/");

  // Join the normalized path
  urlObj.pathname += normalizedPath;

  return urlObj.toString();
};

export function removeUnicodeFromError(error: string): string {
  //The regular expression /[\u001b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g is designed to match ANSI escape codes used for terminal formatting. These are sequences that begin with \u001b (ESC character) and are often followed by [ and control codes.
  const ESC = String.fromCharCode(27); // Represents '\u001b' or '\x1b'
  return error
    .replace(new RegExp(`${ESC}[\\[\\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]`, "g"), "")
    .trim();
}

export function errorMessageFromOutput(output: {
  Error?: string;
  Messages?: { Tags?: { name: string; value: string }[] }[];
}): string | undefined {
  const errorData = output.Error;

  // Attempt to extract error details from Messages.Tags if Error is undefined
  const error = errorData ?? output.Messages?.[0]?.Tags?.find((tag) => tag.name === "Error")?.value;

  if (error !== undefined) {
    // Consolidated regex to match and extract line number and AO error message or Error Tags
    const match = error.match(/\[string "aos"]:(\d+):\s*(.+)/);
    if (match) {
      const [, lineNumber, errorMessage] = match;
      const cleanError = removeUnicodeFromError(errorMessage);
      return `${cleanError.trim()} (line ${lineNumber.trim()})`.trim();
    }
    // With no match, just remove unicode
    return removeUnicodeFromError(error);
  }

  return undefined;
}

export function safeDecode<R = unknown>(data: any): R {
  try {
    return JSON.parse(data);
  } catch (e) {
    return data as R;
  }
}

export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class WriteInteractionError extends BaseError {}

export class AOProcess {
  private processId: string;
  private ao: ReturnType<typeof connect>;

  constructor({ processId }: { processId: string }) {
    this.processId = processId;
    this.ao = connect({
      GRAPHQL_URL: joinUrl({
        url: defaultConfig.GATEWAY_URL!,
        path: "graphql",
      }),
      ...defaultConfig,
      CU_URL: "https://cu.ardrive.io",
    });
  }

  private isMessageDataEmpty(messageData: string | null | undefined): boolean {
    return (
      messageData === undefined ||
      messageData === "null" || // This is what the CU returns for 'nil' values that are json.encoded
      messageData === "" ||
      messageData === null
    );
  }

  async read<K>({
    tags,
    retries = 3,
    fromAddress,
  }: {
    tags?: Array<{ name: string; value: string }>;
    retries?: number;
    fromAddress?: string;
  }): Promise<K> {
    logger.debug(`Evaluating read interaction on process`, {
      tags,
      processId: this.processId,
    });
    // map tags to inputs
    const dryRunInput = {
      process: this.processId,
      tags,
    };
    if (fromAddress !== undefined) {
      // @ts-ignore
      dryRunInput["Owner"] = fromAddress;
    }

    let attempts = 0;
    let result: DryRunResult | undefined = undefined;

    while (attempts < retries) {
      try {
        result = await this.ao.dryrun(dryRunInput);
        // break on successful return of result
        break;
      } catch (error: any) {
        attempts++;
        logger.debug(`Read attempt ${attempts} failed`, {
          error: error?.message,
          stack: error?.stack,
          tags,
          processId: this.processId,
        });

        if (attempts >= retries) {
          logger.debug(`Maximum read attempts exceeded`, {
            error: error?.message,
            stack: error?.stack,
            tags,
            processId: this.processId,
            ao: JSON.stringify(this.ao),
          });
          throw new Error(`Failed to evaluate a dry-run on process ${this.processId}.`);
        }

        // exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempts * 1000));
      }
    }

    if (result === undefined) {
      throw new Error("Unexpected error when evaluating read interaction");
    }

    logger.debug(`Read interaction result`, {
      result,
      processId: this.processId,
    });

    const error = errorMessageFromOutput(result);
    if (error !== undefined) {
      throw new Error(error);
    }

    if (result.Messages === undefined || result.Messages.length === 0) {
      logger.debug(`Empty result - process ${this.processId} does not support provided action.`, {
        result,
        tags,
        processId: this.processId,
      });
      throw new Error(`Process ${this.processId} does not support provided action.`);
    }
    const messageData = result.Messages?.[0]?.Data;

    // return undefined if no data is returned
    if (this.isMessageDataEmpty(messageData)) {
      return undefined as K;
    }

    const response: K = safeDecode<K>(messageData);
    return response;
  }
}
