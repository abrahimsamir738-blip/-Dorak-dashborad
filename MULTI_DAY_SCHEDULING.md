# Multi-Day Scheduling System - Implementation Guide

## Overview

The Appointments component has been enhanced with a multi-day scheduling system that allows doctors to select multiple days and apply a unified time slot to all of them at once, with comprehensive front-end validation.

## Key Features

### 1. Multi-Select Days Interface
- **Chip-based selection**: Doctors can click multiple day chips to select/deselect days
- **Visual feedback**: Selected days are highlighted with blue background and checkmark icon
- **Counter display**: Shows how many days are selected (e.g., "تم اختيار 3 أيام: السبت، الأحد، الاثنين")

### 2. Front-End Validation

#### Clinic ID Validation
- **Automatic check**: Ensures a clinic is selected before allowing schedule creation
- **Visual warning**: Displays error message if no clinic is selected
- **Disabled state**: "Add Schedule" button is disabled when no clinic is selected

#### Time Range Validation
- **Real-time validation**: Checks that end_time is strictly after start_time
- **Immediate feedback**: Shows error message as user types
- **Visual indicators**: Input fields turn red when validation fails
- **Error messages**: Clear Arabic error messages guide the user

#### Other Validations
- **Duration**: Must be greater than 0
- **Capacity**: Must be greater than 0
- **Days selection**: At least one day must be selected for new schedules

### 3. Smart Save Logic

#### For New Schedules (Multi-Day)
- Creates one schedule entry per selected day
- Makes multiple API calls (one per day)
- Shows success count: "تم إضافة 3 فترة بنجاح"
- Handles partial failures gracefully

#### For Editing Existing Schedules
- Single day editing mode
- Uses existing day selection dropdown
- Updates only the selected schedule

### 4. Visual Feedback

#### Error States
- Red borders on invalid input fields
- Error messages below each field
- Warning banner for clinic selection

#### Success States
- Green checkmarks on selected day chips
- Success toast notifications
- Real-time validation clearing

## Usage Guide

### Creating a Multi-Day Schedule

1. **Select a Clinic**: Choose a clinic from the sidebar (required)
2. **Click "إضافة فترة جديدة للجدول"**: Opens the modal
3. **Select Multiple Days**: Click day chips to select/deselect (e.g., Saturday, Sunday, Monday)
4. **Set Time Range**: 
   - Start Time: e.g., "09:00"
   - End Time: e.g., "17:00" (must be after start time)
5. **Fill Other Fields**:
   - Service Type: "كشف جديد" or "استشارة / متابعة"
   - Duration: e.g., "30" minutes
   - Capacity: e.g., "15" patients
6. **Click "تأكيد الإضافة"**: Creates schedules for all selected days

### Editing an Existing Schedule

1. **Select a Day**: Click a day from the day selector bar
2. **Hover over a Schedule Card**: Edit and delete buttons appear
3. **Click Edit**: Opens modal with single-day editing mode
4. **Modify Fields**: Change time, duration, capacity, etc.
5. **Click "حفظ التعديلات"**: Updates the schedule

## API Payload Structure

### Request Payload (per day)
```json
{
  "clinic_id": 1,
  "day_of_week": 0,
  "day_name": "السبت",
  "start_time": "09:00",
  "end_time": "17:00",
  "duration": 30,
  "type": "كشف",
  "capacity": 15
}
```

### Validation Rules
- `clinic_id`: Required, must exist in clinics table
- `day_of_week`: Required, integer 0-6 (0=Saturday, 6=Friday)
- `day_name`: Required, Arabic day name
- `start_time`: Required, format "HH:mm"
- `end_time`: Required, format "HH:mm", must be after start_time
- `duration`: Required, integer > 0
- `type`: Required, either "كشف" or "استشارة"
- `capacity`: Required, integer > 0

## Error Handling

### Front-End Validation Errors
- **Clinic not selected**: "يرجى اختيار عيادة أولاً"
- **No days selected**: "يرجى اختيار يوم واحد على الأقل"
- **Invalid time range**: "وقت الانتهاء يجب أن يكون بعد وقت البدء"
- **Missing duration**: "مدة الكشف مطلوبة ويجب أن تكون أكبر من صفر"
- **Missing capacity**: "السعة مطلوبة ويجب أن تكون أكبر من صفر"

### Back-End Error Handling
- Catches API errors and displays user-friendly messages
- Handles partial failures when creating multiple schedules
- Shows success count and failure count if applicable

## Code Structure

### Key Functions

#### `validateForm()`
- Validates all form fields before submission
- Returns boolean indicating if form is valid
- Sets error messages in `formErrors` state

#### `validateTimeRange(start, end)`
- Compares start and end times
- Returns true if end is after start
- Handles time string parsing

#### `handleSaveSlot()`
- Main save function
- Handles both create and update operations
- Creates multiple schedules for selected days
- Shows loading states and success/error messages

#### `toggleDaySelection(dayName)`
- Toggles day selection in multi-select mode
- Clears errors when days are selected
- Updates `selectedDays` state

#### `handleTimeChange(field, value)`
- Handles time input changes
- Validates time range in real-time
- Clears errors when valid

## UI Components

### Day Selection Chips
- **Unselected**: Gray background, gray text
- **Selected**: Blue background, white text, checkmark icon
- **Hover**: Light blue border, blue text

### Input Fields
- **Normal**: Gray border
- **Error**: Red border, error message below
- **Focus**: Blue border, blue ring

### Modal
- **Header**: Title with blue accent bar
- **Body**: Form fields with validation
- **Footer**: Cancel and Save buttons

## Testing Checklist

- [x] Multi-day selection works correctly
- [x] Clinic validation prevents submission without clinic
- [x] Time range validation prevents invalid ranges
- [x] Real-time validation provides immediate feedback
- [x] Multiple schedules created for selected days
- [x] Edit mode works for single schedules
- [x] Error messages display correctly
- [x] Success messages show correct counts
- [x] Partial failure handling works
- [x] UI is responsive and accessible

## Future Enhancements

1. **Bulk Delete**: Delete multiple schedules at once
2. **Copy Schedule**: Copy a schedule to other days
3. **Time Conflict Detection**: Warn if schedules overlap
4. **Template System**: Save common schedule templates
5. **Recurring Patterns**: Set patterns like "Every Monday and Wednesday"

## Notes

- The system creates individual schedule entries for each selected day
- Editing mode only allows single-day editing for simplicity
- All validation happens on the front-end before API calls
- Error messages are in Arabic for better UX
- The component maintains backward compatibility with single-day selection
