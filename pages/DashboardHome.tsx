import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clinic, Order } from '../types';

interface DashboardProps {
 clinics: Clinic[];
 selectedClinicId: string;
 setSelectedClinicId: (id: string) => void;
 orders: Order[];
 // هذه الدالة أساسية لتبديل الصفحات في نظام الصفحة الواحدة
 setActiveTab: (tab: string) => void;
}

const chartData = [
 { name: '08:00', patients: 2 },
 { name: '10:00', patients: 5 },
 { name: '12:00', patients: 8 },
 { name: '14:00', patients: 12 },
 { name: '16:00', patients: 15 },
 { name: '18:00', patients: 18 },
 { name: '20:00', patients: 20 },
];

const DashboardHome: React.FC<DashboardProps> = ({
 clinics,
 selectedClinicId,
 setSelectedClinicId,
 orders,
 setActiveTab
}) => {
 const activeClinic = clinics.find(c => c.id === selectedClinicId) || clinics[0] || null;

 if (!activeClinic) {
  return (
   <div className="flex flex-col items-center justify-center py-20">
    <p className="text-sm text-slate-500">لا توجد عيادة محددة</p>
   </div>
  );
 }

 const clinicOrders = orders.filter(o => o.clinicId === selectedClinicId);

 const totalCollected = clinicOrders
  .filter(o => o.status === 'تم الكشف' && o.paymentStatus === 'تم دفع الرسوم')
  .reduce((acc, curr) => acc + (curr.consultationFee || 0), 0);

 const checkupCount = clinicOrders.filter(o => o.type === 'كشف').length;
 const followUpCount = clinicOrders.filter(o => o.type === 'استشارة').length;
 const waitingCount = clinicOrders.filter(o => o.status === 'منتظر').length;

 return (
  <div className="space-y-6 md:space-y-8 animate-slide-in">
   {/* Welcome Header */}
   <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
    <div className="w-full text-center md:text-right">
     <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">ملخص الأداء والتحصيل المالي</h1>
     <p className="text-slate-500 text-xs md:text-sm mt-1">عرض البيانات الخاصة بفرع: <span className="text-blue-600 font-bold">{activeClinic.name}</span></p>
    </div>

    <div className="w-full md:w-72">
     <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 mr-2">تبديل الفرع</label>
     <select
      value={selectedClinicId}
      onChange={(e) => setSelectedClinicId(e.target.value)}
      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold text-slate-800 outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20"
     >
      {clinics.map(c => (
       <option key={c.id} value={c.id}>{c.name}</option>
      ))}
     </select>
    </div>
   </div>

   {/* Stats Grid */}
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
    {[
     { id: 'total', label: 'إجمالي التحصيل', val: totalCollected, unit: 'ج.م', color: 'emerald', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
     { id: 'checkups', label: 'كشوفات اليوم', val: checkupCount, unit: 'حالة', color: 'blue', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
     { id: 'consults', label: 'الاستشارات', val: followUpCount, unit: 'متابعة', color: 'purple', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
     { id: 'waiting', label: 'بانتظار الدور', val: waitingCount, unit: 'مريض', color: 'amber', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
    ].map((stat, i) => (
     <div
      key={i}
      onClick={() => stat.id === 'checkups' && setActiveTab('orders')} className={`bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group ${stat.id === 'checkups' ? 'cursor-pointer active:scale-95' : ''}`}
     >
      <div className={`w-12 h-12 md:w-14 md:h-14 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
       <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} /></svg>
      </div>
      <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
      <div className="flex items-baseline gap-2">
       <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">{stat.val.toLocaleString()}</h3>
       <span className="text-xs font-bold text-slate-400">{stat.unit}</span>
      </div>
     </div>
    ))}
   </div>

   {/* Charts & Queue Row */}
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
    <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
     <div className="flex justify-between items-center mb-8">
      <h3 className="font-black text-slate-800 text-lg">تحليل الزيارات اليومي</h3>
      <div className="flex gap-2">
       <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span><span className="text-[10px] font-bold text-slate-400">الزيارات</span></div>
      </div>
     </div>
     <div className="h-64 md:h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
       <AreaChart data={chartData}>
        <defs>
         <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
         </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
        <YAxis orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} dx={10} />
        <Tooltip
         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
         itemStyle={{ color: '#2563eb' }}
        />
        <Area type="monotone" dataKey="patients" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
       </AreaChart>
      </ResponsiveContainer>
     </div>
    </div>

    <div className="bg-[#0f172a] p-6 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-slate-800 flex flex-col">
     <h3 className="font-black text-slate-100 mb-6 flex items-center gap-3">
      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
      تحديثات الطابور الحية
     </h3>

     <div className="space-y-4 flex-1">
      {clinicOrders.length > 0 ? clinicOrders.filter(o => o.status !== 'ملغي').slice(-4).reverse().map((order, i) => (
       <div key={i} className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
        <div className="flex justify-between items-center mb-1">
         <p className="text-xs font-bold text-slate-100 truncate max-w-[150px]">{order.patientName}</p>
         <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg">#{order.queueNumber}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold">
         <span className="text-slate-500">{order.type}</span>
         <span className={order.status === 'تم الكشف' ? 'text-emerald-400' : 'text-amber-400'}>{order.status}</span>
        </div>
       </div>
      )) : (
       <div className="h-full flex flex-col items-center justify-center opacity-40">
        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p className="text-xs font-bold">لا توجد حجوزات نشطة</p>
       </div>
      )}
     </div>

     <div className="mt-8 pt-6 border-t border-slate-800/50">
      <div className="flex justify-between items-center bg-blue-600/20 rounded-2xl p-4 border border-blue-500/30">
       <div className="flex flex-col">
        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">الرقم الحالي</span>
        <span className="text-2xl font-black text-white leading-none">#{activeClinic.currentServingNumber}</span>
       </div>
       <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
       </div>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
};

export default DashboardHome;