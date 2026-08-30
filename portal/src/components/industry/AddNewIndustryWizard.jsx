import React, { useState } from 'react';
import AddNewIndustryStep1 from './AddNewIndustryStep1';
import AddNewIndustryStep2 from './AddNewIndustryStep2';
import AddNewIndustryStep3 from './AddNewIndustryStep3';
import AddNewIndustryStep4 from './AddNewIndustryStep4';
import AddNewIndustryStep5 from './AddNewIndustryStep5';
import IndustryStepWizard from './IndustryStepWizard';

export default function AddNewIndustryWizard({ onCancel, onComplete, onCreateIndustry }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 — Basic Information
    industryName: '',
    industryCode: '',
    industryType: '',
    website: '',
    abn: '',
    shortDescription: '',
    // Step 2 — Contact Details
    contactPersonName: '',
    contactJobTitle: '',
    contactEmail: '',
    contactPhone: '',
    contactMobile: '',
    contactAltEmail: '',
    contactDepartment: '',
    contactPreference: 'Email',
    bestTimeToContact: '09:00 AM – 05:00 PM (AEST)',
    // Step 3 — Address
    address: '',
    addressLine2: '',
    suburb: '',
    state: '',
    postCode: '',
    country: 'Australia',
  });
  const [step1Errors, setStep1Errors] = useState({});
  const totalSteps = 5;

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Step 1 validation — industry name, type, contact info, address are mandatory
  const validateStep1 = () => {
    const errors = {};
    if (!formData.industryName?.trim()) errors.industryName = 'Industry name is required';
    if (!formData.industryType?.trim()) errors.industryType = 'Industry type is required';
    return errors;
  };

  const nextStep = (validationErrors) => {
    // If caller passes errors (from step 1), show them and block
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      setStep1Errors(validationErrors);
      return;
    }
    setStep1Errors({});
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const validateRequiredFields = () => {
    const errors = {};

    if (!formData.industryName?.trim()) errors.industryName = 'Industry name is required';
    if (!formData.industryType?.trim()) errors.industryType = 'Industry type is required';
    if (!formData.contactPersonName?.trim()) errors.contactPersonName = 'Contact person name is required';
    if (!formData.contactEmail?.trim()) errors.contactEmail = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())) errors.contactEmail = 'Enter a valid email address';
    if (!formData.contactPhone?.trim()) errors.contactPhone = 'Phone number is required';
    if (!formData.address?.trim()) errors.address = 'Address is required';
    if (!formData.suburb?.trim()) errors.suburb = 'Suburb / City is required';
    if (!formData.state?.trim()) errors.state = 'State is required';

    return errors;
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleStep1Next = () => {
    const errors = validateStep1();
    if (Object.keys(errors).length > 0) {
      setStep1Errors(errors);
      return;
    }
    setStep1Errors({});
    setCurrentStep(2);
  };

  const submit = async () => {
    const requiredErrors = validateRequiredFields();
    if (Object.keys(requiredErrors).length > 0) {
      if (!formData.industryName?.trim() || !formData.industryType?.trim()) {
        setCurrentStep(1);
      } else if (!formData.contactPersonName?.trim() || !formData.contactEmail?.trim() || !formData.contactPhone?.trim()) {
        setCurrentStep(2);
      } else if (!formData.address?.trim() || !formData.suburb?.trim() || !formData.state?.trim()) {
        setCurrentStep(3);
      }
      setStep1Errors({
        ...(requiredErrors.industryName ? { industryName: requiredErrors.industryName } : {}),
        ...(requiredErrors.industryType ? { industryType: requiredErrors.industryType } : {}),
      });
      return;
    }

    if (onCreateIndustry) {
      try {
        await onCreateIndustry(formData);
      } catch (err) {
        console.error('Failed to create industry:', err);
        return;
      }
    }
    if (onComplete) {
      onComplete();
    }
  };

  const stepProps = {
    currentStep,
    onNext: nextStep,
    onPrev: prevStep,
    onCancel,
    formData,
    updateFormData,
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">
      {/* Step Wizard Progress Bar Header */}
      <IndustryStepWizard currentStep={currentStep} />

      {currentStep === 1 && (
        <AddNewIndustryStep1
          {...stepProps}
          onNext={handleStep1Next}
          externalErrors={step1Errors}
        />
      )}
      {currentStep === 2 && <AddNewIndustryStep2 {...stepProps} />}
      {currentStep === 3 && <AddNewIndustryStep3 {...stepProps} />}
      {currentStep === 4 && <AddNewIndustryStep4 {...stepProps} />}
      {currentStep === 5 && <AddNewIndustryStep5 {...stepProps} formData={formData} onSubmit={submit} />}
    </div>
  );
}
