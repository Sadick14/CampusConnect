/**
 * School Types and Default Configurations
 * 
 * This file defines the different school types, their default classes,
 * and subject templates.
 */

export type SchoolType = 'preschool' | 'primary' | 'jhs' | 'shs';

export interface SchoolTypeConfig {
  id: SchoolType;
  name: string;
  description: string;
  classes: ClassTemplate[];
  subjects: SubjectTemplate[];
}

export interface ClassTemplate {
  name: string;
  displayName: string;
  order: number;
  ageRange?: string;
}

export interface SubjectTemplate {
  name: string;
  code: string;
  category: 'core' | 'elective' | 'activity';
  periodsPerWeek: number;
  description?: string;
}

/**
 * Pre-School Configuration
 * Includes Nursery 1, Nursery 2, Kindergarten 1, Kindergarten 2
 */
export const PRESCHOOL_CONFIG: SchoolTypeConfig = {
  id: 'preschool',
  name: 'Pre-School',
  description: 'Nursery and Kindergarten (Ages 2-5)',
  classes: [
    { name: 'Nursery 1', displayName: 'Nursery 1', order: 1, ageRange: '2-3 years' },
    { name: 'Nursery 2', displayName: 'Nursery 2', order: 2, ageRange: '3-4 years' },
    { name: 'Kindergarten 1', displayName: 'Kindergarten 1 (KG1)', order: 3, ageRange: '4-5 years' },
    { name: 'Kindergarten 2', displayName: 'Kindergarten 2 (KG2)', order: 4, ageRange: '5-6 years' },
  ],
  subjects: [
    { name: 'Literacy & Language', code: 'LIT', category: 'core', periodsPerWeek: 5, description: 'Early reading and writing' },
    { name: 'Numeracy', code: 'NUM', category: 'core', periodsPerWeek: 5, description: 'Early math concepts' },
    { name: 'Creative Arts', code: 'ART', category: 'activity', periodsPerWeek: 3, description: 'Drawing, coloring, crafts' },
    { name: 'Music & Movement', code: 'MUS', category: 'activity', periodsPerWeek: 2, description: 'Songs and rhythmic activities' },
    { name: 'Physical Education', code: 'PE', category: 'activity', periodsPerWeek: 2, description: 'Motor skills development' },
    { name: 'Social Studies', code: 'SOC', category: 'core', periodsPerWeek: 2, description: 'Self and community awareness' },
    { name: 'Science & Nature', code: 'SCI', category: 'core', periodsPerWeek: 2, description: 'Exploration and discovery' },
  ],
};

/**
 * Primary School Configuration
 * Includes Primary 1 through Primary 6
 */
export const PRIMARY_CONFIG: SchoolTypeConfig = {
  id: 'primary',
  name: 'Primary School',
  description: 'Primary 1 - 6 (Ages 6-12)',
  classes: [
    { name: 'Primary 1', displayName: 'Primary 1', order: 1, ageRange: '6-7 years' },
    { name: 'Primary 2', displayName: 'Primary 2', order: 2, ageRange: '7-8 years' },
    { name: 'Primary 3', displayName: 'Primary 3', order: 3, ageRange: '8-9 years' },
    { name: 'Primary 4', displayName: 'Primary 4', order: 4, ageRange: '9-10 years' },
    { name: 'Primary 5', displayName: 'Primary 5', order: 5, ageRange: '10-11 years' },
    { name: 'Primary 6', displayName: 'Primary 6', order: 6, ageRange: '11-12 years' },
  ],
  subjects: [
    { name: 'English Language', code: 'ENG', category: 'core', periodsPerWeek: 6, description: 'Reading, writing, grammar' },
    { name: 'Mathematics', code: 'MATH', category: 'core', periodsPerWeek: 6, description: 'Arithmetic and problem solving' },
    { name: 'Science', code: 'SCI', category: 'core', periodsPerWeek: 4, description: 'Basic science concepts' },
    { name: 'Social Studies', code: 'SOC', category: 'core', periodsPerWeek: 3, description: 'History, geography, civics' },
    { name: 'Religious & Moral Education', code: 'RME', category: 'core', periodsPerWeek: 2, description: 'Values and ethics' },
    { name: 'Creative Arts', code: 'ART', category: 'activity', periodsPerWeek: 2, description: 'Drawing, painting, crafts' },
    { name: 'Physical Education', code: 'PE', category: 'activity', periodsPerWeek: 2, description: 'Sports and fitness' },
    { name: 'ICT', code: 'ICT', category: 'elective', periodsPerWeek: 2, description: 'Computer literacy' },
    { name: 'Ghanaian Language', code: 'GHL', category: 'core', periodsPerWeek: 3, description: 'Local language' },
    { name: 'French', code: 'FRE', category: 'elective', periodsPerWeek: 2, description: 'French language' },
  ],
};

