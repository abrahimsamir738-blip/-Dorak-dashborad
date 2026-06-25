import React from 'react';
import { Clinic } from '../types';
import { authAPI } from '../services/api';

interface SidebarProps {
 currentTab: string;
 setTab: (tab: string) => void;
 clinics: Clinic[];
 selectedClinicId: string;
 setSelectedClinicId: (id: string) => void;
 doctorProfile: { name: string; title: string; photo: string };
 isOpen: boolean;
 onClose: () => void;
 onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab, clinics, selectedClinicId, setSelectedClinicId, doctorProfile, isOpen, onClose, onLogout }) => {
 const menuItems = [
  { id: 'dashboard', label: 'الإحصائيات العامة', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'clinics', label: 'عياداتي', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'orders', label: 'حجوزات العيادة', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { id: 'schedule', label: 'تنظيم المواعيد', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'profile', label: 'الملف الشخصي', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
 ];

 const handleLogout = async () => {
  try {
   await authAPI.logout();
  } catch (e) {
   // حتى لو فشل الـ API، امسح الـ local data
  } finally {
   onLogout();
  }
 };

 return (
  <>
   {isOpen && (
    <div
     className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
     onClick={onClose}
    />
   )}

   <div className={`w-64 bg-[#0f172a] h-screen border-l border-slate-800 flex flex-col fixed right-0 top-0 z-50 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
    <div className="flex items-center justify-between p-6">
     <div
      onClick={() => { setTab('dashboard'); onClose(); }}
      className="flex items-center gap-3 cursor-pointer group transition-all"
     >
      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:bg-blue-600 transition-all">
       د
      </div>
      <span className="font-bold text-xl text-white tracking-tight group-hover:text-blue-400 transition-colors">دوك فلو</span>
     </div>
     <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
     </button>
    </div>

    <div className="px-4 mb-4">
     <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mr-2">العيادة النشطة</label>
     <select
      value={selectedClinicId}
      onChange={(e) => setSelectedClinicId(e.target.value)}
      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
     >
      {clinics.map(c => (
       <option key={c.id} value={c.id}>{c.name}</option>
      ))}
     </select>
    </div>

    <nav className="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto">
     {menuItems.map((item) => (
      <button
       key={item.id}
       onClick={() => { setTab(item.id); onClose(); }}
       className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentTab === item.id
         ? 'bg-blue-600/20 text-blue-400 font-semibold border-r-4 border-blue-500 rounded-r-none'
         : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
        }`}
      >
       <svg className="w-5 h-5 rtl:scale-x-[-1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
       </svg>
       <span className="text-right flex-1">{item.label}</span>
      </button>
     ))}
    </nav>

    <div className="p-4 border-t border-slate-800 space-y-3">
     {/* Doctor Info */}
     <div className="bg-slate-800/50 rounded-2xl p-4 text-white border border-slate-700">
      <div className="flex items-center gap-3 mb-2">
       <img src={doctorProfile.photo} className="w-8 h-8 rounded-lg object-cover bg-slate-700" alt="Doctor" />
       <div>
        <p className="text-sm font-semibold text-slate-200 leading-none">{doctorProfile.name}</p>
        <p className="text-[10px] text-slate-500 mt-1">{doctorProfile.title}</p>
       </div>
      </div>
      <div className="flex items-center gap-2">
       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
       <span className="text-[10px] text-emerald-400 font-medium">متصل الآن</span>
      </div>
     </div>

     {/* Logout Button */}
     <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 border border-transparent hover:border-red-500/20"
     >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span className="text-sm font-semibold">تسجيل الخروج</span>
     </button>
    </div>
   </div>
  </>
 );
};

export default Sidebar;