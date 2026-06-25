import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const ResetPasswordPage: React.FC = () => {
 const [searchParams] = useSearchParams();
 const navigate = useNavigate();

 const token = searchParams.get('token') || '';
 const emailFromUrl = searchParams.get('email') || '';

 const [password, setPassword] = useState('');
 const [passwordConfirmation, setPasswordConfirmation] = useState('');
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
   await authAPI.resetPassword(token, emailFromUrl, password, passwordConfirmation);
   navigate('/login?reset=success');
  } catch (err: any) {
   setError(err.response?.data?.message || 'حدث خطأ، يرجى المحاولة لاحقاً');
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
   <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md p-10 md:p-12">
    <div className="text-center mb-10">
     <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
     </div>
     <h1 className="text-3xl font-black text-slate-900 mb-2">كلمة مرور جديدة</h1>
     <p className="text-sm text-slate-500">أدخل كلمة المرور الجديدة</p>
    </div>

    <form onSubmit={handleSubmit} className="space-y-5">
     <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mr-2">
       كلمة المرور الجديدة
      </label>
      <input
       type="password"
       value={password}
       onChange={(e) => setPassword(e.target.value)}
       required
       minLength={8}
       className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 font-bold text-sm transition-all"
       placeholder="••••••••"
      />
     </div>

     <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mr-2">
       تأكيد كلمة المرور
      </label>
      <input
       type="password"
       value={passwordConfirmation}
       onChange={(e) => setPasswordConfirmation(e.target.value)}
       required
       className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 font-bold text-sm transition-all"
       placeholder="••••••••"
      />
     </div>

     {error && (
      <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-bold px-4 py-3 rounded-2xl">
       {error}
      </div>
     )}

     <button
      type="submit"
      disabled={loading}
      className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-60"
     >
      {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
     </button>
    </form>

    <div className="mt-8 text-center">
     <Link to="/login" className="text-sm text-slate-500 hover:text-blue-600 font-bold">
      ← العودة لتسجيل الدخول
     </Link>
    </div>
   </div>
  </div>
 );
};

export default ResetPasswordPage;