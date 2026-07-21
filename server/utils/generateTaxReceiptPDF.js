const { PDFDocument, StandardFonts, rgb, PageSizes } = require('pdf-lib');

const formatINR = (val) => {
  return 'Rs. ' + new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val || 0);
};

async function generateTaxReceiptPDF(taxData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const primaryColor = rgb(0.06, 0.09, 0.16); // #0f172a
  const slateColor = rgb(0.4, 0.45, 0.55);   // #64748b
  const borderColor = rgb(0.85, 0.88, 0.92); // #e2e8f0

  // Outer Border Frame
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderWidth: 2,
    borderColor: primaryColor,
  });

  page.drawRectangle({
    x: 25,
    y: 25,
    width: width - 50,
    height: height - 50,
    borderWidth: 0.5,
    borderColor: slateColor,
  });

  let cursorY = height - 70;

  // Header Title
  const headerSub = 'GOVERNMENT OF INDIA (Academic Prototype)';
  page.drawText(headerSub, {
    x: width / 2 - fontHelveticaBold.widthOfTextAtSize(headerSub, 11) / 2,
    y: cursorY,
    size: 11,
    font: fontHelveticaBold,
    color: primaryColor,
  });

  cursorY -= 24;
  const headerMain = 'GovVerify — Income Tax Filing Receipt';
  page.drawText(headerMain, {
    x: width / 2 - fontHelveticaBold.widthOfTextAtSize(headerMain, 18) / 2,
    y: cursorY,
    size: 18,
    font: fontHelveticaBold,
    color: primaryColor,
  });

  cursorY -= 16;
  page.drawLine({
    start: { x: 50, y: cursorY },
    end: { x: width - 50, y: cursorY },
    thickness: 1,
    color: borderColor,
  });

  cursorY -= 45;

  // Labeled Rows
  const rows = [
    { label: 'Receipt ID', value: taxData.receiptId || '' },
    { label: 'Financial Year', value: taxData.financialYear || '' },
    { label: 'Taxpayer Name', value: taxData.taxpayer?.name || taxData.taxpayerName || 'N/A' },
    { label: 'Taxpayer Email', value: taxData.taxpayer?.email || '' },
    {
      label: 'Filing Date',
      value: taxData.filedAt
        ? new Date(taxData.filedAt).toLocaleDateString('en-IN', { dateStyle: 'full' })
        : new Date().toLocaleDateString('en-IN', { dateStyle: 'full' }),
    },
    { label: 'Annual Income', value: formatINR(taxData.annualIncome) },
    { label: 'Deductions Allowed', value: formatINR(taxData.deductions) },
    { label: 'Net Taxable Income', value: formatINR(taxData.taxableIncome) },
    { label: 'Total Tax Payable', value: formatINR(taxData.taxPayable) },
  ];

  for (const row of rows) {
    if (!row.value) continue;
    page.drawText(row.label, {
      x: 60,
      y: cursorY,
      size: 10,
      font: fontHelveticaBold,
      color: slateColor,
    });

    page.drawText(String(row.value), {
      x: 210,
      y: cursorY,
      size: 10.5,
      font: fontHelvetica,
      color: primaryColor,
    });

    cursorY -= 28;
  }

  // Footer Info
  const footerLine1 = 'This receipt confirms official submission of your income tax return on GovVerify.';
  const footerLine2 = `Receipt ID [${taxData.receiptId || ''}] is stored securely in encrypted GridFS storage.`;

  page.drawText(footerLine1, {
    x: 60,
    y: 125,
    size: 9,
    font: fontHelveticaOblique,
    color: slateColor,
  });

  page.drawText(footerLine2, {
    x: 60,
    y: 108,
    size: 8,
    font: fontHelveticaOblique,
    color: slateColor,
  });

  page.drawLine({
    start: { x: 50, y: 70 },
    end: { x: width - 50, y: 70 },
    thickness: 0.5,
    color: borderColor,
  });

  const copyrightText = '© 2026 GovVerify — Income Tax Self-Service Module';
  page.drawText(copyrightText, {
    x: width / 2 - fontHelvetica.widthOfTextAtSize(copyrightText, 8) / 2,
    y: 50,
    size: 8,
    font: fontHelvetica,
    color: slateColor,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = generateTaxReceiptPDF;
