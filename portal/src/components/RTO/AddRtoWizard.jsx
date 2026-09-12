import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AddRtoStep1 from './AddRtoStep1';
import AddRtoStep2Pricing from './AddRtoStep2Pricing';
import AddRtoStep2 from './AddRtoStep2';
import AddRtoStep3 from './AddRtoStep3';
import AddRtoStep4 from './AddRtoStep4';
import AddRtoStep5 from './AddRtoStep5';

export default function AddRtoWizard({ onCancel, onComplete, onCreateRto }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    // Step 1: Basic Information & Media
    rtoName: '',
    rtoCode: '',
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
  const totalSteps = 6;

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
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
    if (onCreateRto) {
      try {
        await onCreateRto(formData);
      } catch (err) {
        showToast('Failed to create RTO');
        return;
      }
    }
    showToast('RTO created successfully!');
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 800);
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
    totalSteps
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
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