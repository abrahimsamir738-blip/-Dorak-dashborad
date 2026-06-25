import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { useApp } from '../contexts/AppContext';

interface LoginProps {
 onLoginSuccess: () => void;
}

type ViewType = 'login' | 'register' | 'forgot' | 'forgot_sent';

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
 const [view, setView] = useState<ViewType>('login');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [name, setName] = useState('');
 const [forgotEmail, setForgotEmail] = useState('');

 const { showToast, showLoading, hideLoading } = useApp();

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const loadingMsg = view === 'login' ? 'جاري تسجيل الدخول...' : 'جاري إنشاء الحساب...';
  showLoading(loadingMsg);

  try {
   if (view === 'login') {
    await authAPI.login(email, password);
    showToast('تم تسجيل الدخول بنجاح', 'success');
    setTimeout(() => { hideLoading(); onLoginSuccess(); }, 500);
   } else {
    await authAPI.register(name, email, password);
    showToast('تم إنشاء الحساب بنجاح، يمكنك الدخول الآن', 'success');
    hideLoading();
    setView('login');
   }
  } catch (error: any) {
   hideLoading();
   const message = error.response?.data?.message || 'حدث خطأ ما، يرجى المحاولة لاحقاً';
   showToast(message, 'error');
  }
 };

 const handleForgotPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  showLoading('جاري إرسال الرابط...');
  try {
   await authAPI.forgotPassword(forgotEmail);
   hideLoading();
   setView('forgot_sent');
  } catch (error: any) {
   hideLoading();
   const message = error.response?.data?.message || 'حدث خطأ، يرجى المحاولة لاحقاً';
   showToast(message, 'error');
  }
 };

 // ✅ شاشة "تم الإرسال"
 if (view === 'forgot_sent') {
  return (
   <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md p-10 text-center">
     <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
     </div>
     <h2 className="text-2xl font-black text-slate-900 mb-3">تم الإرسال!</h2>
     <p className="text-slate-500 text-sm mb-8">
      تم إرسال رابط إعادة التعيين إلى
      <span className="font-bold text-slate-700 block mt-1">{forgotEmail}</span>
      <span className="block mt-1">تحقق من بريدك الإلكتروني</span>
     </p>
     <button
      onClick={() => { setView('login'); setForgotEmail(''); }}
      className="text-blue-600 font-bold hover:underline text-sm"
     >
      ← العودة لتسجيل الدخول
     </button>
    </div>
   </div>
  );
 }

 // ✅ شاشة "نسيت كلمة المرور"
 if (view === 'forgot') {
  return (
   <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md p-10 md:p-12">
     <div className="text-center mb-10">
      <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
       <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
       </svg>
      </div>
      <h1 className="text-3xl font-black text-slate-900 mb-2">نسيت كلمة المرور؟</h1>
      <p className="text-sm text-slate-500">أدخل بريدك وهنبعتلك رابط إعادة التعيين</p>
     </div>

     <form onSubmit={handleForgotPassword} className="space-y-5">
      <div>
       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mr-2">
        البريد الإلكتروني
       </label>
       <input
        type="email"
        value={forgotEmail}
        onChange={(e) => setForgotEmail(e.target.value)}
        required
        className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 font-bold text-sm transition-all"
        placeholder="doctor@example.com"
       />
      </div>

      <button
       type="submit"
       className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
      >
       إرسال رابط إعادة التعيين
      </button>
     </form>

     <div className="mt-8 text-center">
      <button
       onClick={() => setView('login')}
       className="text-sm text-slate-500 hover:text-blue-600 font-bold"
      >
       ← العودة لتسجيل الدخول
      </button>
     </div>
    </div>
   </div>
  );
 }

 // ✅ شاشة Login / Register
 return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
   <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md p-10 md:p-12">

    <div className="text-center mb-10">
     <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform hover:rotate-3">
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
     </div>
     <h1 className="text-3xl font-black text-slate-900 mb-2">
      {view === 'login' ? 'لوحة تحكم الطبيب' : 'إنشاء حساب جديد'}
     </h1>
     <p className="text-sm text-slate-500">
      {view === 'login' ? 'سجل دخولك للوصول إلى إدارة العيادة' : 'أدخل بياناتك للانضمام إلى منصتنا'}
     </p>
    </div>

    <form onSubmit={handleSubmit} className="space-y-5">
     {view === 'register' && (
      <div>
       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mr-2">الاسم الكامل</label>
       <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 font-bold text-sm transition-all"
        placeholder="د. محمد أحمد"
       />
      </div>
     )}

     <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mr-2">البريد الإلكتروني</label>
      <input
       type="email"
       value={email}
       onChange={(e) => setEmail(e.target.value)}
       required
       className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 font-bold text-sm transition-all"
       placeholder="doctor@example.com"
      />
     </div>

     <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mr-2">كلمة المرور</label>
      <input
       type="password"
       value={password}
       onChange={(e) => setPassword(e.target.value)}
       required
       className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 font-bold text-sm transition-all"
       placeholder="••••••••"
      />
     </div>

     {/* ← نسيت كلمة المرور */}
     {view === 'login' && (
      <div className="text-left">
       <button
        type="button"
        onClick={() => setView('forgot')}
        className="text-xs text-blue-600 font-bold hover:underline"
       >
        نسيت كلمة المرور؟
       </button>
      </div>
     )}

     <button
      type="submit"
      className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
     >
      {view === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
     </button>
    </form>

    <div className="mt-8 text-center">
     <p className="text-sm text-slate-500">
      {view === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
      <button
       onClick={() => setView(view === 'login' ? 'register' : 'login')}
       className="mr-2 text-blue-600 font-bold hover:underline"
      >
       {view === 'login' ? 'أنشئ حسابك الآن' : 'سجل دخولك'}
      </button>
     </p>
    </div>
   </div>
  </div>
 );
};

export default Login;