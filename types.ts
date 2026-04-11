
export interface DoctorProfile {
  name: string;
  title: string;
  specialty: string;
  bio: string;
  photo: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  consultationFee: number;
  workingHours: string;
  currentServingNumber: number;
  photo?: string;
  mapLink?: string;
  maxPatientsPerDay: number;
  isClosedToday: boolean;
}

export interface Order {
  id: string;
  clinicId: string;
  slotId?: string; // Link to the recurring time slot
  patientName: string;
  phoneNumber: string;
  queueNumber: number;
  type: 'كشف' | 'استشارة' | 'تحاليل' | 'أشعة';
  status: 'منتظر' | 'قيد الكشف' | 'تم الكشف' | 'ملغي';
  paymentStatus: 'تم دفع الرسوم' | 'لم يتم الدفع';
  date: string;
  notes: string;
  consultationFee: number;
  serviceFee: number; 
}

export interface Appointment {
  id: string;
  clinicId: string;
  patientName: string;
  date: string;
  time: string;
  reason: string;
  duration: string;
}

export interface TimeSlot {
  id: string;
  clinicId: string;
  day: string; // e.g., "السبت", "الأحد"
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  type: 'كشف' | 'استشارة';
  capacity: number;
  bookedCount: number;
}
