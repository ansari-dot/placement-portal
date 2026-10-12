import { InvoiceService } from './invoice.service.js';
import logger from '../../core/utils/logger.js';

export const bulkGenerateInvoiceController = async (req, res, next) => {
  try {
    const result = await InvoiceService.bulkGenerateInvoice(req.body, req.user);
    return res.status(200).json({
      success: true,
      message: result.confirmationMessages.join('\n'),
      confirmationMessages: result.confirmationMessages,
      data: {
        invoicesCount: result.invoicesCount,
        studentsCount: result.studentsCount,
        invoices: result.invoices,
      },
    });
  } catch (error) {
    logger.error(`bulkGenerateInvoiceController error: ${error.message}`);
    return next ? next(error) : res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

export const downloadInvoicePDFController = async (req, res, next) => {
  try {
    const { invoiceNumber } = req.params;
    const pdfBuffer = await InvoiceService.getInvoicePDFBuffer(invoiceNumber);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (error) {
    logger.error(`downloadInvoicePDFController error: ${error.message}`);
    return next ? next(error) : res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const retrySendInvoiceEmailController = async (req, res, next) => {
  try {
    const { invoiceNumber } = req.params;
    const sendResult = await InvoiceService.retrySendInvoiceEmail(invoiceNumber);

    const targetEmail = sendResult.recipientEmail || 'RTO inbox';

    if (sendResult.sent) {
      return res.status(200).json({
        success: true,
        message: `Invoice ${invoiceNumber} re-sent successfully to ${targetEmail}.`,
        data: sendResult,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Invoice email delivery failed: ${sendResult.message}`,
        data: sendResult,
      });
    }
  } catch (error) {
    logger.error(`retrySendInvoiceEmailController error: ${error.message}`);
    return next ? next(error) : res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getAllInvoicesController = async (req, res, next) => {
  try {
    const result = await InvoiceService.getAllInvoices(req.query);
    return res.status(200).json({
      success: true,
      data: result.invoices,
      pagination: result.pagination,
    });
  } catch (error) {
    return next ? next(error) : res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getInvoiceByNumberController = async (req, res, next) => {
  try {
    const invoice = await InvoiceService.getInvoiceByNumber(req.params.invoiceNumber);
    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    return next ? next(error) : res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
