import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { useApp } from '../contexts/AppContext';

interface LoginProps {
 onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
 // إضافة حالة للتبديل بين التسجيل والدخول
 const [isLogin, setIsLogin] = useState(true);
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [name, setName] = useState(''); // حقل إضافي لإنشاء الحساب

 const { showToast, showLoading, hideLoading } = useApp();

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const loadingMsg = isLogin ? 'جاري تسجيل الدخول...' : 'جاري إنشاء الحساب...';
  showLoading(loadingMsg);

  try {
   if (isLogin) {
    await authAPI.login(email, password);
    showToast('تم تسجيل الدخول بنجاح', 'success');
   } else {
    // افترضنا وجود دالة register في الـ API الخاص بك
    await authAPI.register(name, email, password);
    showToast('تم إنشاء الحساب بنجاح، يمكنك الدخول الآن', 'success');
    setIsLogin(true); // العودة لصفحة الدخول بعد النجاح
   }

   setTimeout(() => {
    hideLoading();
    if (isLogin) onLoginSuccess();
   }, 500);
  } catch (error: any) {
   hideLoading();
   const message = error.response?.data?.message || 'حدث خطأ ما، يرجى المحاولة لاحقاً';
   showToast(message, 'error');
  }
 };

 return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
   <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md p-10 md:p-12">

    {/* الرأس (Header) */}
    <div className="text-center mb-10">
     <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform hover:rotate-3">
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
     </div>
     <h1 className="text-3xl font-black text-slate-900 mb-2">
      {isLogin ? 'لوحة تحكم الطبيب' : 'إنشاء حساب جديد'}
     </h1>
     <p className="text-sm text-slate-500">
      {isLogin ? 'سجل دخولك للوصول إلى إدارة العيادة' : 'أدخل بياناتك للانضمام إلى منصتنا'}
     </p>
    </div>

    {/* النموذج (Form) */}
    <form onSubmit={handleSubmit} className="space-y-5">
     {!isLogin && (
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

     <button
      type="submit"
      className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
     >
      {isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}
     </button>
    </form>

    {/* التبديل بين الحالتين */}
    <div className="mt-8 text-center">
     <p className="text-sm text-slate-500">
      {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
      <button
       onClick={() => setIsLogin(!isLogin)}
       className="mr-2 text-blue-600 font-bold hover:underline"
      >
       {isLogin ? 'أنشئ حسابك الآن' : 'سجل دخولك'}
      </button>
     </p>
    </div>
   </div>
  </div>
 );
};

export default Login;