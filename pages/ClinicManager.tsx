import React, { useState } from 'react';
import { Clinic } from '../types';
import { clinicAPI } from '../services/api';
import { useApp } from '../contexts/AppContext';

interface ClinicManagerProps {
 clinics: Clinic[];
 setClinics: (clinics: Clinic[]) => void;
 onRefresh?: () => void;
}

const ClinicManager: React.FC<ClinicManagerProps> = ({ clinics, setClinics, onRefresh }) => {
 const { showToast, showLoading, hideLoading } = useApp();
 const [showModal, setShowModal] = useState(false);
 const [editingClinic, setEditingClinic] = useState<Partial<Clinic>>({});
 const [photoFile, setPhotoFile] = useState<File | null>(null);

 const handleSave = async () => {
  if (!editingClinic.name || !editingClinic.address) {
   showToast('يرجى ملء اسم الفرع والعنوان', 'warning');
   return;
  }

  const consultationFee = editingClinic.consultationFee ?? 300;
  const maxPatientsPerDay = editingClinic.maxPatientsPerDay ?? 20;

  showLoading(editingClinic.id ? 'جاري تحديث العيادة...' : 'جاري إنشاء العيادة...');
  try {
   const formData = new FormData();
   formData.append('name', editingClinic.name || '');
   formData.append('address', editingClinic.address || '');
   formData.append('consultation_fee', String(consultationFee));
   formData.append('max_patients_per_day', String(maxPatientsPerDay));
   formData.append('working_hours', editingClinic.workingHours || '9ص - 9م');
   formData.append('current_serving_number', String(editingClinic.currentServingNumber || 0));
   formData.append('is_closed_today', editingClinic.isClosedToday ? '1' : '0');
   if (editingClinic.mapLink) formData.append('map_link', editingClinic.mapLink);
   if (photoFile) formData.append('photo', photoFile);

   if (editingClinic.id) {
    formData.append('_method', 'PUT');
    await clinicAPI.updateFormData(editingClinic.id, formData);
    showToast('تم تحديث العيادة بنجاح', 'success');
   } else {
    await clinicAPI.createFormData(formData);
    showToast('تم إنشاء العيادة بنجاح', 'success');
   }

   setPhotoFile(null);
   if (onRefresh) onRefresh();
   setShowModal(false);
   setEditingClinic({});
  } catch (error: any) {
   const message = error.response?.data?.message || 'فشل حفظ العيادة';
   showToast(message, 'error');
  } finally {
   hideLoading();
  }
 };

 const deleteClinic = async (id: string) => {
  if (clinics.length <= 1) {
   showToast('يجب أن تتوفر عيادة واحدة على الأقل', 'warning');
   return;
  }

  if (!window.confirm('هل أنت متأكد من حذف هذه العيادة؟ سيتم حذف جميع الحجوزات والجداول المرتبطة بها.')) {
   return;
  }

  showLoading('جاري حذف العيادة...');
  try {
   await clinicAPI.delete(id);
   showToast('تم حذف العيادة بنجاح', 'success');
   if (onRefresh) onRefresh();
  } catch (error: any) {
   const message = error.response?.data?.message || 'فشل حذف العيادة';
   showToast(message, 'error');
  } finally {
   hideLoading();
  }
 };

 const handleClinicPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
   const file = e.target.files[0];
   setPhotoFile(file);
   const url = URL.createObjectURL(file);
   setEditingClinic({ ...editingClinic, photo: url });
  }
 };

 const handleNumericChange = (field: keyof Clinic, value: string) => {
  if (value === '') {
   setEditingClinic({ ...editingClinic, [field]: undefined });
  } else {
   const num = parseInt(value, 10);
   setEditingClinic({ ...editingClinic, [field]: isNaN(num) ? undefined : Math.max(0, num) });
  }
 };

 const handleOpenModal = (clinic?: Clinic) => {
  if (clinic) {
   setEditingClinic(clinic);
  } else {
   setEditingClinic({ consultationFee: 300, maxPatientsPerDay: 20, workingHours: '9ص - 9م' });
  }
  setPhotoFile(null);
  setShowModal(true);
 };

 return (
  <div className="space-y-8 text-right">
   <div className="flex justify-between items-center">
    <div>
     <h1 className="text-2xl font-bold text-slate-900">إدارة عياداتي</h1>
     <p className="text-slate-500 text-sm">أضف عيادات جديدة أو قم بتعديل بيانات وفروع العيادات الحالية.</p>
    </div>
    <button
     onClick={() => handleOpenModal()}
     className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
    >
     + إضافة فرع جديد
    </button>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {clinics.map(clinic => (
     <div key={clinic.id} className="bg-white overflow-hidden rounded-3xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all group flex flex-col">
      <div className="h-40 relative">
       <img
        src={clinic.photo || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400&h=200'}
        className="w-full h-full object-cover"
        alt={clinic.name}
       />
       <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
       <div className="absolute bottom-4 right-4 text-white">
        <h3 className="text-lg font-bold">{clinic.name}</h3>
        <p className="text-[10px] opacity-80">{clinic.address}</p>
       </div>
       <div className="absolute top-4 left-4 flex gap-1">
        <button
         onClick={() => handleOpenModal(clinic)}
         className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/40 transition-all"
        >
         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
        <button
         onClick={() => deleteClinic(clinic.id)}
         className="p-2 bg-rose-500/20 backdrop-blur-md rounded-lg text-white hover:bg-rose-500/40 transition-all"
        >
         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
       </div>
      </div>

      <div className="p-6 space-y-4 flex-1">
       <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
         <p className="text-[10px] font-bold text-slate-400 mb-1">سعر الكشف</p>
         <p className="text-sm font-black text-slate-800">{clinic.consultationFee} ج.م</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
         <p className="text-[10px] font-bold text-slate-400 mb-1">السعة اليومية</p>
         <p className="text-sm font-black text-slate-800">{clinic.maxPatientsPerDay} مريض</p>
        </div>
       </div>

       <div className="text-xs space-y-2">
        <div className="flex justify-between">
         <span className="text-slate-400">ساعات العمل:</span>
         <span className="font-bold text-slate-700">{clinic.workingHours}</span>
        </div>
        {clinic.mapLink && (
         <a href={clinic.mapLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-500 font-bold hover:underline">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          عرض الموقع على الخريطة
         </a>
        )}
       </div>

       <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">حالة الفرع</span>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${clinic.isClosedToday ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
         {clinic.isClosedToday ? 'مغلق اليوم' : 'مفتوح للجمهور'}
        </div>
       </div>
      </div>
     </div>
    ))}
   </div>

   {showModal && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
     <div className="bg-white rounded-[2rem] w-full max-w-2xl p-10 shadow-2xl border border-slate-100 text-right overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300">
      <h3 className="text-xl font-bold text-slate-900 mb-8">{editingClinic.id ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد لعيادتك'}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
       <div className="space-y-6">
        <div>
         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">صورة العيادة</label>
         <div className="relative h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center group overflow-hidden transition-colors hover:border-blue-400">
          {editingClinic.photo ? (
           <img src={editingClinic.photo} className="w-full h-full object-cover" alt="preview" />
          ) : (
           <>
            <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="text-[10px] text-slate-400 font-bold">رفع صورة الفرع</p>
           </>
          )}
          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleClinicPhotoChange} accept="image/*" />
         </div>
         {photoFile && (
          <p className="text-[10px] text-emerald-500 font-bold mt-1">✓ تم اختيار: {photoFile.name}</p>
         )}
        </div>

        <div>
         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">رابط الموقع (Google Maps)</label>
         <input
          type="text"
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-right outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
          value={editingClinic.mapLink || ''}
          onChange={e => setEditingClinic({ ...editingClinic, mapLink: e.target.value })}
          placeholder="رابط خرائط جوجل..."
         />
        </div>
       </div>

       <div className="space-y-6">
        <div>
         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">اسم الفرع</label>
         <input
          type="text"
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-right outline-none focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
          value={editingClinic.name || ''}
          onChange={e => setEditingClinic({ ...editingClinic, name: e.target.value })}
          placeholder="مثال: فرع المهندسين"
         />
        </div>
        <div>
         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">العنوان</label>
         <input
          type="text"
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-right outline-none focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
          value={editingClinic.address || ''}
          onChange={e => setEditingClinic({ ...editingClinic, address: e.target.value })}
          placeholder="العنوان بالتفصيل"
         />
        </div>
        <div className="grid grid-cols-2 gap-4">
         <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">سعر الكشف (ج.م)</label>
          <input
           type="number"
           placeholder="0"
           className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-right outline-none focus:ring-4 focus:ring-blue-500/10 font-black transition-all"
           value={editingClinic.consultationFee === undefined ? '' : editingClinic.consultationFee}
           onChange={e => handleNumericChange('consultationFee', e.target.value)}
          />
         </div>
         <div className="hidden">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">ساعات العمل</label>
          <input
           type="text"
           className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-right outline-none focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
           value={editingClinic.workingHours || ''}
           onChange={e => setEditingClinic({ ...editingClinic, workingHours: e.target.value })}
           placeholder="مثال: 4م - 10م"
          />
         </div>
        </div>
        <div>
         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">السعة اليومية (عدد الحالات)</label>
         <input
          type="number"
          placeholder="0"
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-right outline-none focus:ring-4 focus:ring-blue-500/10 font-black transition-all"
          value={editingClinic.maxPatientsPerDay === undefined ? '' : editingClinic.maxPatientsPerDay}
          onChange={e => handleNumericChange('maxPatientsPerDay', e.target.value)}
         />
        </div>
        <div className="flex items-center gap-3 py-2">
         <button
          type="button"
          onClick={() => setEditingClinic({ ...editingClinic, isClosedToday: !editingClinic.isClosedToday })}
          className={`w-12 h-6 rounded-full relative transition-all ${editingClinic.isClosedToday ? 'bg-rose-500 shadow-rose-500/20 shadow-lg' : 'bg-slate-200'}`}
         >
          <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-all ${editingClinic.isClosedToday ? 'left-1' : 'right-1'}`}></div>
         </button>
         <span className="text-sm font-bold text-slate-600">تفعيل وضع الإغلاق (Vacation Mode)</span>
        </div>
       </div>
      </div>

      <div className="flex gap-4 mt-10">
       <button
        onClick={() => { setShowModal(false); setPhotoFile(null); }}
        className="flex-1 py-4 text-xs font-bold text-slate-400 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all"
       >
        إلغاء
       </button>
       <button
        onClick={handleSave}
        className="flex-1 py-4 text-xs font-bold text-white bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all"
       >
        تأكيد البيانات
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
};

export default ClinicManager;