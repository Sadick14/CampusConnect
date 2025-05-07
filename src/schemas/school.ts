
import { z } from 'zod';

// Zod schema for validating new school data including admin password for auth creation
export const NewSchoolSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters long.'),
  adminEmail: z.string().email('Invalid email address for school admin.'),
  adminPassword: z.string().min(8, 'Admin password must be at least 8 characters long.'), // Added password field
  // adminUid is removed as Auth user is created first now.
});
export type NewSchoolData = z.infer<typeof NewSchoolSchema>;
