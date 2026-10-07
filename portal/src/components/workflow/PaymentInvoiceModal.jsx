import React, { useState } from 'react';
import { FileText, Printer, CheckCircle2, X, Building2, Send, DollarSign } from 'lucide-react';
import logo1 from '../../assets/logo1.png';

export default function PaymentInvoiceModal({
  isOpen,
  onClose,
  payments = [],
  onConfirmStatusUpdate,
}) {
  const [gstEnabled, setGstEnabled] = useState(false);
  const [customPercentages, setCustomPercentages] = useState({});
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !payments || payments.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      const d = new Date();
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateString;
    }
  };

  // Group payments by RTO
  const rtoGroups = payments.reduce((acc, p) => {
    const rKey = (p.rto || 'Unassigned RTO').trim();
    if (!acc[rKey]) acc[rKey] = [];
    acc[rKey].push(p);
    return acc;
  }, {});

  const handlePercentageChange = (paymentId, pct) => {
    setCustomPercentages((prev) => ({
      ...prev,
      [paymentId]: Number(pct),
    }));
  };

  const handleSendOrGenerate = async () => {
    if (!onConfirmStatusUpdate) return;
    try {
      setIsSending(true);
      const selections = payments.map((p) => {
        const pId = p._id || p.id;
        const chosenPct = customPercentages[pId] !== undefined ? customPercentages[pId] : (p.chargePercentage ?? 100);
        return {
          paymentId: pId,
          chargePercentage: chosenPct,
        };
      });
      await onConfirmStatusUpdate(selections, gstEnabled);
    } catch (err) {
      console.error('Invoice modal send error:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static select-none">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 print:shadow-none print:border-none print:w-full print:max-w-none print:my-0">
        
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/30 text-blue-300 rounded-lg border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {Object.keys(rtoGroups).length > 1
                  ? `Separate RTO Invoices (${Object.keys(rtoGroups).length} RTOs, ${payments.length} Students)`
                  : `Tax Invoice Preview (${payments.length} Student${payments.length > 1 ? 's' : ''})`}
              </h2>
              <p className="text-[11px] text-slate-400">Web Mantis PTY LTD Billing Statement & Remittance</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* GST Toggle Control */}
            <label className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={gstEnabled}
                onChange={(e) => setGstEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-500 rounded cursor-pointer"
              />
              <span className="text-slate-200">Include 10% GST</span>
            </label>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Download / Print PDF</span>
            </button>

            {onConfirmStatusUpdate && (
              <button
                onClick={handleSendOrGenerate}
                disabled={isSending}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'Sending Invoices...' : 'Send Invoice'}</span>
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

        {/* Individual Percentage Selection Bar (Hidden on Print) */}
        {payments.length > 1 && (
          <div className="bg-slate-50 border-b border-slate-200 p-4 print:hidden space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Bulk Invoice: Individual Student Payment Percentage Selection
              </span>
              <span className="text-[11px] text-slate-500">
                Adjust percentage individually per student before generating/sending invoice.
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-40 overflow-y-auto pr-1">
              {payments.map((p, i) => {
                const pId = p._id || p.id;
                const currentPct = customPercentages[pId] !== undefined ? customPercentages[pId] : (p.chargePercentage ?? 100);
                return (
                  <div key={pId || i} className="bg-white p-2 px-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[130px]">{p.studentName}</span>
                    <select
                      value={currentPct}
                      onChange={(e) => handlePercentageChange(pId, e.target.value)}
                      className="px-2 py-1 bg-slate-50 border border-slate-300 rounded font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      <option value="100">100%</option>
                      <option value="50">50%</option>
                      <option value="30">30%</option>
                      <option value="0">0%</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Printable Invoices (Grouped by RTO) */}
        <div className="p-8 space-y-12 bg-white text-slate-800 text-xs print:p-6 print:space-y-8">
          {Object.entries(rtoGroups).map(([rtoName, groupPayments], groupIdx) => {
            const firstItem = groupPayments[0] || {};
            const spokesperson = firstItem.spokesperson || firstItem.rtoSpokesperson || 'Sharon';
            const cleanId = String(firstItem.studentId || firstItem._id || groupIdx + 1).replace(/[^a-zA-Z0-9]/g, '').slice(-2) || '51';
            const yearSuffix = String(new Date().getFullYear()).slice(-2);
            const invoiceNumber = firstItem.invoiceNumber || `WM-${51 + groupIdx}-${yearSuffix}`;
            const invoiceDateStr = formatDate(firstItem.invoiceGeneratedDate || new Date());

            let groupSubtotal = 0;
            const itemCalculations = groupPayments.map((p) => {
              const pId = p._id || p.id;
              const chosenPct = customPercentages[pId] !== undefined ? customPercentages[pId] : (p.chargePercentage ?? 100);
              const orig = p.originalPrice || 500;
              const amt = Number(((orig * chosenPct) / 100).toFixed(2));
              groupSubtotal += amt;
              return {
                studentName: p.studentName,
                service: p.service || 'placement status',
                amount: amt,
                pct: chosenPct,
              };
            });

            const gstAmount = gstEnabled ? Number((groupSubtotal * 0.10).toFixed(2)) : 0;
            const totalAmount = groupSubtotal + gstAmount;

            return (
              <div key={rtoName || groupIdx} className={`${groupIdx > 0 ? 'pt-10 border-t-2 border-dashed border-slate-300 print:page-break-before-always' : ''}`}>
                
                {/* Header & Logo */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-800 pb-5 gap-4">
                  <div className="flex items-start space-x-3">
                    <img src={logo1} alt="Mantis placement logo" className="h-14 object-contain" />
                    <div>
                      <h1 className="text-xl font-black text-slate-900 tracking-tight">INVOICE</h1>
                      <h2 className="text-sm font-bold text-slate-800 mt-0.5">Web Mantis PTY LTD</h2>
                      <p className="text-[11px] text-slate-600">Email: wasiq@mantisplacements.com.au</p>
                      <p className="text-[11px] text-slate-600">Phone: +61 256019134</p>
                      <p className="text-[11px] text-slate-600">Address: 58 Norwest Boulevard Baulkham Hills 2153 NSW</p>
                    </div>
                  </div>

                  <div className="text-right sm:text-right">
                    <div className="bg-slate-900 text-white px-3 py-1 rounded-lg inline-block font-mono text-xs font-bold">
                      Invoice Number: {invoiceNumber}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-1.5">Invoice Date: {invoiceDateStr}</p>
                  </div>
                </div>

                {/* Bill To */}
                <div className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bill To:</span>
                  <p className="text-sm font-bold text-slate-900">{spokesperson}</p>
                  <p className="text-xs font-bold text-blue-900">{rtoName}</p>
                </div>

                {/* Student Services Table */}
                <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden my-4">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4 text-center">Service</th>
                      <th className="py-2.5 px-4 text-right">Amount (AUD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {itemCalculations.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.studentName}
                          {item.pct < 100 && (
                            <span className="ml-2 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                              ({item.pct}% charge)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">{item.service}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">{item.amount.toFixed(2)}$</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Box */}
                <div className="flex justify-end my-4">
                  <div className="w-full sm:w-1/2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-right">
                    {gstEnabled && (
                      <>
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>Subtotal (Excl. GST):</span>
                          <span className="font-mono font-semibold">{groupSubtotal.toFixed(2)}$</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>GST (10%):</span>
                          <span className="font-mono font-semibold">{gstAmount.toFixed(2)}$</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-300 pt-2">
                      <span>Total:</span>
                      <span className="font-mono text-blue-700">{totalAmount.toFixed(2)}$</span>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1.5">
                  <h4 className="font-bold text-blue-900 text-xs">Bank Details:</h4>
                  <p className="font-bold">NAB Business Everyday Account</p>
                  <p>Title: Webmantis Pty Ltd</p>
                  <p className="font-mono font-semibold">BSB: 082-356</p>
                  <p className="font-mono font-semibold">Account Number: 227902359</p>
                  <div className="pt-2 border-t border-blue-200/80 flex items-center space-x-4 text-[11px] font-semibold text-blue-800">
                    <span>ACN 691 274 923</span>
                    <span>ABN 12 691 274 923</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Modal Bottom Action Bar (Hidden on Print) */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-600 font-medium">
            Total Charge Across All RTOs: <span className="font-bold text-slate-900 font-mono">${payments.reduce((s, p) => s + (p.paymentAmount || 0), 0).toFixed(2)} AUD</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleSendOrGenerate}
              disabled={isSending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Confirm & Send Invoices'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
