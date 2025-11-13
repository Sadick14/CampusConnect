# School Type Configuration & Subject Management - Complete Guide

## Overview

The School Type Configuration system allows administrators to select their school type(s) and automatically seed appropriate classes and subjects. This eliminates manual data entry and ensures standardized curriculum setup based on educational levels.

## Features Implemented

### ✅ 1. School Type Selection (Multi-Select)

**School Types Available:**
- **Pre-School** (Nursery 1, Nursery 2, Kindergarten 1, Kindergarten 2)
- **Primary School** (Primary 1-6)
- **Junior High School** (JHS 1-3)
- **Senior High School** (SHS 1-3)

### ✅ 2. Auto-Seed Classes

When you select school type(s), the system automatically creates:

#### Pre-School Classes (4 classes)
- Nursery 1 (Ages 2-3)
- Nursery 2 (Ages 3-4)
- Kindergarten 1 (Ages 4-5)
- Kindergarten 2 (Ages 5-6)

#### Primary School Classes (6 classes)
- Primary 1 through Primary 6 (Ages 6-12)

#### JHS Classes (3 classes)
- JHS 1, JHS 2, JHS 3 (Ages 12-15)

#### SHS Classes (3 classes)
- SHS 1, SHS 2, SHS 3 (Ages 15-18)

### ✅ 3. Auto-Seed Subjects

Based on selected school type(s), appropriate subjects are created:

#### Pre-School Subjects (7 subjects)
- Literacy & Language (5 periods/week)
- Numeracy (5 periods/week)
- Creative Arts (3 periods/week)
- Music & Movement (2 periods/week)
- Physical Education (2 periods/week)
- Social Studies (2 periods/week)
- Science & Nature (2 periods/week)

#### Primary School Subjects (10 subjects)
- English Language (6 periods/week)
- Mathematics (6 periods/week)
- Science (4 periods/week)
- Social Studies (3 periods/week)
- Religious & Moral Education (2 periods/week)
- Creative Arts (2 periods/week)
- Physical Education (2 periods/week)
- ICT (2 periods/week)
- Ghanaian Language (3 periods/week)
- French (2 periods/week)

#### JHS Subjects (13 subjects)
- English Language (5 periods/week)
- Mathematics (5 periods/week)
- Integrated Science (5 periods/week)
- Social Studies (3 periods/week)
- Religious & Moral Education (2 periods/week)
- Information Technology (3 periods/week)
- Ghanaian Language (3 periods/week)
- French (3 periods/week)
- Physical Education (2 periods/week)
- Creative Arts (2 periods/week)
- Career Technology (3 periods/week)
- Pre-Technical Skills (3 periods/week)
- Home Economics (3 periods/week)

#### SHS Subjects (20+ subjects)
**Core Subjects (4):**
- Core English (5 periods/week)
- Core Mathematics (5 periods/week)
- Integrated Science (4 periods/week)
- Social Studies (3 periods/week)

**Science Electives:**
- Elective Mathematics (6 periods/week)
- Physics (6 periods/week)
- Chemistry (6 periods/week)
- Biology (6 periods/week)

**Arts/Business Electives:**
- Economics (6 periods/week)
- Business Management (6 periods/week)
- Financial Accounting (6 periods/week)
- Geography (6 periods/week)
- History (6 periods/week)
- Government (6 periods/week)
- Literature in English (6 periods/week)

**Other:**
- ICT (4 periods/week)
- French (4 periods/week)
- Physical Education (2 periods/week)

### ✅ 4. Subject Management

**Full CRUD operations for subjects:**
- Create custom subjects
- Edit subject details
- Delete subjects
- Toggle subject status (active/inactive)
- Subject categorization (Core, Elective, Activity)
- Set periods per week
- Add descriptions

## How to Use

### Setting Up School Types

1. **Navigate to School Type Setup**
   - Sidebar → Settings & Reports → School Type Setup

2. **Select Your School Type(s)**
   - Check one or more school types
   - View class and subject count for each type
   - Expand to see list of classes that will be created

