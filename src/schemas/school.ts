import { z } from 'zod';

// Zod schema for validating new school data
export const NewSchoolSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters long.'),
  adminEmail: z.string().email('Invalid email address for school admin.'),
});
export type NewSchoolData = z.infer<typeof NewSchoolSchema>;
