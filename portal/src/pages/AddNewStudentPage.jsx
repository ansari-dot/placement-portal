import React, { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

// Import your pre-created components (update paths as needed)
import PersonalInformationForm from '../components/student/PersonalInformationForm';
import EducationDetailsForm from '../components/student/EducationDetailsForm';
import RtoSourceForm from '../components/student/RtoSourceForm';
import AdditionalInformationForm from '../components/student/AdditionalInformationForm';
import ReviewSubmitForm from '../components/student/ReviewSubmitForm';

// Backend API
import { createStudent } from '../api/studentsApi';

const initialFormData = {
  // Personal Information
  firstName: '',
  middleName: '',
  lastName: '',
  preferredName: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  language: '',
  emailAddress: '',
  phoneCode: '+61',
  phoneNumber: '',
  altPhoneCode: '+61',
  alternatePhone: '',
  waPhoneCode: '+61',
  whatsappNumber: '',
  address: '',
  suburb: '',
  state: '',
  postCode: '',
  country: 'Australia',

  // Education Details
  courseQualification: '',
  specialisation: '',
  courseLevel: '',
  studyMode: '',
  enrollmentId: '',
  institute: '',
  campus: '',
  startDate: '',
  expectedEndDate: '',
  currentYearSemester: '',
  attendanceStatus: '',
  academicStatus: '',
  gpa: '',
  previousQualification: '',
  yearOfCompletion: '',
  documents: null,

  // RTO & Source
  assignedRto: '',
  courses: '',
  internshipPriority: '',
  studentSource: '',
  transport: '',
  preferredLocation: '',
  placementRadius: '',
  preferredIndustry: '',
  availabilityDays: {},
  availabilityFrom: '09:00 AM',
  availabilityTo: '05:00 PM',
  willingToRelocate: '',
  placementNotes: '',

  // Additional Information
  visaStatus: '',
  visaSubclass: '',
  visaExpiryDate: '',
  workRights: '',
  workExperience: '',
  englishProficiency: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  heardAboutUs: '',
  hasResume: '',
  resumeFile: null,
  additionalNotes: '',
};

export default function AddNewStudentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const totalSteps = 5;

  const steps = [
    { number: 1, title: 'Personal Information', subtitle: 'Basic details of the student' },
    { number: 2, title: 'Education Details', subtitle: 'Course and education info' },
    { number: 3, title: 'RTO & Source', subtitle: 'RTO and source information' },
    { number: 4, title: 'Additional Information', subtitle: 'Other relevant details' },
    { number: 5, title: 'Review & Submit', subtitle: 'Review and save student' },
  ];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateFields = (fields) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.emailAddress.trim()) newErrors.emailAddress = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) newErrors.emailAddress = 'Enter a valid email';
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.suburb.trim()) newErrors.suburb = 'Suburb is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.postCode.trim()) newErrors.postCode = 'Post code is required';
      if (!formData.country) newErrors.country = 'Country is required';
    } else if (step === 2) {
      if (!formData.courseQualification) newErrors.courseQualification = 'Course is required';
      if (!formData.courseLevel) newErrors.courseLevel = 'Course level is required';
      if (!formData.studyMode) newErrors.studyMode = 'Study mode is required';
      if (!formData.institute.trim()) newErrors.institute = 'Institute is required';
      if (!formData.startDate) newErrors.startDate = 'Start date is required';
      if (!formData.expectedEndDate) newErrors.expectedEndDate = 'Expected end date is required';
      if (!formData.currentYearSemester) newErrors.currentYearSemester = 'Year/Semester is required';
      if (!formData.attendanceStatus) newErrors.attendanceStatus = 'Attendance status is required';
      if (!formData.academicStatus) newErrors.academicStatus = 'Academic status is required';
    } else if (step === 3) {
      if (!formData.assignedRto) newErrors.assignedRto = 'RTO is required';
      if (!formData.courses) newErrors.courses = 'Course is required';
      if (!formData.internshipPriority) newErrors.internshipPriority = 'Priority is required';
      if (!formData.studentSource) newErrors.studentSource = 'Source is required';
      if (!formData.transport) newErrors.transport = 'Transport is required';
      if (Object.keys(formData.availabilityDays).filter(d => formData.availabilityDays[d]).length === 0) {
        newErrors.availabilityDays = 'Select at least one day';
      }
      if (!formData.availabilityFrom) newErrors.availabilityFrom = 'Required';
      if (!formData.availabilityTo) newErrors.availabilityTo = 'Required';
    } else if (step === 4) {
      if (!formData.visaStatus) newErrors.visaStatus = 'Visa status is required';
      if (!formData.hasResume) newErrors.hasResume = 'Please select an option';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === totalSteps) {
      handleSubmit();
      return;
    }
    
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setErrors({});
    setConfirmed(false);
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    if (!confirmed) {
      setErrors({ confirm: 'Please confirm the information is accurate before submitting.' });
      toast.warning('Please confirm the information is accurate before submitting.');
      return;
    }

    setSubmitting(true);
    
    try {
      // Prepare the payload for the backend API
      const payload = { ...formData };

      // Convert empty optional strings to undefined to let backend defaults apply
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') payload[key] = undefined;
      });

      // Date fields need to be in a valid format
      if (payload.dateOfBirth) payload.dateOfBirth = new Date(payload.dateOfBirth);
      if (payload.startDate) payload.startDate = new Date(payload.startDate);
      if (payload.expectedEndDate) payload.expectedEndDate = new Date(payload.expectedEndDate);
      if (payload.visaExpiryDate) payload.visaExpiryDate = new Date(payload.visaExpiryDate);

      const response = await createStudent(payload);
      toast.success(response?.message || 'Student profile created successfully!');
      
      handleCancel();
      navigate('/my-students');
    } catch (err) {
      console.error('Could not save student:', err);
      
      // Handle Zod validation errors from backend
      const backendErrors = err?.response?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        backendErrors.forEach(be => toast.error(`${be.field}: ${be.message}`));
      } else {
        const msg = err?.response?.data?.message || 'There was an error saving the student. Please try again.';
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInformationForm formData={formData} updateField={updateField} errors={errors} />;
      case 2:
        return <EducationDetailsForm formData={formData} updateField={updateField} errors={errors} />;
      case 3:
        return <RtoSourceForm formData={formData} updateField={updateField} updateFields={updateFields} errors={errors} />;
      case 4:
        return <AdditionalInformationForm formData={formData} updateField={updateField} errors={errors} />;
      case 5:
        return <ReviewSubmitForm formData={formData} onEdit={setCurrentStep} confirmed={confirmed} setConfirmed={setConfirmed} />;
      default:
        return <PersonalInformationForm formData={formData} updateField={updateField} errors={errors} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 ml-52 flex flex-col min-w-0">
        
        {/* TOP HEADER */}
        <Header title="Add New Student" breadcrumbs={['Dashboard', 'My List', 'Add New Student']} />

        {/* PAGE CONTENT CONTAINER */}
        <main className="p-4 max-w-[1600px] w-full mx-auto">
          
          {/* MULTI-STEPPER WIZARD HEADER MATCHING THE IMAGE STYLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
              
              {steps.map((step, index) => {
                const isCompleted = currentStep > step.number;
                const isCurrent = currentStep === step.number;

                return (
                  <React.Fragment key={step.number}>
                    <div 
                      className="flex items-center space-x-2.5 group cursor-pointer" 
                      onClick={() => {
                        if (step.number < currentStep) {
                          setCurrentStep(step.number);
                        }
                      }}
                    >
                      {/* Step Indicator Container */}
                      <div className="relative flex items-center">
                        {/* Completed Checkmark Badge (overlapping on the left) */}
                        {isCompleted && (
                          <div className="absolute -left-2 z-10 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        )}

                        {/* Main Step Circle */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                            isCompleted
                              ? 'bg-white text-slate-400 border border-slate-200 pl-1.5'
                              : isCurrent
                              ? 'bg-blue-600 text-white shadow-blue-200'
                              : 'bg-white text-slate-500 border border-slate-200'
                          }`}
                        >
                          {step.number}
                        </div>
                      </div>

                      {/* Step Text Labels */}
                      <div>
                        <h4 className={`text-[11px] font-bold transition-colors ${isCurrent ? 'text-blue-600' : 'text-slate-900'}`}>
                          {step.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">{step.subtitle}</p>
                      </div>
                    </div>

                    {/* Connecting line between steps */}
                    {index < steps.length - 1 && (
                      <div className="hidden xl:block flex-1 h-[2px] bg-slate-200 mx-3 rounded-full" />
                    )}
                  </React.Fragment>
                );
              })}

            </div>
          </div>

          {/* DYNAMIC FORM CONTAINER */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            {renderStepContent()}

            {errors.confirm && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-semibold text-rose-600">
                {errors.confirm}
              </div>
            )}

            {/* FORM FOOTER BUTTONS */}
            <div className="flex items-center justify-end space-x-3 pt-5 mt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="px-5 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              {currentStep > 1 && currentStep < totalSteps && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-blue-600 text-[11px] font-semibold text-white shadow-sm hover:bg-blue-700 transition flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{submitting ? 'Submitting...' : currentStep === totalSteps ? 'Submit Application' : 'Save & Next'}</span>
                {currentStep !== totalSteps && !submitting && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}