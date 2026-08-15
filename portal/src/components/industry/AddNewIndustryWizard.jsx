import React, { useState } from 'react';
import AddNewIndustryStep1 from './AddNewIndustryStep1';
import AddNewIndustryStep2 from './AddNewIndustryStep2';
import AddNewIndustryStep3 from './AddNewIndustryStep3';
import AddNewIndustryStep4 from './AddNewIndustryStep4';
import AddNewIndustryStep5 from './AddNewIndustryStep5';
import IndustryStepWizard from './IndustryStepWizard';

export default function AddNewIndustryWizard({ onCancel, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submit = () => {
    // TODO: Handle industry creation submission
    if (onComplete) {
      onComplete();
    }
  };

  const stepProps = {
    currentStep,
    onNext: nextStep,
    onPrev: prevStep,
    onCancel,
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">
      {/* Step Wizard Progress Bar Header */}
      <IndustryStepWizard currentStep={currentStep} />

      {currentStep === 1 && <AddNewIndustryStep1 {...stepProps} />}
      {currentStep === 2 && <AddNewIndustryStep2 {...stepProps} />}
      {currentStep === 3 && <AddNewIndustryStep3 {...stepProps} />}
      {currentStep === 4 && <AddNewIndustryStep4 {...stepProps} />}
      {currentStep === 5 && <AddNewIndustryStep5 {...stepProps} onSubmit={submit} />}
    </div>
  );
}