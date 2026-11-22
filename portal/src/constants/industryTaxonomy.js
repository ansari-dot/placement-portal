// Standardized Industry Taxonomy for Mantis Placement Portal
// Matches client specification for Placement Sites and dynamic Industry Types

export const PLACEMENT_SITES = Object.freeze([
  'Individual Support',
  'Community Services',
  'Education / ECEC',
  'Painting and Decorating',
  'Mental Health',
]);

export const INDUSTRY_TYPES_BY_SITE = Object.freeze({
  'Individual Support': Object.freeze([
    'Aged Care Facility / Nursing Home',
    'Disability Support Services',
    'NDIS Provider',
    'Home Care Services',
    'Community Care Organisation',
    'Residential Care Facility',
  ]),
  'Community Services': Object.freeze([
    'Aged Care Facility / Nursing Home',
    'Disability Support Services',
    'NDIS Provider',
    'Home Care Services',
    'Community Care Organisation',
    'Residential Care Facility',
  ]),
  'Education / ECEC': Object.freeze([
    'Childcare Centre',
    'Daycare / Early Learning Centre',
    'Kindergarten / Preschool',
    'Long Day Care',
    'Family Day Care',
    'Montessori',
  ]),
  'Painting and Decorating': Object.freeze([
    'Painting Contractors',
    'Renovation Companies',
    'Property Maintenance Services',
    'Interior / Exterior Painting Services',
    'Construction Finishing Companies',
  ]),
  'Mental Health': Object.freeze([
    'Mental Health Clinic',
    'Community Health Centre',
    'Counselling Services',
    'Rehabilitation Centres',
    'NGOs (Mental Health Support)',
    'Crisis Support Services',
  ]),
});

export const INDUSTRY_CATEGORIES = Object.freeze([
  'Random',
  'Partner',
]);

export const AUSTRALIAN_STATES = Object.freeze([
  { code: 'NSW', label: 'New South Wales' },
  { code: 'VIC', label: 'Victoria' },
  { code: 'QLD', label: 'Queensland' },
  { code: 'WA',  label: 'Western Australia' },
  { code: 'SA',  label: 'South Australia' },
  { code: 'TAS', label: 'Tasmania' },
  { code: 'ACT', label: 'Australian Capital Territory' },
  { code: 'NT',  label: 'Northern Territory' },
]);
