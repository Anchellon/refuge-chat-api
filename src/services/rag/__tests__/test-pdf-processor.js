const pdfProcessor = require("../pdfProcessor");
const path = require("path");

async function testSinglePDF() {
  console.log("=== Testing PDF Processor on Single File ===\n");

  try {
    // Path to your PDF (data is at root level, same as src)
    const pdfPath = path.join(
      __dirname,
      "../../../../data/pdfs/Food Resources in San Francisco _ SF Service Guide.pdf",
    );
    //                                    ^^^^^^  ^^^^^^  ^^^^^^^^^^^^^^
    //                                    root -> data -> pdfs -> filename

    console.log(`📄 Processing: ${pdfPath}\n`);

    // Process the PDF
    const result = await pdfProcessor.processPDF(pdfPath);

    // Display results
    console.log("✅ Processing Complete!\n");
    console.log("📊 Results:");
    console.log("─".repeat(50));
    console.log(`Filename: ${result.filename}`);
    console.log(`Pages: ${result.numPages}`);
    console.log(`Total Characters: ${result.characterCount.toLocaleString()}`);
    console.log(`\nMetadata:`);
    console.log(`  Title: ${result.metadata.title || "N/A"}`);
    console.log(`  Author: ${result.metadata.author || "N/A"}`);
    console.log(`  Creator: ${result.metadata.creator || "N/A"}`);

    console.log(`\n📄 Page Breakdown:`);
    result.pages.forEach((page) => {
      console.log(
        `  Page ${page.pageNumber}: ${page.characterCount} characters`,
      );
    });

    console.log(`\n📝 First 300 characters of text:`);
    console.log("─".repeat(50));
    console.log(result.fullText.substring(0, 300) + "...");
    console.log("─".repeat(50));

    console.log(`\n📝 Sample from Page 1:`);
    console.log("─".repeat(50));
    console.log(result.pages[0].text.substring(0, 200) + "...");
    console.log("─".repeat(50));
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\nFull error:", error);
  }
}

testSinglePDF();