/**
 * Junior High School Configuration
 * Includes JHS 1, JHS 2, JHS 3
 */
export const JHS_CONFIG: SchoolTypeConfig = {
  id: 'jhs',
  name: 'Junior High School',
  description: 'JHS 1 - 3 (Ages 12-15)',
  classes: [
    { name: 'JHS 1', displayName: 'JHS 1', order: 1, ageRange: '12-13 years' },
    { name: 'JHS 2', displayName: 'JHS 2', order: 2, ageRange: '13-14 years' },
    { name: 'JHS 3', displayName: 'JHS 3', order: 3, ageRange: '14-15 years' },
  ],
  subjects: [
    { name: 'English Language', code: 'ENG', category: 'core', periodsPerWeek: 5, description: 'Advanced language skills' },
    { name: 'Mathematics', code: 'MATH', category: 'core', periodsPerWeek: 5, description: 'Algebra, geometry, statistics' },
    { name: 'Integrated Science', code: 'SCI', category: 'core', periodsPerWeek: 5, description: 'Physics, chemistry, biology' },
    { name: 'Social Studies', code: 'SOC', category: 'core', periodsPerWeek: 3, description: 'Citizenship, geography, history' },
    { name: 'Religious & Moral Education', code: 'RME', category: 'core', periodsPerWeek: 2, description: 'Ethics and values' },
    { name: 'Information Technology', code: 'ICT', category: 'core', periodsPerWeek: 3, description: 'Computer studies' },
    { name: 'Ghanaian Language', code: 'GHL', category: 'core', periodsPerWeek: 3, description: 'Local language' },
    { name: 'French', code: 'FRE', category: 'elective', periodsPerWeek: 3, description: 'French language' },
    { name: 'Physical Education', code: 'PE', category: 'activity', periodsPerWeek: 2, description: 'Sports and health' },
    { name: 'Creative Arts', code: 'ART', category: 'elective', periodsPerWeek: 2, description: 'Visual and performing arts' },
    { name: 'Career Technology', code: 'CT', category: 'elective', periodsPerWeek: 3, description: 'Vocational skills' },
    { name: 'Pre-Technical Skills', code: 'PTS', category: 'elective', periodsPerWeek: 3, description: 'Basic technical skills' },
    { name: 'Home Economics', code: 'HE', category: 'elective', periodsPerWeek: 3, description: 'Food and nutrition' },
  ],
};

/**
 * Senior High School Configuration
 * Includes SHS 1, SHS 2, SHS 3
 */
