import React from 'react';
import { FileText, Printer, CheckCircle2, X, Download, Building2, Calendar, DollarSign, UserCheck, ShieldCheck } from 'lucide-react';

export default function PaymentInvoiceModal({
  isOpen,
  onClose,
  payments = [],
  onConfirmStatusUpdate,
}) {
  if (!isOpen || !payments || payments.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getInvoiceNumber = (item, index) => {
    const rawId = item.studentId || item._id || item.id || `00${index + 1}`;
    const cleanId = String(rawId).replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase();
    const dateYear = new Date().getFullYear();
    return `INV-${dateYear}-${cleanId}`;
  };

  const totalInvoiceAmount = payments.reduce((sum, item) => sum + (item.paymentAmount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 print:shadow-none print:border-none print:w-full print:max-w-none print:my-0">
        
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/30 text-blue-300 rounded-lg border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {payments.length === 1 ? 'Tax Invoice Preview' : `Bulk Tax Invoices (${payments.length} Students)`}
              </h2>
              <p className="text-[11px] text-slate-400">Official Minimalist Remittance & Billing Statement</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            {onConfirmStatusUpdate && (
              <button
                onClick={onConfirmStatusUpdate}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Status "Invoice Sent"</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-8 space-y-8 bg-white text-slate-800 text-xs print:p-6 print:space-y-6">
          
          {payments.map((p, idx) => {
            const invNum = getInvoiceNumber(p, idx);
            const is30Pct = p.chargePercentage === 30;
            const subtotal = p.paymentAmount || 0;
            const gst = Number((subtotal * 0.10).toFixed(2));
            const totalDue = Number((subtotal + gst).toFixed(2));

            return (
              <div key={p._id || p.id || idx} className={`${idx > 0 ? 'pt-12 border-t-2 border-dashed border-slate-200 print:page-break-before-always' : ''}`}>
                
                {/* Invoice Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                        PP
                      </div>
                      <span className="text-base font-bold text-slate-900 tracking-tight">Placement Portal Services</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Level 4, 100 Collins Street, Melbourne VIC 3000</p>
                    <p className="text-[11px] text-slate-500">ABN: 48 123 456 789 | accounts@placementportal.au</p>
                  </div>

                  <div className="text-right sm:text-right">
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-wider uppercase">TAX INVOICE</h1>
                    <p className="font-mono text-sm font-bold text-blue-600 mt-0.5">{invNum}</p>
                    <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
                      Status: {p.paymentStatus || 'Pending'}
                    </div>
                  </div>
                </div>

                {/* Metadata & Bill To Grid */}
                <div className="grid grid-cols-2 gap-6 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">BILLED TO (RTO):</span>
                    <h3 className="text-sm font-bold text-slate-900">{p.rto || 'Registered Training Organisation'}</h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">Course: <span className="font-semibold text-slate-800">{p.course || 'N/A'}</span></p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">INVOICE DETAILS:</span>
                    <p className="text-[11px] text-slate-600">Issue Date: <span className="font-medium text-slate-900">{formatDate(p.invoiceGeneratedDate)}</span></p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Due Date: <span className="font-medium text-slate-900">{formatDate(p.invoiceGeneratedDate ? new Date(new Date(p.invoiceGeneratedDate).setDate(new Date(p.invoiceGeneratedDate).getDate() + 14)) : new Date(Date.now() + 14*86400000))}</span></p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Placement Ref: <span className="font-mono text-slate-900 font-semibold">{p.placementStatus}</span></p>
                  </div>
                </div>

                {/* Student Details Card */}
                <div className="mb-6 px-4 py-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                      {p.studentName ? p.studentName.charAt(0) : 'S'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-xs">{p.studentName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Student ID: {p.studentId || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Charge Tier</span>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${is30Pct ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {is30Pct ? '30% Charge Rate (Withdrawal / Missed)' : '100% Full Placement Fee'}
                    </span>
                  </div>
                </div>

                {/* Line Items Table */}
                <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden mb-6">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4 text-center">Rate</th>
                      <th className="py-2.5 px-4 text-right">Original Fee</th>
                      <th className="py-2.5 px-4 text-right">Payable Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    <tr>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">Vocational Student Placement Fee</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Placement coordination, site verification, & compliance tracking for {p.studentName}.</div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 font-medium text-[11px]">
                        {p.placementStatus}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {p.chargePercentage}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        AUD ${p.originalPrice?.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        AUD ${p.paymentAmount?.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Subtotals & Total Summary */}
                <div className="flex justify-between items-start border-t border-slate-200 pt-4">
                  {/* Payment Remittance Details */}
                  <div className="w-1/2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">EFT PAYMENT REMITTANCE:</h4>
                    <p className="text-[11px] text-slate-600">Bank: <span className="font-semibold text-slate-800">Commonwealth Bank of Australia</span></p>
                    <p className="text-[11px] text-slate-600">BSB: <span className="font-mono font-semibold text-slate-800">062-000</span></p>
                    <p className="text-[11px] text-slate-600">Account No: <span className="font-mono font-semibold text-slate-800">1234 5678</span></p>
                    <p className="text-[11px] text-slate-600">Payment Reference: <span className="font-mono font-bold text-blue-600">{invNum}</span></p>
                  </div>

                  {/* Calculations */}
                  <div className="w-2/5 space-y-2 text-right">
                    <div className="flex justify-between text-slate-600 text-xs">
                      <span>Subtotal Excl. GST:</span>
                      <span className="font-mono font-medium">AUD ${subtotal.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-xs">
                      <span>GST (10%):</span>
                      <span className="font-mono font-medium">AUD ${gst.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-extrabold text-sm border-t border-slate-300 pt-2">
                      <span>Total Amount Due:</span>
                      <span className="font-mono text-blue-600">AUD ${totalDue.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Terms Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
                  <p>Terms: Payment due within 14 days of invoice date. Thank you for partnering with Placement Portal.</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Controls (Hidden on Print) */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500 font-medium">
            Total Invoiced Amount: <span className="font-bold text-slate-900 font-mono">AUD ${totalInvoiceAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              Close Preview
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-2 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
