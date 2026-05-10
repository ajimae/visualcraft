import { chromium } from 'playwright-core';
import type { Page } from 'playwright-core';
import { ChromePool } from './chrome-pool';
import type { PDFOptions, GeneratorOptions, Ilogger } from './types';
import { logger } from './utils';

export class PDFGenerator {
  private pool: ChromePool | null = null;
  private enablePool: boolean;
  private executablePath: string | undefined;
  private logger: Ilogger;

  constructor(options: GeneratorOptions = {}) {
    this.enablePool = options.enablePool ?? true;
    this.executablePath = options.executablePath;
    this.logger = Object.assign({}, logger, options.logger) as Ilogger;

    if (this.enablePool) {
      this.pool = new ChromePool({
        maxBrowsers: options.maxBrowsers,
        maxPagesPerBrowser: options.maxPagesPerBrowser,
        browserArgs: options.browserArgs,
        executablePath: options.executablePath,
      });
    }
  }

  async initialize(): Promise<void> {
    if (this.enablePool && this.pool) {
      await this.pool.initialize();
    }
  }

  async generate(options: PDFOptions): Promise<Buffer> {
    const startTime = Date.now();
    const { html, css, executablePath: _exec, timeout, waitUntil, ...pdfOptions } = options;

    let page: Page;

    if (this.pool) {
      page = await this.pool.acquirePage();
    } else {
      const browser = await chromium.launch({
        headless: true,
        timeout: 120000,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-webgl',
          '--disable-webgl2',
        ],
        ...(this.executablePath && { executablePath: this.executablePath }),
      });
      const context = await browser.newContext();
      page = await context.newPage();
    }

    try {
      await page.setContent(this.buildHTML(html, css), {
        waitUntil: waitUntil || 'domcontentloaded',
        timeout: timeout || 30000,
      });

      const pdf = await page.pdf({
        format: pdfOptions.format || 'A4',
        landscape: pdfOptions.landscape || false,
        margin: pdfOptions.margin || { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' },
        printBackground: pdfOptions.printBackground ?? true,
        displayHeaderFooter: pdfOptions.displayHeaderFooter || false,
        headerTemplate: pdfOptions.headerTemplate || '',
        footerTemplate: pdfOptions.footerTemplate || '',
        preferCSSPageSize: pdfOptions.preferCSSPageSize || false,
        scale: pdfOptions.scale || 1,
        height: pdfOptions.height,
        width: pdfOptions.width,
        outline: pdfOptions.outline,
        pageRanges: pdfOptions.pageRanges,
        path: pdfOptions.path,
        tagged: pdfOptions.tagged,
      });

      const duration = Date.now() - startTime;
      this.logger.info(`✅ PDF generated in ${duration}ms`);

      return pdf;
    } finally {
      if (this.pool) {
        await this.pool.releasePage(page);
      } else {
        const browser = page.context().browser();
        if (browser) await browser.close();
      }
    }
  }

  private buildHTML(html: string, css?: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          ${css ? `<style>${css}</style>` : ''}
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
    }
  }

  getStats() {
    return this.pool?.getStats() || null;
  }
}
