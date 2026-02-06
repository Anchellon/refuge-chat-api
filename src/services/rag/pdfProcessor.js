const pdfjs = require("pdfjs-dist/legacy/build/pdf.mjs");
const fs = require("fs").promises; // file system module with promises to read PDF files from disk
const logger = require("../../config/logger");
const { cleanText } = require("./utils/textHelper");

class PDFProcessor {
  /**
   * Extract text from a PDF file
   * @param {string} filepath - Path to the PDF file
   * @returns {Promise<Object>} - Extracted data
   */
  async processPDF(filepath) {
    try {
      logger.info(`Processing PDF: ${filepath}`);

      // Read PDF file
      const dataBuffer = await fs.readFile(filepath);
      const data = new Uint8Array(dataBuffer);

      // Load PDF document (text extraction only)
      const loadingTask = pdfjs.getDocument({
        data,
        useSystemFonts: true,
      });

      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;

      logger.info(`PDF has ${numPages} pages`);

      // Extract metadata
      const metadata = await pdfDocument.getMetadata();

      // Extract text from all pages
      const pages = [];
      let fullText = "";

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);

        // ✅ getTextContent() doesn't need canvas
        const textContent = await page.getTextContent();

        // Combine text items
        const pageText = textContent.items.map((item) => item.str).join(" ");

        const cleanedPageText = cleanText(pageText);

        pages.push({
          pageNumber: pageNum,
          text: cleanedPageText,
          characterCount: cleanedPageText.length,
        });

        fullText += cleanedPageText + "\n\n";
      }

      // Clean the full text
      fullText = cleanText(fullText);

      logger.info(
        `Extracted ${fullText.length} characters from ${numPages} pages`,
      );

      return {
        filepath,
        filename: filepath.split("/").pop(),
        numPages,
        pages,
        fullText,
        characterCount: fullText.length,
        metadata: {
          title: metadata.info?.Title || null,
          author: metadata.info?.Author || null,
          subject: metadata.info?.Subject || null,
          creator: metadata.info?.Creator || null,
          producer: metadata.info?.Producer || null,
          creationDate: metadata.info?.CreationDate || null,
        },
      };
    } catch (error) {
      logger.error(`Error processing PDF ${filepath}: ${error.message}`);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  //   /**
  //    * Extract text from specific page range
  //    * @param {string} filepath - Path to the PDF file
  //    * @param {number} startPage - Starting page (1-indexed)
  //    * @param {number} endPage - Ending page (1-indexed)
  //    */
  //   async extractPageRange(filepath, startPage, endPage) {
  //     try {
  //       const dataBuffer = await fs.readFile(filepath);
  //       const data = new Uint8Array(dataBuffer);

  //       const loadingTask = pdfjs.getDocument({ data });
  //       const pdfDocument = await loadingTask.promise;

  //       const numPages = pdfDocument.numPages;
  //       const actualEndPage = Math.min(endPage, numPages);

  //       const pages = [];

  //       for (let pageNum = startPage; pageNum <= actualEndPage; pageNum++) {
  //         const page = await pdfDocument.getPage(pageNum);
  //         const textContent = await page.getTextContent();

  //         const pageText = textContent.items.map((item) => item.str).join(" ");

  //         pages.push({
  //           pageNumber: pageNum,
  //           text: cleanText(pageText),
  //         });
  //       }

  //       return pages;
  //     } catch (error) {
  //       logger.error(`Error extracting page range: ${error.message}`);
  //       throw error;
  //     }
  //   }

  //   /**
  //    * Get PDF metadata only (fast, no text extraction)
  //    */
  //   async getPDFMetadata(filepath) {
  //     try {
  //       const dataBuffer = await fs.readFile(filepath);
  //       const data = new Uint8Array(dataBuffer);

  //       const loadingTask = pdfjs.getDocument({ data });
  //       const pdfDocument = await loadingTask.promise;

  //       const metadata = await pdfDocument.getMetadata();
  //       const numPages = pdfDocument.numPages;

  //       return {
  //         filepath,
  //         filename: filepath.split("/").pop(),
  //         numPages,
  //         title: metadata.info?.Title || null,
  //         author: metadata.info?.Author || null,
  //         subject: metadata.info?.Subject || null,
  //         creationDate: metadata.info?.CreationDate || null,
  //       };
  //     } catch (error) {
  //       logger.error(`Error getting PDF metadata: ${error.message}`);
  //       throw error;
  //     }
  //   }
}

module.exports = new PDFProcessor();
