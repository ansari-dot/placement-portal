import { z } from 'zod';

export const createNotificationSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  desc: z.string().trim().min(1, 'Description is required'),
  type: z.string().trim().optional().default('system'),
  link: z.string().trim().optional().default(''),
});
