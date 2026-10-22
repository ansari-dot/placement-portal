import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchRtoById } from '../../api/rtoApi';
import AddRtoStep1 from './AddRtoStep1';
import AddRtoStep2Pricing from './AddRtoStep2Pricing';
import AddRtoStep2 from './AddRtoStep2';
import AddRtoStep3 from './AddRtoStep3';
import AddRtoStep4 from './AddRtoStep4';
import AddRtoStep5 from './AddRtoStep5';

export default function AddRtoWizard({ onCancel, onComplete, onCreateRto, onUpdateRto, initialRto }) {
  const authUser = useSelector((state) => state.auth?.user);
  const [currentStep, setCurrentStep] = useState(1);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [formData, setFormData] = useState({
    // Step 1: Basic Information & Media
    rtoName: '',
    rtoCode: '',
    onboardedByName: authUser?.name || '',
    onboardedBy: authUser?._id || authUser?.id || '',
    paymentCycle: 'Placement',
    payoutRate: '',
    coursePricing: [
      {
        course: 'Individual Support',
        qualification: 'Certificate III',
        pricing: 500,
        notes: 'Standard placement rate'
      }
    ],
    logo: '',
    registrationCertificate: '',
    registrationCertificateName: '',
    documents: [],
    abn: '',
    acn: '',
    website: '',
    yearEstablished: '',
    shortDescription: '',
    // Step 3: Contact Details
    contactName: '',
    contactEmail: '',
    contactTitle: '',
    contactDepartment: '',
    contactPhone: '',
    contactWhatsapp: '',
    contactMobile: '',
    contactFax: '',
    // Step 4: Address & Location
    addressLine1: '',
    addressLine2: '',
    suburb: '',
    state: 'Victoria (VIC)',
    postcode: '',
    country: 'Australia',
    // Step 5: Partnership Details
    partnershipSince: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }),
    registrationNumber: '',
    issuingAuthority: 'Australian Skills Quality Authority (ASQA)'
  });
  const [initializedRtoId] = useState(initialRto?._id || initialRto?.id || null);
  React.useEffect(() => {
    if (!initialRto) return;
    let cancelled = false;
    const apply = (rto) => setFormData((current) => ({
      ...current,
      ...rto,
      rtoName: rto.name || rto.rtoName || '',
      rtoCode: rto.code || rto.rtoCode || '',
      addressLine1: rto.address || rto.addressLine1 || '',
      partnershipSince: rto.partnershipSince || rto.date || current.partnershipSince,
      country: rto.country || 'Australia',
      coursePricing: rto.coursePricing?.length ? rto.coursePricing : current.coursePricing,
      documents: rto.documents || [],
    }));
    apply(initialRto);
    // List responses omit heavy file data; load the full record for editing.
    const id = initialRto._id || initialRto.id;
    if (id) {
      fetchRtoById(id)
        .then((res) => {
          const full = res?.data || res;
          if (!cancelled && full && (full._id || full.id)) apply(full);
        })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [initialRto]);
  const totalSteps = 6;

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
    if (submitError) setSubmitError(null);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      showToast(`Step ${currentStep} completed`);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveDraft = () => {
    showToast('Draft saved successfully');
  };

  const submit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (onCreateRto) {
        if (initializedRtoId && onUpdateRto) {
          await onUpdateRto(initializedRtoId, formData);
        } else {
          await onCreateRto(formData);
        }
      }
      showToast(initializedRtoId ? 'RTO updated successfully!' : 'RTO created successfully!');
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 700);
    } catch (err) {
      console.error('Failed to submit RTO:', err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        (initializedRtoId ? 'Failed to update RTO' : 'Failed to create RTO');
      setSubmitError(errorMsg);
      showToast(errorMsg, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepProps = {
    onCancel,
    onNext: nextStep,
    onPrev: prevStep,
    onSaveDraft: saveDraft,
    formData,
    updateFormData,
    showToast,
    toast,
    step: currentStep,
    totalSteps,
    isEditing: Boolean(initializedRtoId),
    isSubmitting,
    submitError,
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-bounce ${
          toast.isError ? 'bg-rose-900 border border-rose-700' : 'bg-slate-900 border border-slate-700'
        }`}>
          {toast.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {currentStep === 1 && (
        <AddRtoStep1 {...stepProps} />
      )}
      {currentStep === 2 && (
        <AddRtoStep2Pricing {...stepProps} />
      )}
      {currentStep === 3 && (
        <AddRtoStep2 {...stepProps} />
      )}
      {currentStep === 4 && (
        <AddRtoStep3 {...stepProps} />
      )}
      {currentStep === 5 && (
        <AddRtoStep4 {...stepProps} />
      )}
      {currentStep === 6 && (
        <AddRtoStep5 {...stepProps} onSubmit={submit} />
      )}
    </>
  );
}
