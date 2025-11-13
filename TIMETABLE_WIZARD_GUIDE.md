# Timetable Generation Wizard - Complete Guide

## Overview

The Timetable Generation Wizard is a comprehensive, multi-step configuration system that allows you to generate conflict-free, optimized timetables for your school. It guides you through all necessary parameters to create a complete timetable that satisfies all constraints and preferences.

## Features

### ✨ Key Capabilities

1. **Multi-Step Wizard Interface**
   - Step 1: School Setup (timings, periods, breaks)
   - Step 2: Teachers Configuration
   - Step 3: Subjects Configuration
   - Step 4: Classes Configuration
   - Step 5: Review & Generate

2. **Comprehensive Parameter Collection**
   - School-wide settings (working days, periods, duration)
   - Teacher types (class teacher vs subject teacher)
   - Subject requirements (daily occurrence, periods per week)
   - Teaching models (class-based vs subject-based)
   - Special activities (PE, assembly, co-curricular)
   - Constraints and preferences

3. **Smart Generation Engine**
   - Automatic conflict detection
   - Teacher workload balancing
   - Even subject distribution
   - Constraint satisfaction
   - Preference optimization

## How to Use

### Step 1: School Configuration

Configure your school's basic parameters:

- **Periods Per Day**: Number of teaching periods (e.g., 8)
- **Period Duration**: Length of each period in minutes (e.g., 45)
- **School Timings**: Start time (e.g., 08:00) and end time (e.g., 15:00)
- **Working Days**: Select which days of the week school operates
- **Breaks**: Configure break times
  - Short breaks (15 minutes after specific periods)
  - Lunch breaks (45 minutes)
  - Specify which period each break follows

### Step 2: Teachers Configuration

Add all teachers who will be assigned to the timetable:

**For Each Teacher:**
- **Name**: Teacher's full name
- **Type**: Choose teaching model
  - **Class Teacher**: Handles all subjects for assigned class(es)
  - **Subject Teacher**: Teaches specific subjects across classes
- **Subjects**: List of subjects they can teach (comma-separated)
- **Max Periods Per Day**: Maximum teaching load per day (e.g., 6)
- **Max Periods Per Week**: Maximum weekly teaching load (e.g., 25)

**Example:**
```
Name: John Doe
Type: Subject Teacher
Subjects: Mathematics, Physics
Max Periods/Day: 6
Max Periods/Week: 25
```

### Step 3: Subjects Configuration

Define all subjects to be scheduled:

**For Each Subject:**
- **Name**: Subject name (e.g., Mathematics)
- **Periods Per Week**: How many periods needed weekly (e.g., 5)
- **Category**: Type of subject
  - Subject (regular academic)
  - PE (Physical Education)
  - Co-Curricular
  - Assembly
- **Occurs Daily**: Check if subject should appear every day
- **Prefer Morning**: Check if subject should be scheduled in morning slots
- **Requires Double Period**: Check if subject needs consecutive periods

**Common Configurations:**

| Subject | Periods/Week | Category | Daily | Morning | Double Period |
|---------|--------------|----------|-------|---------|---------------|
| Mathematics | 5 | Subject | ✓ | ✓ | ✗ |
| English | 5 | Subject | ✓ | ✓ | ✗ |
| Science | 4 | Subject | ✗ | ✗ | ✓ |
| PE | 2 | PE | ✗ | ✗ | ✗ |
| Assembly | 1 | Assembly | ✗ | ✓ | ✗ |

### Step 4: Classes Configuration

Configure how each class will be taught:

**For Each Class:**
- **Teaching Type**: Choose teaching model
  - **Class Teacher**: One teacher handles all subjects
  - **Subject-Based**: Different teachers for different subjects
- **Class Teacher** (if applicable): Select which teacher is assigned
- **Subjects**: Select which subjects this class will have

**Teaching Models:**

1. **Class Teacher Model** (Primary Schools)
   - One teacher teaches all or most subjects
   - Better for younger students
   - Teacher stays with class most of the day

2. **Subject-Based Model** (Secondary Schools)
   - Different specialized teachers per subject
   - Subject experts teach their specialization
   - Students remain in class, teachers rotate

### Step 5: Review & Generate

Review all configurations:

**Review Checklist:**
- ✅ School configuration complete
- ✅ All teachers added with workload limits
- ✅ All subjects configured with requirements
- ✅ All classes configured with teaching models
- ✅ Constraints and preferences set

**Actions:**
- **Save Configuration**: Saves current setup for reuse
- **Generate Timetable**: Creates the complete timetable

## Generation Process

The system will:

1. **Validate Configuration**
   - Check for missing required data
   - Verify teacher-subject compatibility
   - Confirm total periods don't exceed available slots

2. **Allocate Periods**
   - Start with daily occurrence subjects
   - Allocate morning preference subjects first
   - Distribute remaining subjects evenly
   - Handle double periods where required
   - Balance teacher workloads

3. **Apply Constraints**
   - Avoid consecutive same subjects
   - Prevent teacher conflicts
   - Prevent class conflicts
   - Respect workload limits
   - Honor preferences

4. **Report Results**
   - Show allocation statistics
   - List any conflicts found
   - Display warnings
   - Provide success confirmation

## Configuration Examples

