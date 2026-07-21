const { PDFDocument, StandardFonts, rgb, PageSizes } = require('pdf-lib');

async function generateCertificatePDF(applicationData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(PageSizes.A4); // A4 dimensions: 595.28 x 841.89
  const { width, height } = page.getSize();

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const primaryColor = rgb(0.06, 0.09, 0.16); // #0f172a
  const slateColor = rgb(0.4, 0.45, 0.55);   // #64748b
  const borderColor = rgb(0.85, 0.88, 0.92); // #e2e8f0

  // Outer Formal Border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderWidth: 2,
    borderColor: primaryColor,
  });

  // Inner Subtle Frame Line
  page.drawRectangle({
    x: 25,
    y: 25,
    width: width - 50,
    height: height - 50,
    borderWidth: 0.5,
    borderColor: slateColor,
  });

  let cursorY = height - 70;

  // Header Title Text
  const headerSub = 'GOVERNMENT OF INDIA (Academic Prototype)';
  page.drawText(headerSub, {
    x: width / 2 - fontHelveticaBold.widthOfTextAtSize(headerSub, 11) / 2,
    y: cursorY,
    size: 11,
    font: fontHelveticaBold,
    color: primaryColor,
  });

  cursorY -= 24;
  const headerMain = 'GovVerify — Digital Certificate';
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

  // Clean Labeled Rows
  const rows = [
    { label: 'Certificate Type', value: (applicationData.certificateType || '').toUpperCase() + ' CERTIFICATE' },
    { label: 'Reference ID', value: applicationData.referenceId || '' },
    { label: 'Applicant Name', value: applicationData.applicant?.name || applicationData.applicantName || 'N/A' },
    { label: 'Applicant Email', value: applicationData.applicant?.email || '' },
    {
      label: 'Issue Date',
      value: applicationData.approvedAt
        ? new Date(applicationData.approvedAt).toLocaleDateString('en-IN', { dateStyle: 'full' })
        : new Date().toLocaleDateString('en-IN', { dateStyle: 'full' }),
    },
    { label: 'Reviewed By', value: applicationData.reviewedBy?.name || 'Authorized Review Officer' },
    {
      label: 'Officer Remarks',
      value: applicationData.officerRemarks || 'Verified and approved under digital governance standards.',
    },
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

    page.drawText(row.value, {
      x: 190,
      y: cursorY,
      size: 10.5,
      font: fontHelvetica,
      color: primaryColor,
    });

    cursorY -= 28;
  }

  // Embed QR Code Image in bottom-right corner (~100x100)
  if (applicationData.qrCodeDataUrl) {
    try {
      const base64Data = applicationData.qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(base64Data, 'base64');
      const qrImage = await pdfDoc.embedPng(qrBuffer);

      page.drawImage(qrImage, {
        x: width - 165,
        y: 85,
        width: 105,
        height: 105,
      });
    } catch (qrError) {
      console.error('Failed to embed QR code in PDF:', qrError.message);
    }
  }

  // Footer Note
  const refId = applicationData.referenceId || '';
  const footerLine1 = 'This certificate is blockchain-verified.';
  const footerLine2 = `Scan the QR code or visit the verification portal with reference ID ${refId} to confirm authenticity.`;

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

  const copyrightText = '© 2026 GovVerify — Academic Prototype for Digital Governance';
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

module.exports = generateCertificatePDF;
