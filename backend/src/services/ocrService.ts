import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Runs Tesseract OCR on an image file.
 * Supports Tamil + English bilingual OCR.
 * Falls back gracefully if Tesseract is not installed.
 */
export async function runOCR(filePath: string, mimeType: string): Promise<string> {
  // For PDFs we just return empty and let Gemini handle it visually
  if (mimeType === 'application/pdf') {
    return await ocrPDF(filePath);
  }

  return await ocrImage(filePath);
}

async function ocrImage(imagePath: string): Promise<string> {
  // Check if Tesseract is available
  const tesseractAvailable = await checkTesseract();
  if (!tesseractAvailable) {
    console.warn('Tesseract not installed — skipping OCR, Gemini will handle image directly');
    return '';
  }

  const outputBase = imagePath + '_ocr_out';

  try {
    // Try Tamil + English first
    await execAsync(`tesseract "${imagePath}" "${outputBase}" -l eng+tam --psm 6`);
  } catch {
    try {
      // Fallback to English only
      await execAsync(`tesseract "${imagePath}" "${outputBase}" -l eng --psm 6`);
    } catch (err) {
      console.warn('Tesseract OCR failed:', err);
      return '';
    }
  }

  const outputFile = outputBase + '.txt';
  if (fs.existsSync(outputFile)) {
    const text = fs.readFileSync(outputFile, 'utf-8');
    fs.unlinkSync(outputFile); // clean up
    return text.trim();
  }

  return '';
}

async function ocrPDF(pdfPath: string): Promise<string> {
  // Try pdftotext first (fast and clean for digital PDFs)
  try {
    const { stdout } = await execAsync(`pdftotext "${pdfPath}" -`);
    if (stdout && stdout.trim().length > 50) {
      return stdout.trim();
    }
  } catch {
    // pdftotext not available
  }

  // For scanned PDFs: convert pages to images, then OCR each page.
  const tesseractAvailable = await checkTesseract();
  if (!tesseractAvailable) return '';

  const outputPrefix = pdfPath + '_page';
  try {
    await execAsync(`pdftoppm -r 200 -png "${pdfPath}" "${outputPrefix}"`);
    const dir = path.dirname(pdfPath);
    const base = path.basename(outputPrefix);
    const pageImages = fs.readdirSync(dir)
      .filter(file => file.startsWith(base) && file.endsWith('.png'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .slice(0, Number(process.env.PDF_OCR_MAX_PAGES || 10))
      .map(file => path.join(dir, file));

    const pages: string[] = [];
    for (const imagePath of pageImages) {
      const text = await ocrImage(imagePath);
      if (text) pages.push(text);
      fs.unlinkSync(imagePath);
    }

    return pages.join('\n\n').trim();
  } catch (err) {
    console.warn('PDF OCR failed:', err);
  }

  return '';
}

async function checkTesseract(): Promise<boolean> {
  try {
    await execAsync('tesseract --version');
    return true;
  } catch {
    return false;
  }
}