### Example 1: Primary School (Class Teacher Model)

**School Setup:**
- Periods: 6 per day
- Duration: 40 minutes
- Days: Monday - Friday
- Breaks: After period 2 (15 min), After period 4 (30 min)

**Teachers:**
- 5 class teachers (one per grade)
- 2 specialist teachers (PE, Music)

**Subjects:**
- English (5/week, daily, morning)
- Mathematics (5/week, daily, morning)
- Science (3/week)
- Social Studies (2/week)
- PE (2/week)
- Music (2/week)

**Classes:**
- Grade 1-5: Class teacher model
- Each grade assigned one class teacher

### Example 2: Secondary School (Subject-Based Model)

**School Setup:**
- Periods: 8 per day
- Duration: 45 minutes
- Days: Monday - Friday
- Breaks: After period 2 (15 min), After period 5 (45 min lunch)

**Teachers:**
- 3 Math teachers
- 3 English teachers
- 2 Science teachers
- 2 Social Studies teachers
- 1 PE teacher
- Max: 6 periods/day, 25 periods/week

**Subjects:**
- Mathematics (5/week, daily, double period)
- English (5/week, daily)
- Science (4/week, double period)
- Social Studies (3/week)
- PE (2/week)

**Classes:**
- Grade 6-12: Subject-based model
- All subjects assigned to specialist teachers

## Constraints & Preferences

The system enforces:

### Hard Constraints (Must Satisfy)
- ✅ No teacher conflicts (same teacher, same time)
- ✅ No class conflicts (same class, same time)
- ✅ Respect teacher workload limits
- ✅ Fit within school hours

### Soft Constraints (Try to Satisfy)
- 📊 Avoid consecutive same subject
- 📊 Distribute subjects evenly across week
- 📊 Honor morning preferences
- 📊 Minimize teacher gaps between periods
- 📊 Prioritize teacher availability preferences

## Tips for Best Results

### 1. Accurate Teacher Workloads
- Set realistic max periods per day (5-6 is typical)
- Account for non-teaching duties
- Allow buffer for preparation time

### 2. Subject Distribution
- Mark core subjects as "daily" when appropriate
- Use morning preference for concentration-heavy subjects
- Mark science labs as "double period"

### 3. Teaching Models
- Use class teacher for younger grades (1-5)
- Use subject-based for older grades (6-12)
- Can mix both models in same school

### 4. Working Days
- Most schools: Monday-Friday
- Some schools: Monday-Saturday
- Adjust periods per day accordingly

### 5. Break Placement
- Short break after 2-3 periods
- Lunch after 4-5 periods (midday)
- Keep breaks consistent daily

## Troubleshooting

### Issue: "Not enough teachers"
**Solution:** Add more teachers or reduce max periods per week requirement

### Issue: "Too many periods requested"
**Solution:** Reduce periods per week for some subjects or increase working days

### Issue: "Teacher conflicts detected"
**Solution:** Review teacher workload limits and subject assignments

### Issue: "No suitable slot found"
**Solution:** 
- Reduce strict constraints
- Allow more flexibility in preferences
- Increase periods per day

### Issue: "Uneven distribution"
**Solution:**
- Enable "Distribute evenly" constraint
- Avoid marking too many subjects as "morning only"
- Balance daily occurrence subjects

## Navigation

### Access the Wizard
1. From sidebar: **Academic → Timetable Wizard**
2. From timetables page: Click **"Configuration Wizard"** button

### Save & Resume
- Click "Save Configuration" at any step
- Configuration persists for current academic year
- Resume anytime by returning to wizard

## Generated Timetable

After successful generation:
- Redirects to Timetable Management page
- View by class or teacher
- Print/export capabilities
- Edit individual entries if needed
- Validate for conflicts

## Statistics Provided

After generation, you'll see:
- ✅ Total periods allocated
- ✅ Total periods requested
- ✅ Allocation success rate
- ⚠️ Warnings count
- ❌ Conflicts count (if any)

## Integration

The wizard integrates with:
- ✅ Classes module (pre-loads existing classes)
- ✅ Staff module (pre-loads existing teachers)
- ✅ Timetable viewer (displays generated schedule)
- ✅ Academic year settings

## Best Practices

1. **Complete Setup First**
   - Add all classes in Classes module
   - Add all teachers in Staff module
   - Then use wizard for generation

2. **Start Simple**
   - Configure basic subjects first
   - Add special activities later
   - Test generation with minimal setup

3. **Iterate**
   - Save configuration frequently
   - Generate and review
   - Adjust parameters as needed
   - Regenerate until satisfied

4. **Validate Often**
   - Use validate button after generation
   - Check for conflicts
   - Review warnings
   - Make manual adjustments if needed

---

## Quick Start Checklist

- [ ] Navigate to Timetable Wizard
- [ ] Step 1: Set school hours and breaks
- [ ] Step 2: Add all teachers with workloads
- [ ] Step 3: Configure all subjects
- [ ] Step 4: Set up class teaching models
- [ ] Step 5: Review and generate
- [ ] View generated timetable
- [ ] Validate for conflicts
- [ ] Export/Print if satisfied

**Need Help?** All existing classes and teachers are automatically pre-loaded into the wizard for your convenience!
