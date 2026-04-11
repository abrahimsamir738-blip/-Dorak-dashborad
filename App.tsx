import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardHome from './pages/DashboardHome';
import Orders from './pages/Orders';
import ClinicManager from './pages/ClinicManager';
import Appointments from './pages/Appointments';
import ProfileSettings from './pages/ProfileSettings';
import Login from './pages/Login';
import { Clinic, Order, Appointment, DoctorProfile, TimeSlot } from './types';
import { clinicAPI, orderAPI, scheduleAPI, doctorAPI, authAPI } from './services/api';
import { useApp } from './contexts/AppContext';
import { transformClinic, transformOrder, transformTimeSlot } from './utils/dataTransform';

const App: React.FC = () => {
 const [isAuthenticated, setIsAuthenticated] = useState(false);
 const [isInitializing, setIsInitializing] = useState(true);
 const [activeTab, setActiveTab] = useState('dashboard');
 const [isBookingEnabled, setIsBookingEnabled] = useState(true);
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const { showToast, showLoading, hideLoading } = useApp();

 const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>({
  name: '',
  title: '',
  specialty: '',
  bio: '',
  photo: ''
 });

 const [clinics, setClinics] = useState<Clinic[]>([]);
 const [selectedClinicId, setSelectedClinicId] = useState<string>('');
 const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
 const [orders, setOrders] = useState<Order[]>([]);

 // Check authentication on mount
 useEffect(() => {
  const token = localStorage.getItem('auth_token');
  if (token) {
   loadInitialData();
  } else {
   setIsInitializing(false);
  }
 }, []);

 const loadInitialData = async () => {
  showLoading('جاري تحميل البيانات...');
  try {
   // Load doctor profile
   const doctorData = await doctorAPI.getProfile();
   setDoctorProfile({
    name: doctorData.name,
    title: doctorData.title || '',
    specialty: doctorData.specialty || '',
    bio: doctorData.bio || '',
    photo: doctorData.photo || ''
   });

   // Load clinics
   const clinicsData = await clinicAPI.getAll();
   const transformedClinics = clinicsData.map(transformClinic);
   setClinics(transformedClinics);

   if (transformedClinics.length > 0) {
    setSelectedClinicId(transformedClinics[0].id);
    // Load orders and schedules for first clinic
    await loadClinicData(transformedClinics[0].id);
   }

   setIsAuthenticated(true);
   showToast('تم تحميل البيانات بنجاح', 'success');
  } catch (error: any) {
   showToast('فشل تحميل البيانات', 'error');
   if (error.response?.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('doctor');
   }
  } finally {
   hideLoading();
   setIsInitializing(false);
  }
 };

 const loadClinicData = async (clinicId: string) => {
  try {
   const [ordersData, schedulesData] = await Promise.all([
    orderAPI.getAll(clinicId),
    scheduleAPI.getAll(clinicId)
   ]);

   setOrders(ordersData.map(transformOrder));
   setTimeSlots(schedulesData.map(transformTimeSlot));
  } catch (error) {
   showToast('فشل تحميل بيانات العيادة', 'error');
  }
 };

 // Reload clinic data when clinic changes
 useEffect(() => {
  if (selectedClinicId && isAuthenticated) {
   loadClinicData(selectedClinicId);
  }
 }, [selectedClinicId]);

 const handleLoginSuccess = () => {
  setIsAuthenticated(true);
  loadInitialData();
 };

 const activeClinic = clinics.find(c => c.id === selectedClinicId) || clinics[0] || null;

 const handleRefreshOrders = async () => {
  if (selectedClinicId) {
   try {
    const ordersData = await orderAPI.getAll(selectedClinicId);
    setOrders(ordersData.map(transformOrder));
   } catch (error) {
    showToast('فشل تحديث الحجوزات', 'error');
   }
  }
 };

 const handleRefreshClinics = async () => {
  try {
   const clinicsData = await clinicAPI.getAll();
   const transformedClinics = clinicsData.map(transformClinic);
   setClinics(transformedClinics);

   // If current selected clinic no longer exists, select first one
   if (!transformedClinics.find(c => c.id === selectedClinicId) && transformedClinics.length > 0) {
    setSelectedClinicId(transformedClinics[0].id);
   }
  } catch (error) {
   showToast('فشل تحديث العيادات', 'error');
  }
 };

 const renderContent = () => {
  if (!isAuthenticated) {
   return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (isInitializing) {
   return null; // Loading handled by AppContext
  }

  switch (activeTab) {
   case 'dashboard':
    return (
     <DashboardHome
      clinics={clinics}
      selectedClinicId={selectedClinicId}
      setSelectedClinicId={setSelectedClinicId}
      orders={orders}
      setActiveTab={setActiveTab} // تم إضافة التمرير هنا
     />
    );
   case 'orders':
    return <Orders orders={orders} setOrders={setOrders} selectedClinicId={selectedClinicId} clinics={clinics} setClinics={setClinics} doctorName={doctorProfile.name} timeSlots={timeSlots} setTimeSlots={setTimeSlots} onRefresh={handleRefreshOrders} />;
   case 'clinics':
    return <ClinicManager clinics={clinics} setClinics={setClinics} onRefresh={handleRefreshClinics} />;
   case 'schedule':
    return <Appointments selectedClinicId={selectedClinicId} clinics={clinics} setClinics={setClinics} timeSlots={timeSlots} setTimeSlots={setTimeSlots} onRefresh={() => loadClinicData(selectedClinicId)} />;
   case 'profile':
    return <ProfileSettings profile={doctorProfile} setProfile={setDoctorProfile} onUpdate={loadInitialData} />;
   default:
    return (
     <DashboardHome
      clinics={clinics}
      selectedClinicId={selectedClinicId}
      setSelectedClinicId={setSelectedClinicId}
      orders={orders}
      setActiveTab={setActiveTab} // تم إضافة التمرير هنا أيضاً
     />
    );
  }
 };

 if (!isAuthenticated && !isInitializing) {
  return <Login onLoginSuccess={handleLoginSuccess} />;
 }

 if (isInitializing) {
  return null; // Loading handled by AppContext
 }

 return (
  <div className="min-h-screen flex bg-[#f8fafc] text-right font-['Cairo'] relative">
   <Sidebar
    currentTab={activeTab}
    setTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }}
    clinics={clinics}
    selectedClinicId={selectedClinicId}
    setSelectedClinicId={setSelectedClinicId}
    doctorProfile={doctorProfile}
    isOpen={isSidebarOpen}
    onClose={() => setIsSidebarOpen(false)}
   />

   <main className="flex-1 lg:mr-64 w-full p-4 md:p-8 lg:p-12 transition-all duration-300">
    <header className="mb-6 md:mb-10 flex justify-between items-center gap-4">
     <div className="flex items-center gap-4">
      <button
       onClick={() => setIsSidebarOpen(true)}
       className="lg:hidden p-2 text-slate-600 bg-white rounded-xl border border-slate-100 shadow-sm"
      >
       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
       </svg>
      </button>
      <h2 className="text-lg md:text-xl font-bold text-[#0f172a] truncate max-w-[150px] md:max-w-none">
       {activeTab === 'dashboard' ? 'الإحصائيات والتحليلات' :
        activeTab === 'orders' ? 'إدارة الطابور والدور' :
         activeTab === 'clinics' ? 'إدارة عياداتي وفروعي' :
          activeTab === 'profile' ? 'الملف الشخصي للطبيب' : 'تنظيم المواعيد والجدول'}
      </h2>
     </div>

     <div className="flex items-center gap-2 md:gap-6">
      <div className="hidden sm:flex items-center gap-4 border-l border-slate-200 pl-6 ml-6">
       <div className="flex items-center gap-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isBookingEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
         {isBookingEnabled ? 'الحجز متاح' : 'معلق'}
        </span>
        <button
         onClick={() => setIsBookingEnabled(!isBookingEnabled)}
         className={`w-10 h-5 rounded-full p-1 transition-all relative ${isBookingEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
        >
         <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${isBookingEnabled ? 'translate-x-[-1.25rem]' : 'translate-x-0'}`}></div>
        </button>
       </div>
      </div>

      <div
       onClick={() => setActiveTab('profile')}
       className="flex items-center gap-3 bg-white p-1 md:p-1.5 md:pl-4 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:bg-slate-50 transition-all"
      >
       <div className="hidden md:block text-left">
        <p className="text-sm font-bold text-slate-800 leading-none">{doctorProfile.name}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">{doctorProfile.title}</p>
       </div>
       <img src={doctorProfile.photo} className="w-8 h-8 md:w-10 md:h-10 rounded-xl object-cover bg-slate-100" alt="Profile" />
      </div>
     </div>
    </header>

    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
     {activeClinic && (!isBookingEnabled || activeClinic.isClosedToday) && (
      <div className={`mb-6 p-4 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-3 border ${activeClinic.isClosedToday ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
       <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
       <p>
        {activeClinic.isClosedToday ?
         `تنبيه: عيادة "${activeClinic.name}" مغلقة حالياً.` :
         `تنبيه: تم إيقاف الحجز في جميع العيادات.`
        }
       </p>
      </div>
     )}
     {clinics.length === 0 && isAuthenticated && (
      <div className="mb-6 p-6 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-center">
       <p className="text-sm font-bold mb-2">مرحباً! يبدو أنك لم تقم بإنشاء أي عيادات بعد.</p>
       <p className="text-xs">يرجى الانتقال إلى صفحة "إدارة عياداتي" لإنشاء عيادتك الأولى.</p>
      </div>
     )}
     {renderContent()}
    </div>
   </main>
  </div>
 );
};

export default App;