3. **Configure Auto-Seeding**
   - ✅ Auto-create classes (checkbox)
   - ✅ Auto-create subjects (checkbox)
   - View summary of what will be created

4. **Save Configuration**
   - Click "Save Configuration"
   - System will:
     - Update organization with selected school types
     - Create all classes for selected types
     - Create all subjects for selected types
   - See success messages with counts

### Managing Subjects

1. **Navigate to Subject Management**
   - Sidebar → Administration → Subjects

2. **View Subjects**
   - See all subjects in a table
   - Filter by category (All, Core, Elective, Activity)
   - Search by name or code
   - View statistics dashboard

3. **Add New Subject**
   - Click "Add Subject" button
   - Fill in form:
     - Subject Name (required)
     - Subject Code (required, unique)
     - Category (Core/Elective/Activity)
     - Periods Per Week (1-20)
     - Description (optional)
   - Click "Add Subject"

4. **Edit Subject**
   - Click edit icon on any subject
   - Modify details
   - Click "Update Subject"

5. **Delete Subject**
   - Click delete icon
   - Confirm deletion
   - Subject is permanently removed

6. **Toggle Subject Status**
   - Click on Active/Inactive badge
   - Subject toggles between active and inactive
   - Inactive subjects won't appear in dropdowns

## Examples

### Example 1: Setting Up a Complete Primary School

**Steps:**
1. Go to School Type Setup
2. Select "Primary School" checkbox
3. Leave both auto-seed options checked
4. Click "Save Configuration"

**Result:**
- ✅ 6 classes created (Primary 1-6)
- ✅ 10 subjects created (English, Math, Science, etc.)
- Ready to start adding students and staff!

### Example 2: Setting Up a Combined School (Primary + JHS)

**Steps:**
1. Go to School Type Setup
2. Select both "Primary School" and "Junior High School"
3. Leave both auto-seed options checked
4. Click "Save Configuration"

**Result:**
- ✅ 9 classes created (Primary 1-6, JHS 1-3)
- ✅ Combined subject list (no duplicates)
- Comprehensive curriculum coverage

### Example 3: Adding Custom Subject

**Steps:**
1. Go to Subjects page
2. Click "Add Subject"
3. Fill in:
   - Name: "Computer Programming"
   - Code: "PROG"
   - Category: Elective
   - Periods Per Week: 4
   - Description: "Introduction to coding"
4. Click "Add Subject"

**Result:**
- New subject appears in subjects list
- Available for assignment to classes
- Can be used in timetable generation

## Smart Features

### 1. Duplicate Prevention
- Subject codes must be unique
- System checks before saving
- Clear error messages

### 2. Existing Data Detection
- Warns if classes/subjects already exist
- Allows choosing whether to auto-seed
- Prevents accidental overwrites

### 3. Multi-School Type Support
- Select multiple types (e.g., Primary + JHS + SHS)
- No duplicate subjects across types
- Appropriate classes for each level

### 4. Flexible Configuration
- Can skip auto-seeding classes
- Can skip auto-seeding subjects
- Can add custom items later

### 5. Category-Based Organization
**Core Subjects:**
- Required for all students
- Blue badge
- BookOpen icon

**Elective Subjects:**
- Optional/choice-based
- Purple badge
- GraduationCap icon

**Activity Subjects:**
- PE, Arts, Co-curricular
- Green badge
- Dumbbell icon

## Subject Properties

Each subject includes:
- **Name**: Full subject name
- **Code**: Short identifier (e.g., MATH, ENG)
- **Category**: Core, Elective, or Activity
- **Periods Per Week**: Number of teaching periods
- **Description**: Optional details
- **Status**: Active or Inactive
- **Organization**: Linked to your organization
- **Timestamps**: Created and updated dates

## Integration

### With Classes Module
- Auto-created classes appear in Classes page
- Can assign class teachers
- Can set capacity and enrollment

### With Timetable Wizard
- Auto-created subjects available for selection
- Periods per week pre-configured
- Categories help with scheduling

### With Staff Module
- Assign subjects to teachers
- Subject-based teacher types supported

## Statistics Dashboard

