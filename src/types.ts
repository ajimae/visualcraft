export interface PDFOptions {
  html: string;
  css?: string;

  // Page settings
  format?: 'A4' | 'A3' | 'Letter' | 'Legal';
  landscape?: boolean;

  // Margins
  margin?: {
    top?: string | number;
    bottom?: string | number;
    left?: string | number;
    right?: string | number;
  };

  // Headers and footers
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;

  // Other options
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
  scale?: number;

  // Advanced
  timeout?: number;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  height?: string | number;
  width?: string | number;
  outline?: boolean;
  pageRanges?: string;
  path?: string;
  tagged?: boolean;
}

export interface PoolOptions {
  maxBrowsers?: number;
  maxPagesPerBrowser?: number;
  browserArgs?: string[];
  onInitialize?: (...args: unknown[]) => Promise<void> | void;
  executablePath?: string;
  logger?: Ilogger;
}

export interface GeneratorOptions extends PoolOptions {
  enablePool?: boolean;
}

export interface Ilogger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}
