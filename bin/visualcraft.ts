#!/usr/bin/env node
import { resolve } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { generatePDF } from '../src/index';

interface CLIArgs {
  input?: string;
  output?: string;
  format?: 'A4' | 'Letter' | 'Legal' | 'A3';
  landscape?: boolean;
  help?: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: CLIArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    } else if (arg === '--input' || arg === '-i') {
      if (i + 1 < args.length) {
        parsed.input = args[++i];
      }
    } else if (arg === '--output' || arg === '-o') {
      if (i + 1 < args.length) {
        parsed.output = args[++i];
      }
    } else if (arg === '--format' || arg === '-f') {
      if (i + 1 < args.length) {
        const format = args[++i];
        if (format === 'A4' || format === 'Letter' || format === 'Legal' || format === 'A3') {
          parsed.format = format;
        }
      }
    } else if (arg === '--landscape' || arg === '-l') {
      parsed.landscape = true;
    }
  }

  return parsed;
}

function showHelp(): void {
  console.log(`
📄 Visualcraft - Fast PDF generation from HTML

Usage:
  visualcraft -i <input.html> -o <output.pdf>

Options:
  -i, --input <file>      Input HTML file (required)
  -o, --output <file>     Output PDF file (default: output.pdf)
  -f, --format <format>   Page format: A4, Letter, Legal, A3 (default: A4)
  -l, --landscape         Use landscape orientation
  -h, --help              Show this help message

Examples:
  visualcraft -i invoice.html -o invoice.pdf
  visualcraft -i report.html -o report.pdf --landscape
  visualcraft -i page.html -f Letter

Documentation:
  https://github.com/ajimae/visualcraft
  `);
}

void (async function (): Promise<void> {
  const args = parseArgs();

  if (args.help || !args.input) {
    showHelp();
    process.exit(args.help ? 0 : 1);
  }

  const inputPath = args.input;
  const outputPath = args.output ?? 'output.pdf';

  try {
    console.log('📄 Reading HTML file...');
    const htmlPath = resolve(process.cwd(), inputPath);
    const html = readFileSync(htmlPath, 'utf-8');

    console.log('🔨 Generating PDF...');
    const startTime = Date.now();

    const pdf = await generatePDF({
      html,
      format: args.format ?? 'A4',
      landscape: args.landscape ?? false,
    });

    const outputFilePath = resolve(process.cwd(), outputPath);
    writeFileSync(outputFilePath, pdf);

    const duration = Date.now() - startTime;
    const size = (pdf.length / 1024).toFixed(2);

    console.log(`✅ PDF generated successfully!`);
    console.log(`   File: ${outputFilePath}`);
    console.log(`   Size: ${size} KB`);
    console.log(`   Time: ${duration}ms`);
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    process.exit(1);
  }
})();

// main().catch((error: unknown) => {
//   console.error('❌ Fatal error:', error);
//   process.exit(1);
// });
