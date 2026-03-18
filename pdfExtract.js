import fs from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';

export async function extractPdfText(filePath) {
    const buffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: buffer });

    try {
        const result = await parser.getText();
        console.log(result)
        
        return JSON.stringify(result.text);
    } catch (error) {
        console.error('PDF Extraction failed:', error);
        throw error;
    } finally {
        await parser.destroy();
    }
}


