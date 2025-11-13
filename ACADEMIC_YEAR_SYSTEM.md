# Academic Year & Term Management System

## Overview
Complete system for managing academic years, terms, and archiving historical data.

## Features

### 1. Academic Year Management
- **Create Academic Years**: Set up new academic years with start/end dates
- **Multiple Years**: Support for multiple academic years (current, past, future)
- **Set Current Year**: Mark any year as the current active year
- **Archive Old Years**: End academic years and archive all data

### 2. Term Management
- **Add Terms**: Add multiple terms to each academic year
- **Set Current Term**: Mark which term is currently active
- **Term Dates**: Define start and end dates for each term
- **Flexible Structure**: Support for 2-term, 3-term, or custom term systems

### 3. Data Archiving
- **Automatic Archiving**: Archive all data when ending an academic year
- **Multi-Collection**: Archives students, classes, attendance, grades, fees, payments, staff
- **Metadata Tracking**: Track when archived, by whom, and record counts
- **Access Anytime**: View archived data even after years have ended

### 4. Data Export
- **JSON Export**: Export entire archive as JSON file
- **CSV Export**: Export individual collections (students, grades, etc.) as CSV
- **Selective Export**: Choose which data to export
- **Historical Reports**: Generate reports from archived data

## Navigation

### For School Admins/Owners:
1. **Academic Year Settings**: `/settings/academic-year`
   - Create and manage academic years
   - Add and manage terms
   - End academic years with archiving

2. **Archives**: `/settings/archives`
   - View all archived data
   - Export archived data (JSON/CSV)
   - Access historical records

## Usage Guide

### Setting Up a New Academic Year

1. Go to `/settings/academic-year`
2. Click "Create Academic Year"
3. Fill in:
   - Academic Year Name (e.g., "2024/2025")
   - Start Date
   - End Date
4. Click "Create"

### Adding Terms

1. In the Current Academic Year card
2. Click "Add Term"
3. Fill in:
   - Term Number (1, 2, 3, etc.)
   - Term Name (e.g., "First Term")
   - Start Date
   - End Date
4. Click "Add Term"

### Setting Current Term

1. Find the term you want to activate
2. Click "Set Current" button
3. This term will be marked as active

### Ending an Academic Year

1. Click "End Academic Year" button
2. Choose options:
   - ✅ **Promote students to next class** (Future feature)
   - ✅ **Carry over unpaid fees** (Future feature)
   - ✅ **Archive year data** (Recommended - always enable)
3. Click "End Academic Year"
4. All data will be archived and accessible in Archives page

### Viewing Archived Data

1. Go to `/settings/archives`
2. See all archived academic years
3. Click "View" on any archive
4. See summary and export options

### Exporting Archived Data

**Export Everything:**
- Click "Export All (JSON)" to download complete archive

**Export Specific Data:**
- Click any collection button (e.g., "students (150)")
- Downloads as CSV file
- Can be opened in Excel/Google Sheets

## Archive Structure

Each archive contains:

```typescript
{
  metadata: {
    academicYearId: string
    academicYearName: string
    archivedAt: timestamp
    archivedBy: userId
    recordCounts: {
      students: 150,
      classes: 12,
      attendance: 3500,
      grades: 2000,
      fees: 500,
      payments: 300,
      staff: 25
    }
  },
  data: {
    students: [...],
    classes: [...],
    attendance: [...],
    grades: [...],
    fees: [...],
    payments: [...],
    staff: [...]
  }
}
```

## Best Practices

### 1. Academic Year Setup
- Create next year before current year ends
- Set up terms at the start of the year
- Review term dates regularly

### 2. Archiving
- **Always enable archiving** when ending a year
- Archive before promoting students (future)
- Keep archives for at least 5 years

### 3. Data Export
- Export archives annually for backup
- Store exports in secure location
- Use CSV exports for sharing with stakeholders

### 4. Term Management
- Update current term at start of each term
- Ensure term dates don't overlap
- Plan term dates in advance

## Future Enhancements

### Student Promotion
When enabled during year-end:
- Automatically promote students to next grade
- Update class assignments
- Maintain student history

### Fee Carryover
When enabled during year-end:
- Transfer unpaid fees to new year
- Create new fee records
- Link to previous year balances

### Advanced Archiving
- Selective archiving (choose collections)
- Archive compression
- Cloud backup integration
- Archive search functionality

## Technical Details

### Collections Archived
1. `students` - All student records
2. `classes` - Class definitions
3. `attendance` - Attendance records
4. `grades` - Grade and assessment data
5. `fees` - Fee structures and balances
6. `payments` - Payment history
7. `staff` - Staff assignments

### Archive Storage
- Stored in `archives` Firestore collection
- Indexed by organization and academic year
- Includes full data snapshots
- Accessible indefinitely

### Performance
- Archiving is async (doesn't block UI)
- Large datasets handled efficiently
- Export optimized for speed
- CSV generation client-side

## Troubleshooting

**Archive not created?**
- Check console for errors
- Ensure you have admin permissions
- Verify academic year exists

**Export not working?**
- Check browser popup blocker
- Ensure data exists in archive
- Try different collection

**Can't view old data?**
- Check Archives page
- Verify archive was created
- Contact super admin if missing

## Support

For assistance with academic year management:
1. Check this documentation
2. Review console logs for errors
3. Contact super admin
4. Email support@syntra.app

---

**Last Updated**: November 3, 2025
**Version**: 1.0
