import { APP_NAME } from "./constants";

export class Logger {
  static #instances: Map<string, Logger> = new Map();
  #name: string;
  #silent: boolean;

  constructor(name: string, silent: boolean = false) {
    this.#name = name;
    this.#silent = silent;
  }

  get silent() {
    return this.#silent;
  }

  static #getInstance(name: string, silent: boolean = false): Logger {
    if (!Logger.#instances.has(`${name}-${silent}`)) {
      Logger.#instances.set(`${name}-${silent}`, new Logger(name, silent));
    }
    return Logger.#instances.get(`${name}-${silent}`)!;
  }

  static init(name: string, silent: boolean = false) {
    return this.#getInstance(name, silent);
  }

  #logMessage(message: string, prefixNewLine: boolean, suffixNewLine: boolean) {
    if (this.#silent) return;
    const prefix = prefixNewLine ? "\n" : "";
    const suffix = suffixNewLine ? "\n" : "";
    console.log(`${prefix}${message}${suffix}`);
  }

  log(message: string, prefixNewLine = false, suffixNewLine = false) {
    this.#logMessage(`[${this.#name}] ${message}`, prefixNewLine, suffixNewLine);
  }

  success(message: string, prefixNewLine = false, suffixNewLine = false) {
    this.#logMessage(`[${this.#name}] ${message}`, prefixNewLine, suffixNewLine);
  }

  error(message: string, prefixNewLine = false, suffixNewLine = false) {
    this.#logMessage(`[${this.#name}] ${message}`, prefixNewLine, suffixNewLine);
  }

  static log(name: string, message: string, prefixNewLine = false, suffixNewLine = false, silent = false) {
    this.#getInstance(name, silent).log(message, prefixNewLine, suffixNewLine);
  }

  static success(name: string, message: string, prefixNewLine = false, suffixNewLine = false, silent = false) {
    this.#getInstance(name, silent).success(message, prefixNewLine, suffixNewLine);
  }

  static error(name: string, message: string, prefixNewLine = false, suffixNewLine = false, silent = false) {
    this.#getInstance(name, silent).error(message, prefixNewLine, suffixNewLine);
  }
}

export const defaultLogger = Logger.init(APP_NAME);
