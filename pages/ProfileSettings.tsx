
import React, { useState } from 'react';
import { DoctorProfile } from '../types';
import { doctorAPI } from '../services/api';
import { useApp } from '../contexts/AppContext';
import SearchableSelect from '../components/SearchableSelect';

// Full list of medical specialties
const MEDICAL_SPECIALTIES = [
 'مخ وأعصاب',
 'رمد وجراحة عيون',
 'قلب وأوعية دموية',
 'باطنة العامة',
 'أطفال وحديثي الولادة',
 'جراحة عامة',
 'عظام',
 'جلدية وتجميل',
 'نساء وتوليد',
 'أسنان',
 'أنف وأذن وحنجرة',
 'مسالك بولية',
 'أمراض نفسية وعصبية',
 'علاج طبيعي وتأهيل',
 'أورام',
 'أشعة',
 'تحاليل طبية',
 'تخسيس وتغذية',
];

interface ProfileSettingsProps {
 profile: DoctorProfile;
 setProfile: (p: DoctorProfile) => void;
 onUpdate?: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, setProfile, onUpdate }) => {
 const { showToast, showLoading, hideLoading } = useApp();
 const [formData, setFormData] = useState<DoctorProfile>(profile);
 const [isSaved, setIsSaved] = useState(false);

 const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  showLoading('جاري حفظ الملف الشخصي...');
  try {
   await doctorAPI.updateProfile({
    name: formData.name,
    title: formData.title,
    specialty: formData.specialty,
    bio: formData.bio,
    photo: formData.photo,
   });

   setProfile(formData);
   setIsSaved(true);
   showToast('تم حفظ الملف الشخصي بنجاح', 'success');
   setTimeout(() => setIsSaved(false), 3000);

   if (onUpdate) onUpdate();
  } catch (error: any) {
   const message = error.response?.data?.message || 'فشل حفظ الملف الشخصي';
   showToast(message, 'error');
  } finally {
   hideLoading();
  }
 };

 const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // In a real app, you'd upload to a server. Here we simulate with a placeholder.
  if (e.target.files && e.target.files[0]) {
   const url = URL.createObjectURL(e.target.files[0]);
   setFormData({ ...formData, photo: url });
  }
 };

 return (
  <div className="max-w-4xl mx-auto text-right space-y-8">
   <div>
    <h1 className="text-2xl font-bold text-slate-900">الملف الشخصي للطبيب</h1>
    <p className="text-slate-500 text-sm mt-1">إدارة بياناتك الشخصية والنبذة التعريفية التي تظهر للمرضى.</p>
   </div>

   <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div className="md:col-span-1 space-y-6">
     <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">الصورة الشخصية</label>
      <div className="relative group w-32 h-32 mx-auto mb-4">
       <img
        src={formData.photo}
        className="w-full h-full rounded-[2rem] object-cover ring-4 ring-slate-50 shadow-md"
        alt="Profile Preview"
       />
       <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
        تغيير الصورة
        <input type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
       </label>
      </div>
      <p className="text-[10px] text-slate-400">يفضل صورة مربعة بحجم 400x400</p>
     </div>
    </div>

    <div className="md:col-span-2 space-y-6">
     <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">الاسم الكامل</label>
        <input
         type="text"
         className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 text-right font-medium"
         value={formData.name}
         onChange={e => setFormData({ ...formData, name: e.target.value })}
        />
       </div>
       <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">اللقب المهني</label>
        <input
         type="text"
         className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 text-right font-medium"
         value={formData.title}
         onChange={e => setFormData({ ...formData, title: e.target.value })}
         placeholder="مثال: استشاري جراحة"
        />
       </div>
      </div>

      <div>
       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">التخصص الطبي</label>
       <SearchableSelect
        options={MEDICAL_SPECIALTIES}
        value={formData.specialty}
        onChange={(value) => setFormData({ ...formData, specialty: value })}
        placeholder="اختر التخصص الطبي..."
        className="w-full"
       />
      </div>

      <div>
       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">النبذة التعريفية (Bio)</label>
       <textarea
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 text-right font-medium h-32 resize-none"
        value={formData.bio}
        onChange={e => setFormData({ ...formData, bio: e.target.value })}
        placeholder="اكتب نبذة مختصرة عن مسيرتك المهنية..."
       />
      </div>

      <div className="pt-4 flex justify-end gap-4 items-center">
       {isSaved && (
        <span className="text-emerald-600 text-sm font-bold flex items-center gap-2 animate-pulse">
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
         تم حفظ التغييرات
        </span>
       )}
       <button
        type="submit"
        className="px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
       >
        حفظ الملف الشخصي
       </button>
      </div>
     </div>
    </div>
   </form>
  </div>
 );
};

export default ProfileSettings;
