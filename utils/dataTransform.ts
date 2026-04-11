import { Clinic, Order, TimeSlot } from '../types';

// Transform backend clinic to frontend format
export const transformClinic = (backendClinic: any): Clinic => ({
  id: backendClinic.id.toString(),
  name: backendClinic.name,
  address: backendClinic.address,
  consultationFee: parseFloat(backendClinic.consultation_fee),
  workingHours: backendClinic.working_hours,
  currentServingNumber: backendClinic.current_serving_number || 0,
  maxPatientsPerDay: backendClinic.max_patients_per_day,
  isClosedToday: backendClinic.is_closed_today || false,
  photo: backendClinic.photo || '',
  mapLink: backendClinic.map_link || '',
});

// Transform backend order to frontend format
export const transformOrder = (backendOrder: any): Order => ({
  id: backendOrder.id.toString(),
  clinicId: backendOrder.clinic_id.toString(),
  slotId: backendOrder.slot_id ? backendOrder.slot_id.toString() : undefined,
  patientName: backendOrder.patient_name,
  phoneNumber: backendOrder.phone_number,
  queueNumber: backendOrder.queue_number,
  type: backendOrder.type,
  status: backendOrder.status,
  paymentStatus: backendOrder.payment_status,
  date: backendOrder.date,
  notes: backendOrder.notes || '',
  consultationFee: parseFloat(backendOrder.consultation_fee),
  serviceFee: parseFloat(backendOrder.service_fee || 0),
});

// Transform backend time slot to frontend format
export const transformTimeSlot = (backendSlot: any): TimeSlot => ({
  id: backendSlot.id.toString(),
  clinicId: backendSlot.clinic_id.toString(),
  day: backendSlot.day_name,
  startTime: backendSlot.start_time,
  endTime: backendSlot.end_time,
  duration: backendSlot.duration,
  type: backendSlot.type,
  capacity: backendSlot.capacity,
  bookedCount: backendSlot.booked_count || 0,
});

// Transform frontend clinic to backend format
export const transformClinicToBackend = (clinic: Clinic): any => ({
  name: clinic.name,
  address: clinic.address,
  consultation_fee: clinic.consultationFee,
  working_hours: clinic.workingHours,
  current_serving_number: clinic.currentServingNumber,
  max_patients_per_day: clinic.maxPatientsPerDay,
  is_closed_today: clinic.isClosedToday,
  photo: clinic.photo,
  map_link: clinic.mapLink,
});

// Transform frontend order to backend format
export const transformOrderToBackend = (order: Order): any => ({
  clinic_id: parseInt(order.clinicId),
  slot_id: order.slotId ? parseInt(order.slotId) : null,
  patient_name: order.patientName,
  phone_number: order.phoneNumber,
  type: order.type,
  status: order.status,
  payment_status: order.paymentStatus,
  date: order.date,
  notes: order.notes,
  consultation_fee: order.consultationFee,
  service_fee: order.serviceFee,
});

// Transform frontend time slot to backend format
export const transformTimeSlotToBackend = (slot: TimeSlot, dayOfWeek: number): any => ({
  clinic_id: parseInt(slot.clinicId),
  day_of_week: dayOfWeek,
  day_name: slot.day,
  start_time: slot.startTime,
  end_time: slot.endTime,
  duration: slot.duration,
  type: slot.type,
  capacity: slot.capacity,
});

// Day name to day of week mapping
export const dayNameToDayOfWeek: Record<string, number> = {
  'السبت': 0,
  'الأحد': 1,
  'الاثنين': 2,
  'الثلاثاء': 3,
  'الأربعاء': 4,
  'الخميس': 5,
  'الجمعة': 6,
};
