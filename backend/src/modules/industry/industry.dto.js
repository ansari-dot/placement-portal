import { z } from 'zod';

export const AUSTRALIAN_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

export const STATE_NAME_TO_CODE = {
  'ACT': 'ACT',
  'AUSTRALIAN CAPITAL TERRITORY': 'ACT',
  'NSW': 'NSW',
  'NEW SOUTH WALES': 'NSW',
  'NT': 'NT',
  'NORTHERN TERRITORY': 'NT',
  'QLD': 'QLD',
  'QUEENSLAND': 'QLD',
  'SA': 'SA',
  'SOUTH AUSTRALIA': 'SA',
  'TAS': 'TAS',
  'TASMANIA': 'TAS',
  'VIC': 'VIC',
  'VICTORIA': 'VIC',
  'WA': 'WA',
  'WESTERN AUSTRALIA': 'WA',
};

export const normalizeAndValidateState = (inputState, isRequired = false) => {
  if (!inputState || !String(inputState).trim()) {
    return isRequired
      ? { valid: false, code: '', error: 'State is required' }
      : { valid: true, code: '' };
  }
  const raw = String(inputState).trim();
  const upper = raw.toUpperCase();
  if (AUSTRALIAN_STATES.includes(upper)) return { valid: true, code: upper };
  for (const [key, code] of Object.entries(STATE_NAME_TO_CODE)) {
    if (upper === key || upper.includes(`(${code})`) || upper.startsWith(code + ' ') || upper.startsWith(key)) {
      return { valid: true, code };
    }
  }
  return { valid: false, code: raw, error: `Invalid Australian state/territory "${raw}". Must be one of: ${AUSTRALIAN_STATES.join(', ')}` };
};

export const createIndustrySchema = z.object({
  industryName: z.string().trim().min(1, 'Industry Name is required'),
  industryCode: z.string().trim().optional(),
  industryType: z.string().trim().min(1, 'Industry Type is required'),
  contactPersonName: z.string().trim().min(1, 'Contact Person Name is required'),
  contactEmail: z.string().trim().email('Valid Email Address is required'),
  contactPhone: z.string().trim().min(1, 'Phone Number is required'),
  contactJobTitle: z.string().trim().optional().default(''),
  address: z.string().trim().min(1, 'Address is required'),
  suburb: z.string().trim().optional().default(''),
  state: z.string().trim().optional().default(''),
  postCode: z.string().trim().optional().default(''),
  country: z.string().trim().optional().default('Australia'),
  abn: z.string().trim().optional().default(''),
  website: z.string().trim().optional().default(''),
  shortDescription: z.string().trim().optional().default(''),
  industryCategory: z.enum(['Partner', 'Random']).optional().default('Random'),
  onboardedByName: z.string().trim().optional(),
  onboardedBy: z.string().trim().nullable().optional(),
  partnershipInfo: z.string().trim().optional().default(''),
  documents: z.array(z.any()).optional().default([]),
});

export const updateIndustrySchema = createIndustrySchema.partial().extend({
  name: z.string().trim().optional(),
  sector: z.string().trim().optional(),
  code: z.string().trim().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  location: z.string().trim().optional(),
});