The Subjects page shows:
- **Total Subjects**: All subjects count
- **Active**: Currently active subjects
- **Core Subjects**: Core category count
- **Electives**: Elective category count
- **Activities**: Activity category count

## Best Practices

### 1. Setup Order
1. Configure school types first
2. Auto-seed classes and subjects
3. Review and customize as needed
4. Add staff and students
5. Generate timetables

### 2. Subject Codes
- Keep codes short (2-5 characters)
- Use UPPERCASE
- Be consistent (e.g., MATH not MTH)
- Avoid special characters

### 3. Periods Per Week
- Core subjects: 5-6 periods
- Electives: 3-4 periods
- Activities: 2-3 periods
- Consider total weekly hours

### 4. When to Use Auto-Seed
✅ **Use auto-seed when:**
- Setting up a new school
- Following standard curriculum
- Want quick setup

❌ **Skip auto-seed when:**
- You have custom class structure
- Non-standard curriculum
- Already have data

### 5. Custom Subjects
Add custom subjects for:
- Specialized programs
- Extra-curricular activities
- School-specific offerings
- Language options

## Troubleshooting

### Issue: "Subject code already exists"
**Solution:** Choose a different code or check if subject already exists

### Issue: "Too many subjects created"
**Solution:** Delete unused subjects or deactivate them instead

### Issue: "Auto-seed created duplicates"
**Solution:** Review and delete duplicates, subject codes help identify them

### Issue: "Can't find my school type"
**Solution:** Mix and match existing types or add custom classes/subjects manually

## API/Service Functions

### School Type Service (`src/services/school-type.ts`)
- `updateOrganizationSchoolTypes()` - Save school types
- `getOrganizationSchoolTypes()` - Get current types
- `seedClassesForSchoolTypes()` - Auto-create classes
- `seedSubjectsForSchoolTypes()` - Auto-create subjects
- `setupSchoolTypesAndSeed()` - Complete setup
- `checkExistingClasses()` - Check for existing data
- `checkExistingSubjects()` - Check for existing data

### Subject Service (`src/services/subject.ts`)
- `getSubjects()` - Get all subjects
- `getSubject()` - Get single subject
- `createSubject()` - Add new subject
- `updateSubject()` - Update subject
- `deleteSubject()` - Remove subject
- `toggleSubjectStatus()` - Activate/deactivate
- `getSubjectsByCategory()` - Filter by category
- `checkSubjectCodeExists()` - Validate uniqueness

## Database Schema

### Subjects Collection
```typescript
{
  id: string;
  organizationId: string;
  name: string;
  code: string;
  category: 'core' | 'elective' | 'activity';
  periodsPerWeek: number;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Organization (Added Fields)
```typescript
{
  schoolTypes: ['preschool' | 'primary' | 'jhs' | 'shs'];
  // ... other fields
}
```

## Navigation

**School Type Setup:**
- Sidebar → Settings & Reports → School Type Setup
- Direct URL: `/settings/school-type`

**Subject Management:**
- Sidebar → Administration → Subjects
- Direct URL: `/subjects`

## Quick Start Checklist

- [ ] Navigate to School Type Setup
- [ ] Select your school type(s)
- [ ] Review classes and subjects to be created
- [ ] Enable auto-seed options
- [ ] Click "Save Configuration"
- [ ] Verify classes were created (Classes page)
- [ ] Verify subjects were created (Subjects page)
- [ ] Customize as needed (add/edit/delete)
- [ ] Proceed with adding staff and students
- [ ] Use Timetable Wizard with auto-created subjects

---

## Summary

✅ **4 School Types** with predefined configurations  
✅ **Auto-Seed System** for classes and subjects  
✅ **Subject Management** with full CRUD operations  
✅ **Smart Detection** of existing data  
✅ **Multi-Type Support** for combined schools  
✅ **Categorization** (Core, Elective, Activity)  
✅ **Search & Filter** capabilities  
✅ **Status Management** (Active/Inactive)  
✅ **Integration** with Timetable Wizard  

The system saves hours of manual data entry and ensures standardized, curriculum-aligned setup!
