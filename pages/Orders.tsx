import React, { useState, useEffect } from 'react';
import { Order, Clinic, TimeSlot } from '../types';
import { orderAPI } from '../services/api';
import { useApp } from '../contexts/AppContext';
import { transformOrder, transformOrderToBackend } from '../utils/dataTransform';
import { clinicAPI } from '../services/api';

interface OrdersProps {
 orders: Order[];
 setOrders: (orders: Order[]) => void;
 selectedClinicId: string;
 clinics: Clinic[];
 setClinics: (clinics: Clinic[]) => void;
 doctorName: string;
 timeSlots: TimeSlot[];
 setTimeSlots: (slots: TimeSlot[]) => void;
 onRefresh?: () => void;
}

// ─── CalendarPicker ───────────────────────────────────────────────────────────

interface CalendarPickerProps {
 onSelect: (start: string, end: string) => void;
 onClear: () => void;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({ onSelect, onClear }) => {
 const [selecting, setSelecting] = useState<'start' | 'end'>('start');
 const [start, setStart] = useState<string | null>(null);
 const [end, setEnd] = useState<string | null>(null);
 const [viewDate, setViewDate] = useState(() => new Date());

 const year = viewDate.getFullYear();
 const month = viewDate.getMonth();
 const firstDay = new Date(year, month, 1).getDay();
 const daysInMonth = new Date(year, month + 1, 0).getDate();

 const arabicMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
 ];
 const arabicDays = ['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'س'];

 const formatDate = (d: Date) => d.toISOString().split('T')[0];

 const handleDayClick = (day: number) => {
  const clicked = formatDate(new Date(year, month, day));
  if (selecting === 'start' || !start) {
   setStart(clicked);
   setEnd(null);
   setSelecting('end');
  } else {
   if (clicked < start) {
    setEnd(start);
    setStart(clicked);
   } else {
    setEnd(clicked);
   }
   setSelecting('start');
  }
 };

 const isInRange = (day: number) => {
  if (!start || !end) return false;
  const d = formatDate(new Date(year, month, day));
  return d > start && d < end;
 };

 const isStart = (day: number) => start === formatDate(new Date(year, month, day));
 const isEnd = (day: number) => end === formatDate(new Date(year, month, day));

 const blanks = Array.from({ length: firstDay });
 const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

 return (
  <div className="flex flex-col gap-4">
   {/* Month Navigation */}
   <div className="flex items-center justify-between">
    <button
     onClick={() => setViewDate(new Date(year, month + 1))}
     className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
    >
     <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
     </svg>
    </button>
    <span className="text-sm font-black text-slate-700">{arabicMonths[month]} {year}</span>
    <button
     onClick={() => setViewDate(new Date(year, month - 1))}
     className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
    >
     <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
     </svg>
    </button>
   </div>

   {/* Day Headers + Grid */}
   <div className="grid grid-cols-7 gap-1 text-center">
    {arabicDays.map(d => (
     <div key={d} className="text-[10px] font-black text-slate-400 py-1">{d}</div>
    ))}
    {blanks.map((_, i) => <div key={`b${i}`} />)}
    {days.map(day => (
     <button
      key={day}
      onClick={() => handleDayClick(day)}
      className={`w-8 h-8 mx-auto text-xs font-bold transition-all
              ${isStart(day) || isEnd(day)
        ? 'bg-blue-600 text-white rounded-full'
        : isInRange(day)
         ? 'bg-blue-50 text-blue-600 rounded-none'
         : 'hover:bg-slate-100 text-slate-700 rounded-full'
       }
            `}
     >
      {day}
     </button>
    ))}
   </div>

   {/* Hint */}
   <p className="text-[10px] text-slate-400 text-center font-bold">
    {selecting === 'end' && start ? 'اختر تاريخ الانتهاء' : 'اختر تاريخ البداية'}
   </p>

   {/* Actions */}
   <div className="flex gap-2 pt-2 border-t border-slate-100">
    <button
     onClick={onClear}
     className="flex-1 py-2 text-xs font-bold text-slate-400 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
    >
     مسح
    </button>
    <button
     disabled={!start}
     onClick={() => start && onSelect(start, end || start)}
     className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    >
     تطبيق
    </button>
   </div>
  </div>
 );
};

// ─── Orders ───────────────────────────────────────────────────────────────────

const Orders: React.FC<OrdersProps> = ({
 orders,
 setOrders,
 selectedClinicId,
 clinics,
 setClinics,
 doctorName,
 timeSlots,
 setTimeSlots,
 onRefresh,
}) => {
 const { showToast, showLoading, hideLoading } = useApp();

 // Fetch orders when clinic changes
 useEffect(() => {
  if (selectedClinicId) {
   fetchOrders();
  }
 }, [selectedClinicId]);

 const fetchOrders = async () => {
  showLoading('جاري تحميل الحجوزات...');
  try {
   const ordersData = await orderAPI.getAll(selectedClinicId);
   setOrders(ordersData.map(transformOrder));
  } catch (error) {
   showToast('فشل تحميل الحجوزات', 'error');
  } finally {
   hideLoading();
  }
 };

 const [showModal, setShowModal] = useState(false);
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null);
 const [currentOrder, setCurrentOrder] = useState<Partial<Order>>({});
 const [searchQuery, setSearchQuery] = useState('');

