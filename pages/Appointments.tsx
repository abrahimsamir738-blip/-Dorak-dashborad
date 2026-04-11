
import React, { useState, useEffect } from 'react';
import { TimeSlot, Clinic } from '../types';
import { scheduleAPI, clinicAPI } from '../services/api';
import { useApp } from '../contexts/AppContext';
import { transformTimeSlot, transformTimeSlotToBackend, dayNameToDayOfWeek } from '../utils/dataTransform';

interface AppointmentsProps {
 selectedClinicId: string;
 clinics: Clinic[];
 setClinics: (clinics: Clinic[]) => void;
 timeSlots: TimeSlot[];
 setTimeSlots: (slots: TimeSlot[]) => void;
 onRefresh?: () => void;
}

const daysOfWeek = [
 { id: 'sat', name: 'السبت', dayOfWeek: 0 },
 { id: 'sun', name: 'الأحد', dayOfWeek: 1 },
 { id: 'mon', name: 'الاثنين', dayOfWeek: 2 },
 { id: 'tue', name: 'الثلاثاء', dayOfWeek: 3 },
 { id: 'wed', name: 'الأربعاء', dayOfWeek: 4 },
 { id: 'thu', name: 'الخميس', dayOfWeek: 5 },
 { id: 'fri', name: 'الجمعة', dayOfWeek: 6 },
];

interface FormErrors {
 clinicId?: string;
 days?: string;
 startTime?: string;
 endTime?: string;
 duration?: string;
 capacity?: string;
}

