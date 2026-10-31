import { InvoiceService } from './invoice.service.js';
import InvoiceModel from './invoice.model.js';
import StudentModel from '../student/student.model.js';
import RtoModel from '../rto/rto.model.js';
import PaymentModel from '../payment/payment.model.js';
import { getStudentQueryScope } from '../../core/utils/rbacScope.js';
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

    if (req.user && (req.user.role === 'RTO Manager' || req.user.role === 'RTO')) {
      const studentScope = await getStudentQueryScope(req.user);
      const studentDocs = await StudentModel.find(studentScope, { _id: 1, studentId: 1, assignedRto: 1, institute: 1 }).lean();
      const studentDbIds = new Set(studentDocs.map((s) => String(s._id)));
      const studentBizIds = new Set(studentDocs.map((s) => String(s.studentId)).filter(Boolean));

      let rtoName = req.user.rtoName;
      if (!rtoName && req.user.rtoId) {
        const rtoDoc = await RtoModel.findById(req.user.rtoId).lean();
        if (rtoDoc) rtoName = rtoDoc.name;
      }
      if (!rtoName && req.user.email) {
        const matchedRto = await RtoModel.findOne({ contactEmail: req.user.email.toLowerCase().trim() }).lean();
        if (matchedRto) rtoName = matchedRto.name;
      }
      if (!rtoName && req.user.requestedOrgName) {
        rtoName = req.user.requestedOrgName;
      }

      const rtoNames = new Set(
        [rtoName, ...studentDocs.flatMap((s) => [s.assignedRto, s.institute])]
          .filter(Boolean)
          .map((n) => n.toLowerCase().trim())
      );

      const invoice = await InvoiceModel.findOne({ invoiceNumber }).lean();
      let isAllowed = false;
      if (invoice) {
        if (invoice.rtoName && rtoNames.has(invoice.rtoName.toLowerCase().trim())) {
          isAllowed = true;
        }
        if (!isAllowed && Array.isArray(invoice.items)) {
          for (const item of invoice.items) {
            if (studentBizIds.has(String(item.studentId)) || studentDbIds.has(String(item.paymentId))) {
              isAllowed = true;
              break;
            }
          }
        }
      } else {
        const payments = await PaymentModel.find({ invoiceNumber }).lean();
        if (payments && payments.length > 0) {
          for (const p of payments) {
            if (
              (p.rto && rtoNames.has(p.rto.toLowerCase().trim())) ||
              studentBizIds.has(String(p.studentId)) ||
              studentDbIds.has(String(p.studentId))
            ) {
              isAllowed = true;
              break;
            }
          }
        }
      }

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only download invoices issued to your RTO.',
        });
      }
    }

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
