import PDFDocument from 'pdfkit';

/**
 * Generates an invoice PDF as a Buffer using PDFKit
 * @param {Object} invoice - Invoice document or object containing rtoSnapshot, items, total, etc.
 * @returns {Promise<Buffer>}
 */
export const generateInvoicePDFBuffer = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#0751a3';
      const textColor = '#1e293b';
      const grayColor = '#64748b';
      const lightBg = '#f8fafc';

      // Header Banner
      doc.rect(40, 40, 515, 75).fill(primaryColor);

      // Header Text
      doc.fillColor('#ffffff')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('INVOICE', 55, 52);

      doc.fontSize(10)
        .font('Helvetica')
        .text('Web Mantis PTY LTD', 55, 78)
        .fontSize(8.5)
        .text('Email: wasiq@mantisplacements.com.au  |  Phone: +61 256019134', 55, 92)
        .text('Address: 58 Norwest Boulevard Baulkham Hills 2153 NSW', 55, 103);

      // Invoice Number & Date (Right Header)
      const dateStr = invoice.invoiceDate
        ? new Date(invoice.invoiceDate).toLocaleDateString('en-AU')
        : new Date().toLocaleDateString('en-AU');

      doc.fillColor('#ffffff')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Invoice #: ${invoice.invoiceNumber || 'WM-51-26'}`, 370, 56, { align: 'right', width: 170 })
        .fontSize(9)
        .font('Helvetica')
        .text(`Date: ${dateStr}`, 370, 75, { align: 'right', width: 170 });

      // Bill To Section
      let y = 135;
      doc.rect(40, y, 515, 55).fill(lightBg).stroke('#e2e8f0');

      const spokesperson = invoice.rtoSnapshot?.spokesperson || invoice.spokesperson || 'RTO Representative';
      const rtoName = invoice.rtoName || invoice.rto || 'Registered Training Organisation';

      doc.fillColor(grayColor)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('BILL TO:', 55, y + 10);

      doc.fillColor(textColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(spokesperson, 55, y + 22);

      doc.fontSize(10)
        .font('Helvetica')
        .fillColor(primaryColor)
        .text(rtoName, 55, y + 36);

      // Table Header
      y += 70;
      doc.rect(40, y, 515, 24).fill('#f1f5f9');

      doc.fillColor('#475569')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Student Name', 55, y + 7)
        .text('Service', 280, y + 7, { width: 130, align: 'center' })
        .text('Amount (AUD)', 420, y + 7, { width: 120, align: 'right' });

      y += 24;
      const items = invoice.items || invoice.rtoPayments || [];

      items.forEach((item, index) => {
        const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, y, 515, 24).fill(rowBg);

        const name = item.studentName || item.name || 'Student';
        const pct = item.chargePercentage ?? item.pct;
        const pctLabel = pct && pct < 100 ? ` (${pct}% charge)` : '';
        const service = item.service || 'Placement status';
        const amount = Number(item.amount || item.paymentAmount || 0).toFixed(2);

        doc.fillColor(textColor)
          .fontSize(9.5)
          .font('Helvetica-Bold')
          .text(name + pctLabel, 55, y + 7)
          .font('Helvetica')
          .fillColor(grayColor)
          .text(service, 280, y + 7, { width: 130, align: 'center' })
          .fillColor(textColor)
          .font('Helvetica-Bold')
          .text(`$${amount}`, 420, y + 7, { width: 120, align: 'right' });

        y += 24;
      });

      // Totals Box
      y += 10;
      const subtotal = Number(invoice.subtotal || invoice.totalAmount || 0).toFixed(2);
      const gstAmount = Number(invoice.gstAmount || 0).toFixed(2);
      const total = Number(invoice.totalAmount || invoice.subtotal || 0).toFixed(2);

      doc.rect(340, y, 215, invoice.gstEnabled ? 65 : 35).fill(lightBg).stroke('#e2e8f0');

      if (invoice.gstEnabled) {
        doc.fillColor(grayColor)
          .fontSize(9)
          .font('Helvetica')
          .text('Subtotal (Excl. GST):', 350, y + 8)
          .text(`$${subtotal}`, 450, y + 8, { align: 'right', width: 95 })
          .text('GST (10%):', 350, y + 24)
          .text(`$${gstAmount}`, 450, y + 24, { align: 'right', width: 95 });

        doc.moveTo(350, y + 40).lineTo(545, y + 40).stroke('#cbd5e1');

        doc.fillColor(textColor)
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Total:', 350, y + 46)
          .fillColor(primaryColor)
          .text(`$${total} AUD`, 430, y + 46, { align: 'right', width: 115 });
        y += 75;
      } else {
        doc.fillColor(textColor)
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Total:', 350, y + 10)
          .fillColor(primaryColor)
          .text(`$${total} AUD`, 430, y + 10, { align: 'right', width: 115 });
        y += 45;
      }

      // Bank Details Card
      doc.rect(40, y, 515, 90).fill('#eff6ff').stroke('#bfdbfe');

      doc.fillColor('#1e40af')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Bank Details:', 55, y + 10);

      doc.fillColor('#1e3a8a')
        .fontSize(9)
        .font('Helvetica')
        .text('NAB Business Everyday Account', 55, y + 26)
        .text('Title: Webmantis Pty Ltd', 55, y + 39)
        .text('BSB: 082-356  |  Account Number: 227902359', 55, y + 52)
        .fontSize(8.5)
        .fillColor('#3b82f6')
        .text('ACN: 691 274 923   |   ABN: 12 691 274 923', 55, y + 68);

      // Footer
      doc.fontSize(8)
        .fillColor('#94a3b8')
        .text('Web Mantis PTY LTD — Thank you for your business.', 40, 780, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