 // Filter States
 const [statusFilter, setStatusFilter] = useState('الكل');
 const [paymentFilter, setPaymentFilter] = useState('الكل');
 const [showCalendar, setShowCalendar] = useState(false);
 const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
  start: null,
  end: null,
 });

 const activeClinic = clinics.find(c => c.id === selectedClinicId) || clinics[0];

 const resetFilters = () => {
  setSearchQuery('');
  setStatusFilter('الكل');
  setPaymentFilter('الكل');
  setDateRange({ start: null, end: null });
 };

 const filteredOrders = orders.filter(o => {
  const patientNameSafe = (o.patientName || '').toString().toLowerCase();
  const phoneNumberSafe = (o.phoneNumber || '').toString();
  const querySafe = (searchQuery || '').toString().toLowerCase();

  const matchesSearch = patientNameSafe.includes(querySafe) || phoneNumberSafe.includes(querySafe);
  const matchesClinic = o.clinicId === selectedClinicId;
  const matchesStatus = statusFilter === 'الكل' || o.status === statusFilter;
  const matchesPayment = paymentFilter === 'الكل' || o.paymentStatus === paymentFilter;

  let matchesDate = true;
  if (dateRange.start) {
   const orderDate = (o.date || '').split('T')[0];  // ← هنا الحل
   matchesDate = orderDate >= dateRange.start && orderDate <= (dateRange.end || dateRange.start);
  }

  return matchesClinic && matchesSearch && matchesStatus && matchesPayment && matchesDate;
 });

 const handleCallNext = async () => {
  const nextOrder = orders.find(o => o.clinicId === selectedClinicId && o.status === 'منتظر');
  if (!nextOrder) {
   showToast('لا يوجد مرضى بانتظار دورهم حالياً', 'info');
   return;
  }

  showLoading('جاري تحديث حالة المريض...');
  try {
   await orderAPI.update(nextOrder.id, { status: 'قيد الكشف' });

   await clinicAPI.update(selectedClinicId, {
    current_serving_number: nextOrder.queueNumber,
   });

   await fetchOrders();
   if (onRefresh) onRefresh();
   showToast(`يرجى دخول المريض: ${nextOrder.patientName}`, 'info');
  } catch (error: any) {
   const message = error.response?.data?.message || 'فشل تحديث حالة المريض';
   showToast(message, 'error');
  } finally {
   hideLoading();
  }
 };

 const handleSave = async () => {
  showLoading(currentOrder.id ? 'جاري تحديث الحجز...' : 'جاري إنشاء الحجز...');
  try {
   const orderData = transformOrderToBackend({
    ...currentOrder,
    clinicId: activeClinic.id,
    date: currentOrder.date || new Date().toISOString().split('T')[0],
    status: currentOrder.status || 'منتظر',
    paymentStatus: currentOrder.paymentStatus || 'لم يتم الدفع',
    consultationFee: currentOrder.consultationFee || activeClinic.consultationFee,
    serviceFee: currentOrder.serviceFee || 15,
    patientName: currentOrder.patientName || 'مريض جديد',
    phoneNumber: currentOrder.phoneNumber || '01',
   } as Order);

   if (currentOrder.id) {
    await orderAPI.update(currentOrder.id, orderData);
    showToast('تم تحديث الحجز بنجاح', 'success');
   } else {
    await orderAPI.create(orderData);
    showToast(`تم تسجيل حجز ${orderData.patient_name} بنجاح`, 'success');
   }

   await fetchOrders();
   if (onRefresh) onRefresh();
   setShowModal(false);
   setCurrentOrder({});
  } catch (error: any) {
   const message = error.response?.data?.message || 'فشل حفظ الحجز';
   showToast(message, 'error');
  } finally {
   hideLoading();
  }
 };

 const confirmDelete = async () => {
  if (orderToDeleteId) {
   showLoading('جاري حذف الحجز...');
   try {
    await orderAPI.delete(orderToDeleteId);
    await fetchOrders();
    if (onRefresh) onRefresh();
    setShowDeleteConfirm(false);
    setOrderToDeleteId(null);
    showToast('تم حذف الحجز وتحديث التوافر في الجداول', 'success');
   } catch (error) {
    showToast('فشل حذف الحجز', 'error');
   } finally {
    hideLoading();
   }
  }
 };

 const getWhatsAppLink = (order: Order) => {
  let phone = (order.phoneNumber || '').replace(/\s+/g, '').replace('+', '');
  if (!phone) return '#';
  if (!phone.startsWith('2')) phone = '2' + phone;
  const message = `مرحباً ${order.patientName}، دورك هو رقم: ${order.queueNumber}. دكتور ${doctorName}. يرجى التواجد في الموعد.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
 };

 return (
  <div className="space-y-6 text-right relative pb-10 animate-slide-in">

   {/* Header Section */}
   <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
    <div>
     <h1 className="text-2xl font-black text-slate-900 leading-tight">إدارة حجوزات الطابور</h1>
     <p className="text-slate-500 text-sm mt-1">
      تتبع تدفق المرضى لفرع: <span className="text-blue-600 font-bold">{activeClinic?.name}</span>
     </p>
    </div>

    <div className="flex flex-wrap lg:flex-nowrap gap-3 w-full lg:w-auto items-center">
     <div className="bg-blue-50 border border-blue-100 px-6 py-3 rounded-2xl flex flex-col items-center flex-1 lg:flex-none lg:min-w-[140px] shadow-sm">
      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">الدور الحالي</span>
      <span className="text-2xl font-black text-blue-600 leading-none">#{activeClinic?.currentServingNumber}</span>
     </div>
     <button
      onClick={handleCallNext}
      className="flex-1 lg:flex-none px-8 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all font-bold text-xs"
     >
      استدعاء التالي
     </button>
     <button
      onClick={() => { setCurrentOrder({ phoneNumber: '01', status: 'منتظر' }); setShowModal(true); }}
      className="flex-1 lg:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 shadow-lg transition-all font-bold text-xs"
     >
      + حجز مريض جديد
     </button>
    </div>
   </div>

   {/* Filters Toolbar */}
   <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 items-end">

     {/* Search */}
     <div className="lg:col-span-2 relative group">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mr-2">بحث سريع</label>
      <div className="relative">
       <input
        type="text"
        placeholder="ابحث بالاسم أو رقم الهاتف..."
        className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-200 transition-all text-sm font-bold"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
       />
       <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
       </div>
      </div>
     </div>

     {/* Date Range Picker */}
     <div className="w-full relative">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mr-2">فلترة التاريخ</label>
      <button
       onClick={() => setShowCalendar(!showCalendar)}
       className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-bold cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-between"
      >
       <span className="text-slate-500">
        {dateRange.start
         ? dateRange.end && dateRange.end !== dateRange.start
          ? `${dateRange.start} ← ${dateRange.end}`
          : dateRange.start
         : 'كل الأوقات'}
       </span>
       <svg
        className={`w-4 h-4 text-slate-400 transition-transform ${showCalendar ? 'rotate-180' : ''}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
       >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
       </svg>
      </button>

      {showCalendar && (
       <div
        className="absolute top-full mt-2 right-0 z-50 bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 w-80"
        dir="rtl"
       >
        <CalendarPicker
         onSelect={(start, end) => {
          setDateRange({ start, end });
          setShowCalendar(false);
         }}
         onClear={() => {
          setDateRange({ start: null, end: null });
          setShowCalendar(false);
         }}
        />
       </div>
      )}
     </div>

     {/* Status Filter */}
     <div className="w-full">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mr-2">حالة الكشف</label>
      <select
       className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-bold cursor-pointer hover:bg-slate-100 transition-colors"
       value={statusFilter}
       onChange={(e) => setStatusFilter(e.target.value)}
      >
       <option value="الكل">جميع الحالات</option>
       <option value="منتظر">بانتظار الدور</option>
       <option value="قيد الكشف">قيد الكشف حالياً</option>
       <option value="تم الكشف">تم الانتهاء</option>
       <option value="ملغي">ملغي</option>
      </select>
     </div>

     {/* Reset */}
     <div className="w-full">
      <button
       onClick={resetFilters}
       className="w-full h-[58px] px-6 text-blue-600 bg-blue-50 border border-blue-100 rounded-2xl font-black text-xs hover:bg-blue-100 transition-all flex items-center justify-center gap-3"
      >
       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
       </svg>
       إظهار الكل
      </button>
     </div>
    </div>
   </div>

   {/* Orders Table */}
   <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
    <div className="overflow-x-auto scrollbar-hide">
     <table className="w-full text-right min-w-[950px]">
      <thead className="bg-slate-50 border-b border-slate-100">
       <tr>
        <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">رقم الدور</th>
        <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">المريض</th>
        <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">نوع الخدمة</th>
        <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">تواصل سريع</th>
        <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">حالة الحجز</th>
        <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">المستحقات</th>
        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">الإجراءات</th>
       </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
       {filteredOrders.length > 0 ? filteredOrders.map((order) => (
        <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
         <td className="px-6 py-6 text-center">
          <div className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-2xl font-black text-lg mx-auto shadow-sm">
           {order.queueNumber}
          </div>
         </td>
         <td className="px-6 py-6">
          <p className="font-bold text-slate-800 text-sm">{order.patientName}</p>
          <p className="text-[11px] text-slate-400 font-bold mt-1 tracking-tight">{order.phoneNumber}</p>
         </td>
         <td className="px-6 py-6">
          <span className={`px-3 py-1 rounded-xl text-[10px] font-bold border ${order.type === 'كشف'
           ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
           : 'bg-purple-50 text-purple-600 border-purple-100'
           }`}>
           {order.type}
          </span>
         </td>
         <td className="px-6 py-6 text-center">
          <a
           href={getWhatsAppLink(order)}
           target="_blank"
           rel="noopener noreferrer"
           className="inline-flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white hover:scale-110 transition-all"
          >
           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
           </svg>
          </a>
         </td>
         <td className="px-6 py-6">
          <span className={`px-3 py-1.5 rounded-2xl text-[10px] font-black border ${order.status === 'تم الكشف' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
           order.status === 'قيد الكشف' ? 'bg-blue-50 text-blue-600 border-blue-100' :
            order.status === 'منتظر' ? 'bg-amber-50 text-amber-600 border-amber-100' :
             'bg-rose-50 text-rose-600 border-rose-100'
           }`}>
           {order.status}
          </span>
         </td>
         <td className="px-6 py-6">
          <div className="flex flex-col">
           <span className={`text-[11px] font-black ${order.paymentStatus === 'تم دفع الرسوم' ? 'text-emerald-600' : 'text-slate-400'}`}>
            {order.consultationFee} ج.م
           </span>
           <span className="text-[9px] text-slate-300 font-bold uppercase mt-0.5 tracking-tighter">{order.paymentStatus}</span>
          </div>
         </td>
         <td className="px-8 py-6 text-left">
          <div className="flex gap-2 justify-start lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
           <button
            onClick={() => { setCurrentOrder(order); setShowModal(true); }}
            className="p-2 text-slate-400 hover:text-blue-600 transition-all bg-white border border-slate-100 rounded-xl hover:shadow-sm"
           >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
           </button>
           <button
            onClick={() => { setOrderToDeleteId(order.id); setShowDeleteConfirm(true); }}
            className="p-2 text-slate-400 hover:text-rose-600 transition-all bg-white border border-slate-100 rounded-xl hover:shadow-sm"
           >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
           </button>
          </div>
         </td>
        </tr>
       )) : (
        <tr>
         <td colSpan={7} className="py-24 text-center">
          <div className="flex flex-col items-center opacity-30">
           <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
           </svg>
           <p className="text-lg font-bold">لا يوجد مرضى يطابقون الفلاتر المحددة</p>
          </div>
         </td>
        </tr>
       )}
      </tbody>
     </table>
    </div>
   </div>

   {/* Delete Confirmation Modal */}
   {showDeleteConfirm && (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[250] p-4 animate-in fade-in duration-300">
     <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-300">
      <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
       <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
       </svg>
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-3">تأكيد حذف الحجز</h3>
      <p className="text-sm text-slate-500 mb-8 leading-relaxed">
       عند حذف هذا المريض، سيتم استعادة مكان شاغر في جدول المواعيد تلقائياً وتعديل الإحصائيات المالية.
      </p>
      <div className="flex gap-4">
       <button
        onClick={() => setShowDeleteConfirm(false)}
        className="flex-1 py-4 text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"
       >
        إلغاء
       </button>
       <button
        onClick={confirmDelete}
        className="flex-1 py-4 text-xs font-bold text-white bg-rose-600 rounded-2xl shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all"
       >
        نعم، حذف الحجز
       </button>
      </div>
     </div>
    </div>
   )}

   {/* Booking Dialog */}
   {showModal && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
     <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 md:p-12 shadow-2xl border border-slate-100 text-right overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300">
      <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4">
       <span className="w-1.5 h-8 bg-blue-600 rounded-full"></span>
       {currentOrder.id ? 'تعديل بيانات الحجز' : 'تسجيل حجز جديد'}
      </h3>

      <div className="space-y-6">
       <div className="space-y-2">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">اسم المريض الكامل</label>
        <input
         type="text"
         className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 font-bold text-sm transition-all"
         value={currentOrder.patientName || ''}
         onChange={e => setCurrentOrder({ ...currentOrder, patientName: e.target.value })}
         placeholder="ادخل الاسم الثلاثي..."
        />
       </div>

       <div className="space-y-2">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">رقم الهاتف</label>
        <input
         type="text"
         className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 font-bold text-sm transition-all text-left"
         value={currentOrder.phoneNumber || ''}
         onChange={e => setCurrentOrder({ ...currentOrder, phoneNumber: e.target.value })}
         placeholder="01XXXXXXXXX"
        />
       </div>

       <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">نوع الكشف</label>
         <select
          className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 font-bold text-sm appearance-none bg-white cursor-pointer"
          value={currentOrder.type || 'كشف'}
          onChange={e => setCurrentOrder({ ...currentOrder, type: e.target.value as any })}
         >
          <option value="كشف">كشف جديد</option>
          <option value="استشارة">استشارة / متابعة</option>
         </select>
        </div>
        <div className="space-y-2">
         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">حالة الدفع</label>
         <select
          className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 font-bold text-sm appearance-none bg-white cursor-pointer"
          value={currentOrder.paymentStatus || 'لم يتم الدفع'}
          onChange={e => setCurrentOrder({ ...currentOrder, paymentStatus: e.target.value as any })}
         >
          <option value="لم يتم الدفع">غير مسدد</option>
          <option value="تم دفع الرسوم">تم التحصيل</option>
         </select>
        </div>
       </div>

       <div className="space-y-2">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">ربط بموعد في الجدول</label>
        <select
         className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 font-bold text-sm appearance-none bg-white cursor-pointer"
         value={currentOrder.slotId || ''}
         onChange={e => setCurrentOrder({ ...currentOrder, slotId: e.target.value })}
        >
         <option value="">حجز مباشر (خارج الجدول)</option>
         {timeSlots
          .filter(ts => ts.clinicId === selectedClinicId && ts.bookedCount < ts.capacity)
          .map(ts => (
           <option key={ts.id} value={ts.id}>
            {ts.day} - {ts.startTime} ({ts.bookedCount}/{ts.capacity})
           </option>
          ))}
        </select>
       </div>
      </div>

      <div className="flex gap-6 mt-12 pt-8 border-t border-slate-50">
       <button
        onClick={() => setShowModal(false)}
        className="flex-1 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"
       >
        إلغاء الأمر
       </button>
       <button
        onClick={handleSave}
        className="flex-1 py-5 text-[11px] font-black uppercase tracking-widest text-white bg-blue-600 rounded-2xl shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
       >
        //
        {currentOrder.id ? 'حفظ التعديلات' : 'تأكيد الحجز الآن'}
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
};

export default Orders;
