import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AddRtoStep1 from './AddRtoStep1';
import AddRtoStep2 from './AddRtoStep2';
import AddRtoStep3 from './AddRtoStep3';
import AddRtoStep4 from './AddRtoStep4';
import AddRtoStep5 from './AddRtoStep5';

export default function AddRtoWizard({ onCancel, onComplete, onCreateRto }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    rtoName: '',
    rtoCode: '',
    rtoType: 'Registered Training Organisation',
    cricosCode: '',
    abn: '12 345 678 901',
    acn: '',
    website: 'https://www.example.edu.au',
    yearEstablished: '2015',
    shortDescription: 'Leading training provider across vocational sectors.',
    // Step 2: Contact Details
    contactName: 'Sarah Mitchell',
    contactEmail: 'sarah.mitchell@aiglobal.edu.au',
    contactTitle: 'Partnership Manager',
    contactDepartment: 'Industry Partnerships',
    contactPhone: '+61 3 9123 4567',
    contactDirectLine: '+61 3 9123 4568',
    contactMobile: '+61 412 345 678',
    contactFax: '',
    // Step 3: Address & Location
    addressLine1: '12 Collins Street',
    addressLine2: 'Level 12',
    suburb: 'Melbourne',
    state: 'Victoria (VIC)',
    postcode: '3000',
    country: 'Australia',
    // Step 4: Partnership Details
    partnershipSince: '15 February 2023',
    partnershipRtoType: 'Registered Training Organisation',
    registrationNumber: 'RTO-45087',
    issuingAuthority: 'Australian Skills Quality Authority (ASQA)'
  });
  const totalSteps = 5;

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
        <AddRtoStep2 {...stepProps} />
      )}
      {currentStep === 3 && (
        <AddRtoStep3 {...stepProps} />
      )}
      {currentStep === 4 && (
        <AddRtoStep4 {...stepProps} />
      )}
      {currentStep === 5 && (
        <AddRtoStep5 {...stepProps} onSubmit={submit} />
      )}
    </>
  );
}