export const SHS_CONFIG: SchoolTypeConfig = {
  id: 'shs',
  name: 'Senior High School',
  description: 'SHS 1 - 3 (Ages 15-18)',
  classes: [
    { name: 'SHS 1', displayName: 'SHS 1', order: 1, ageRange: '15-16 years' },
    { name: 'SHS 2', displayName: 'SHS 2', order: 2, ageRange: '16-17 years' },
    { name: 'SHS 3', displayName: 'SHS 3', order: 3, ageRange: '17-18 years' },
  ],
  subjects: [
    // Core subjects for all students
    { name: 'Core English', code: 'ENG', category: 'core', periodsPerWeek: 5, description: 'Advanced English language' },
    { name: 'Core Mathematics', code: 'MATH', category: 'core', periodsPerWeek: 5, description: 'Core mathematics' },
    { name: 'Integrated Science', code: 'ISCI', category: 'core', periodsPerWeek: 4, description: 'General science' },
    { name: 'Social Studies', code: 'SOC', category: 'core', periodsPerWeek: 3, description: 'Civics and citizenship' },
    
    // Science electives
    { name: 'Elective Mathematics', code: 'EMATH', category: 'elective', periodsPerWeek: 6, description: 'Advanced mathematics' },
    { name: 'Physics', code: 'PHY', category: 'elective', periodsPerWeek: 6, description: 'Physics' },
    { name: 'Chemistry', code: 'CHEM', category: 'elective', periodsPerWeek: 6, description: 'Chemistry' },
    { name: 'Biology', code: 'BIO', category: 'elective', periodsPerWeek: 6, description: 'Biology' },
    
    // Arts/Business electives
    { name: 'Economics', code: 'ECON', category: 'elective', periodsPerWeek: 6, description: 'Economics' },
    { name: 'Business Management', code: 'BUS', category: 'elective', periodsPerWeek: 6, description: 'Business studies' },
    { name: 'Financial Accounting', code: 'ACC', category: 'elective', periodsPerWeek: 6, description: 'Accounting' },
    { name: 'Geography', code: 'GEO', category: 'elective', periodsPerWeek: 6, description: 'Geography' },
    { name: 'History', code: 'HIS', category: 'elective', periodsPerWeek: 6, description: 'History' },
    { name: 'Government', code: 'GOV', category: 'elective', periodsPerWeek: 6, description: 'Government studies' },
    { name: 'Literature in English', code: 'LIT', category: 'elective', periodsPerWeek: 6, description: 'Literature' },
    
    // Other subjects
    { name: 'ICT', code: 'ICT', category: 'elective', periodsPerWeek: 4, description: 'Information technology' },
    { name: 'French', code: 'FRE', category: 'elective', periodsPerWeek: 4, description: 'French language' },
    { name: 'Physical Education', code: 'PE', category: 'activity', periodsPerWeek: 2, description: 'Sports and health' },
  ],
};

/**
 * All school type configurations
 */
export const SCHOOL_TYPE_CONFIGS: Record<SchoolType, SchoolTypeConfig> = {
  preschool: PRESCHOOL_CONFIG,
  primary: PRIMARY_CONFIG,
  jhs: JHS_CONFIG,
  shs: SHS_CONFIG,
};

/**
 * Get classes for selected school types
 */
export function getClassesForSchoolTypes(schoolTypes: SchoolType[]): ClassTemplate[] {
  const classes: ClassTemplate[] = [];
  
  schoolTypes.forEach(type => {
    const config = SCHOOL_TYPE_CONFIGS[type];
    classes.push(...config.classes);
  });
  
  // Sort by order
  return classes.sort((a, b) => a.order - b.order);
}

/**
 * Get subjects for selected school types
 */
export function getSubjectsForSchoolTypes(schoolTypes: SchoolType[]): SubjectTemplate[] {
  const subjectsMap = new Map<string, SubjectTemplate>();
  
  schoolTypes.forEach(type => {
    const config = SCHOOL_TYPE_CONFIGS[type];
    config.subjects.forEach(subject => {
      // Use code as key to avoid duplicates across school types
      const key = `${subject.code}_${type}`;
      if (!subjectsMap.has(key)) {
        subjectsMap.set(key, subject);
      }
    });
  });
  
  return Array.from(subjectsMap.values());
}

/**
 * Get school type display info
 */
export function getSchoolTypeInfo(type: SchoolType): { name: string; description: string; classCount: number; subjectCount: number } {
  const config = SCHOOL_TYPE_CONFIGS[type];
  return {
    name: config.name,
    description: config.description,
    classCount: config.classes.length,
    subjectCount: config.subjects.length,
  };
}

/**
 * Validate school type selection
 */
export function validateSchoolTypes(types: SchoolType[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (types.length === 0) {
    errors.push('Please select at least one school type');
  }
  
  types.forEach(type => {
    if (!SCHOOL_TYPE_CONFIGS[type]) {
      errors.push(`Invalid school type: ${type}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get available school type options with metadata
 */
export function getSchoolTypeOptions() {
  return Object.entries(SCHOOL_TYPE_CONFIGS).map(([key, config]) => ({
    value: key as SchoolType,
    label: config.name,
    description: config.description,
    classCount: config.classes.length,
    subjectCount: config.subjects.length,
    classes: config.classes.map(c => c.name),
  }));
}