const Appointments: React.FC<AppointmentsProps> = ({ selectedClinicId, clinics, setClinics, timeSlots, setTimeSlots, onRefresh }) => {
 const { showToast, showLoading, hideLoading } = useApp();
 const [selectedDay, setSelectedDay] = useState<string | null>(null);
 const [showModal, setShowModal] = useState(false);
 const [formData, setFormData] = useState<Partial<TimeSlot> & { selectedDays?: string[] }>({});
 const [formErrors, setFormErrors] = useState<FormErrors>({});
 const [selectedDays, setSelectedDays] = useState<string[]>([]);

 const activeClinic = clinics.find(c => c.id === selectedClinicId) || clinics[0];
 const daySlots = selectedDay
  ? timeSlots.filter(s => s.clinicId === selectedClinicId && s.day === selectedDay)
  : [];

 // Validate time range
 const validateTimeRange = (start: string, end: string): boolean => {
  if (!start || !end) return false;
  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);
  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;
  return endTotal > startTotal;
 };

 // Validate form before submission
 const validateForm = (): boolean => {
  const errors: FormErrors = {};

  // Validate clinic_id
  if (!selectedClinicId || !activeClinic) {
   errors.clinicId = 'يرجى اختيار عيادة أولاً';
  }

  // Validate selected days
  if (!formData.id && selectedDays.length === 0) {
   errors.days = 'يرجى اختيار يوم واحد على الأقل';
  }

  // Validate time range
  if (!formData.startTime || !formData.endTime) {
   if (!formData.startTime) errors.startTime = 'وقت البدء مطلوب';
   if (!formData.endTime) errors.endTime = 'وقت الانتهاء مطلوب';
  } else if (!validateTimeRange(formData.startTime, formData.endTime)) {
   errors.endTime = 'وقت الانتهاء يجب أن يكون بعد وقت البدء';
  }

  // Validate duration
  if (!formData.duration || formData.duration <= 0) {
   errors.duration = 'مدة الكشف مطلوبة ويجب أن تكون أكبر من صفر';
  }

  // Validate capacity
  if (!formData.capacity || formData.capacity <= 0) {
   errors.capacity = 'السعة مطلوبة ويجب أن تكون أكبر من صفر';
  }

  setFormErrors(errors);
  return Object.keys(errors).length === 0;
 };

 const toggleClosure = async () => {
  showLoading('جاري تحديث حالة العيادة...');
  try {
   await clinicAPI.update(selectedClinicId, {
    is_closed_today: !activeClinic.isClosedToday
   });
   setClinics(clinics.map(c => c.id === selectedClinicId ? { ...c, isClosedToday: !c.isClosedToday } : c));
   showToast(activeClinic.isClosedToday ? 'تم فتح العيادة' : 'تم إغلاق العيادة', 'success');
  } catch (error) {
   showToast('فشل تحديث حالة العيادة', 'error');
  } finally {
   hideLoading();
  }
 };

 const handleSaveSlot = async () => {
  // Clear previous errors
  setFormErrors({});

  // Validate form
  if (!validateForm()) {
   showToast('يرجى تصحيح الأخطاء في النموذج', 'warning');
   return;
  }

  showLoading(formData.id ? 'جاري تحديث الفترة...' : 'جاري إضافة الفترات...');
  try {
   if (formData.id) {
    // Edit existing slot - single day
    const dayOfWeek = dayNameToDayOfWeek[formData.day!];
    const slotData = transformTimeSlotToBackend(formData as TimeSlot, dayOfWeek);
    slotData.clinic_id = parseInt(selectedClinicId);

    await scheduleAPI.update(formData.id, slotData);
    showToast('تم تحديث الفترة بنجاح', 'success');
   } else {
    // Create new slots - multiple days
    const daysToCreate = selectedDays.length > 0 ? selectedDays : [formData.day!];
    let successCount = 0;
    let errorCount = 0;

    for (const dayName of daysToCreate) {
     try {
      const dayOfWeek = dayNameToDayOfWeek[dayName];
      const slotData = transformTimeSlotToBackend({
       ...formData,
       day: dayName,
      } as TimeSlot, dayOfWeek);
      slotData.clinic_id = parseInt(selectedClinicId);

      await scheduleAPI.create(slotData);
      successCount++;
     } catch (error: any) {
      console.error(`Failed to create slot for ${dayName}:`, error);
      errorCount++;
     }
    }

    if (errorCount === 0) {
     showToast(`تم إضافة ${successCount} فترة بنجاح`, 'success');
    } else if (successCount > 0) {
     showToast(`تم إضافة ${successCount} فترة، وفشل ${errorCount}`, 'warning');
    } else {
     throw new Error('فشل إضافة جميع الفترات');
    }
   }

   // Refresh schedules
   if (onRefresh) onRefresh();
   setShowModal(false);
   setFormData({});
   setSelectedDays([]);
   setFormErrors({});
  } catch (error: any) {
   const message = error.response?.data?.message || error.message || 'فشل حفظ الفترة';
   showToast(message, 'error');
  } finally {
   hideLoading();
  }
 };

 const deleteSlot = async (id: string) => {
  if (!window.confirm('هل أنت متأكد من حذف هذه الفترة الزمنية من الجدول الأسبوعي؟')) {
   return;
  }

  showLoading('جاري حذف الفترة...');
  try {
   await scheduleAPI.delete(id);
   showToast('تم حذف الفترة بنجاح', 'success');
   if (onRefresh) onRefresh();
  } catch (error) {
   showToast('فشل حذف الفترة', 'error');
  } finally {
   hideLoading();
  }
 };

 const handleNumericChange = (field: keyof TimeSlot, value: string) => {
  // Clear error for this field
  if (formErrors[field as keyof FormErrors]) {
   setFormErrors({ ...formErrors, [field]: undefined });
  }

  // Allow empty string for clearing the field
  if (value === '') {
   setFormData({ ...formData, [field]: '' as any });
   return;
  }
  // Only allow numeric input
  const num = parseInt(value, 10);
  if (!isNaN(num) && num >= 0) {
   setFormData({ ...formData, [field]: num as any });
  }
 };

 const toggleDaySelection = (dayName: string) => {
  if (formData.id) {
   // Editing mode - single day only
   setFormData({ ...formData, day: dayName });
   return;
  }

  // Adding mode - multi-select
  setSelectedDays(prev => {
   const newDays = prev.includes(dayName)
    ? prev.filter(d => d !== dayName)
    : [...prev, dayName];

   // Clear error when days are selected
   if (newDays.length > 0 && formErrors.days) {
    setFormErrors({ ...formErrors, days: undefined });
   }

   return newDays;
  });
 };

 const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
  // Clear errors for both time fields
  const newErrors = { ...formErrors };
  if (newErrors.startTime) delete newErrors.startTime;
  if (newErrors.endTime) delete newErrors.endTime;
  setFormErrors(newErrors);

  setFormData({ ...formData, [field]: value });

  // Validate time range in real-time
  if (field === 'endTime' && formData.startTime) {
   if (!validateTimeRange(formData.startTime, value)) {
    setFormErrors({ ...newErrors, endTime: 'وقت الانتهاء يجب أن يكون بعد وقت البدء' });
   }
  } else if (field === 'startTime' && formData.endTime) {
   if (!validateTimeRange(value, formData.endTime)) {
    setFormErrors({ ...newErrors, endTime: 'وقت الانتهاء يجب أن يكون بعد وقت البدء' });
   }
  }
 };

 const openAddModal = () => {
  setFormData({
   startTime: '09:00',
   endTime: '12:00',
   duration: '' as any,
   type: 'كشف',
   capacity: '5' as any
  });
  setSelectedDays([]);
  setFormErrors({});
  setShowModal(true);
 };

 const openEditModal = (slot: TimeSlot) => {
  setFormData(slot);
  setSelectedDays([slot.day]);
  setFormErrors({});
  setShowModal(true);
 };

 return (
  <div className="flex flex-col gap-8 text-right animate-in fade-in duration-500 pb-12">
   {/* Header Info & General Status */}
   <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
    <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
     <div>
      <h2 className="text-2xl font-black text-slate-900 leading-tight">تنظيم جدول المواعيد</h2>
      <p className="text-sm text-slate-500 mt-1">
       أهلاً بك في إدارة الفترات الزمنية لعيادة <span className="text-blue-600 font-bold">{activeClinic?.name || 'غير محدد'}</span>.
      </p>
      {!activeClinic && (
       <p className="text-xs text-rose-500 mt-2 font-bold">⚠️ يرجى اختيار عيادة من القائمة الجانبية</p>
      )}
     </div>
     <button
      onClick={openAddModal}
      disabled={!activeClinic}
      className="px-8 py-4 bg-[#0f172a] text-white font-black rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-3 text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
     >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
      إضافة فترة جديدة للجدول
     </button>
    </div>

    <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
     <div className="flex flex-col">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">حالة الحجز اليوم</span>
      <span className={`text-xs font-bold ${activeClinic?.isClosedToday ? 'text-rose-500' : 'text-emerald-500'}`}>
       {activeClinic?.isClosedToday ? 'الفرع مغلق حالياً' : 'الفرع يستقبل حجوزات'}
      </span>
     </div>
     <button
      onClick={toggleClosure}
      disabled={!activeClinic}
      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${activeClinic?.isClosedToday ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}
     >
      {activeClinic?.isClosedToday ?
       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> :
       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      }
     </button>
    </div>
   </div>

   {/* Day Selector Bar */}
   <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
    <div className="flex flex-wrap justify-center gap-3">
     {daysOfWeek.map(day => (
      <button
       key={day.id}
       onClick={() => setSelectedDay(day.name)}
       className={`px-8 py-3 rounded-2xl text-xs font-black transition-all border ${selectedDay === day.name
        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20 scale-105'
        : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:border-blue-200 hover:text-blue-500'
        }`}
      >
       {day.name}
      </button>
     ))}
    </div>
   </div>

   {/* Slots Area */}
   <div className="min-h-[400px]">
    {selectedDay ? (
     <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-4">
       <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">
        {selectedDay.charAt(0)}
       </div>
       <h3 className="text-xl font-black text-slate-800">فترات العمل ليوم {selectedDay}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
       {daySlots.length > 0 ? daySlots.map(slot => (
        <div key={slot.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
         <div className="flex justify-between items-start mb-6">
          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border ${slot.type === 'كشف' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
           {slot.type === 'كشف' ? 'كشف جديد' : 'متابعة / استشارة'}
          </span>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={() => openEditModal(slot)} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 border border-slate-100 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
           <button onClick={() => deleteSlot(slot.id)} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 hover:text-rose-600 border border-slate-100 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
          </div>
         </div>

         <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">مواعيد العمل</p>
           <p className="text-lg font-black text-slate-900">{slot.startTime} - {slot.endTime}</p>
          </div>
         </div>

         <div className="space-y-3">
          <div className="flex justify-between items-center text-[11px] font-black">
           <span className="text-slate-400">الإشغال الحالي</span>
           <span className={slot.bookedCount >= slot.capacity ? 'text-rose-500' : 'text-blue-600'}>{slot.bookedCount} / {slot.capacity}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
           <div
            className={`h-full transition-all duration-700 ease-out ${slot.bookedCount >= slot.capacity ? 'bg-rose-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min((slot.bookedCount / (slot.capacity || 1)) * 100, 100)}%` }}
           />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-300">
           <span>مدة الكشف: {slot.duration} دقيقة</span>
           <span>تكرار أسبوعي</span>
          </div>
         </div>
        </div>
       )) : (
        <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
         </div>
         <p className="text-sm font-bold text-slate-300">لا توجد فترات عمل مسجلة لهذا اليوم</p>
         <button onClick={openAddModal} className="mt-4 text-xs font-black text-blue-600 hover:underline">أضف فترة عمل الآن</button>
        </div>
       )}
      </div>
     </div>
    ) : (
     <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm text-center">
      <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
       <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2">يرجى اختيار يوم من الأعلى لعرض الجدول</h3>
      <p className="text-sm text-slate-400 max-w-sm">يمكنك استعراض وتعديل الجدول الزمني المتكرر لكل يوم على حدة للحفاظ على واجهة نظيفة ومنظمة.</p>
     </div>
    )}
   </div>

   {/* Modal for Add/Edit */}
   {showModal && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300">
     <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 shadow-2xl border border-slate-100 text-right animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
      <div className="flex items-center justify-between mb-10">
       <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
        <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
        {formData.id ? 'تعديل فترة العمل' : 'إضافة فترة عمل جديدة'}
       </h3>
       <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
        جدول أسبوعي ثابت
       </div>
      </div>

      <div className="space-y-8">
       {/* Clinic Selection Warning */}
       {formErrors.clinicId && (
        <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl">
         <p className="text-sm font-black text-rose-700 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {formErrors.clinicId}
         </p>
        </div>
       )}

       {/* Multi-Day Selection (Only for new slots) */}
       {!formData.id && (
        <div className="space-y-3">
         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">
          اختيار الأيام (يمكن اختيار عدة أيام)
         </label>
         <div className="flex flex-wrap gap-3">
          {daysOfWeek.map(day => {
           const isSelected = selectedDays.includes(day.name);
           return (
            <button
             key={day.id}
             type="button"
             onClick={() => toggleDaySelection(day.name)}
             className={`px-6 py-3 rounded-2xl text-sm font-black transition-all border-2 ${isSelected
              ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20 scale-105'
              : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-white hover:border-blue-300 hover:text-blue-500'
              }`}
            >
             {day.name}
             {isSelected && (
              <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
             )}
            </button>
           );
          })}
         </div>
         {formErrors.days && (
          <p className="text-xs font-black text-rose-500 mt-2">{formErrors.days}</p>
         )}
         {selectedDays.length > 0 && (
          <p className="text-xs font-bold text-blue-600 mt-2">
           تم اختيار {selectedDays.length} يوم: {selectedDays.join('، ')}
          </p>
         )}
        </div>
       )}

       {/* Single Day Selection (For editing) */}
       {formData.id && (
        <div className="space-y-3">
         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">يوم التكرار</label>
         <select
          className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 font-bold appearance-none bg-white cursor-pointer transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none"
          value={formData.day || 'السبت'}
          onChange={e => setFormData({ ...formData, day: e.target.value })}
         >
          {daysOfWeek.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
         </select>
        </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">نوع الخدمة المتاحة</label>
         <select
          className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 font-bold appearance-none bg-white cursor-pointer transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none"
          value={formData.type || 'كشف'}
          onChange={e => setFormData({ ...formData, type: e.target.value as any })}
         >
          <option value="كشف">كشف جديد</option>
          <option value="استشارة">استشارة / متابعة</option>
         </select>
        </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">وقت بدء الفترة</label>
         <input
          type="time"
          className={`w-full px-6 py-4 rounded-2xl border-2 font-black transition-all focus:ring-4 focus:ring-blue-500/10 outline-none ${formErrors.startTime ? 'border-rose-400 focus:border-rose-400' : 'border-slate-100 focus:border-blue-400'
           }`}
          value={formData.startTime || '09:00'}
          onChange={e => handleTimeChange('startTime', e.target.value)}
         />
         {formErrors.startTime && (
          <p className="text-xs font-black text-rose-500">{formErrors.startTime}</p>
         )}
        </div>
        <div className="space-y-3">
         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">وقت انتهاء الفترة</label>
         <input
          type="time"
          className={`w-full px-6 py-4 rounded-2xl border-2 font-black transition-all focus:ring-4 focus:ring-blue-500/10 outline-none ${formErrors.endTime ? 'border-rose-400 focus:border-rose-400' : 'border-slate-100 focus:border-blue-400'
           }`}
          value={formData.endTime || '12:00'}
          onChange={e => handleTimeChange('endTime', e.target.value)}
         />
         {formErrors.endTime && (
          <p className="text-xs font-black text-rose-500">{formErrors.endTime}</p>
         )}
        </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">مدة الكشف (دقائق)</label>
         <input
          type="number"
          placeholder="30"
          min="1"
          className={`w-full px-6 py-4 rounded-2xl border-2 font-black transition-all focus:ring-4 focus:ring-blue-500/10 outline-none ${formErrors.duration ? 'border-rose-400 focus:border-rose-400' : 'border-slate-100 focus:border-blue-400'
           }`}
          value={formData.duration === undefined || formData.duration === '' ? '' : formData.duration}
          onChange={e => handleNumericChange('duration', e.target.value)}
         />
         {formErrors.duration && (
          <p className="text-xs font-black text-rose-500">{formErrors.duration}</p>
         )}
        </div>
        <div className="space-y-3">
         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">السعة (عدد الحالات)</label>
         <input
          type="hidden"
          placeholder="10"
          min="1"
          className={`w-full px-6 py-4 rounded-2xl border-2 font-black transition-all focus:ring-4 focus:ring-blue-500/10 outline-none ${formErrors.capacity ? 'border-rose-400 focus:border-rose-400' : 'border-slate-100 focus:border-blue-400'
           }`}
          value={formData.capacity === undefined || formData.capacity === '' ? '' : formData.capacity}
          onChange={e => handleNumericChange('capacity', e.target.value)}
         />
         {formErrors.capacity && (
          <p className="text-xs font-black text-rose-500">{formErrors.capacity}</p>
         )}
        </div>
       </div>
      </div>

      <div className="flex gap-6 mt-12 pt-10 border-t border-slate-50">
       <button onClick={() => { setShowModal(false); setFormErrors({}); setSelectedDays([]); }} className="flex-1 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">إلغاء الأمر</button>
       <button onClick={handleSaveSlot} className="flex-1 py-5 text-[11px] font-black uppercase tracking-widest text-white bg-blue-600 rounded-2xl shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95">
        {formData.id ? 'حفظ التعديلات' : `تأكيد الإضافة (${selectedDays.length || 1} فترة)`}
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
};

export default Appointments;
