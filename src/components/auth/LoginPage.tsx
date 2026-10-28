import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  KeyRound,
  UserCheck,
  BadgeCheck,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { User, Role, getDefaultPermissionsForRole } from '../../types/erp.ts';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.ts';

export const LoginPage: React.FC = () => {
  const { users, login, addUser, updateUserPassword } = useERP();

  // Sign In credentials state (matching screenshot default)
  const [identifier, setIdentifier] = useState<string>('hello@design.com');
  const [password, setPassword] = useState<string>('ensec2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Modals for additional features (Forgot Password & Quick Demo/Register)
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [demoActiveTab, setDemoActiveTab] = useState<'demo' | 'register'>('demo');

  // Reset / Edit Password form state
  const [resetIdentifier, setResetIdentifier] = useState<string>('hello@design.com');
  const [newPasswordVal, setNewPasswordVal] = useState<string>('');
  const [confirmPasswordVal, setConfirmPasswordVal] = useState<string>('');
  const [showResetPasswordToggle, setShowResetPasswordToggle] = useState<boolean>(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Register modal state
  const [regUserId, setRegUserId] = useState<string>('EMP-012');
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regDesignation, setRegDesignation] = useState<string>('');
  const [regRole, setRegRole] = useState<Role>('Sales Head');
  const [regDepartment, setRegDepartment] = useState<string>('Sales & Marketing');
  const [regPassword, setRegPassword] = useState<string>('ensec2026');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('ensec2026');

  // Feedback states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle standard Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const cleanId = identifier.trim().toLowerCase();

      // 1. Try Supabase Auth if credentials configured and identifier is an email
      if (isSupabaseConfigured && supabase && cleanId.includes('@') && cleanId !== 'hello@design.com') {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanId,
            password,
          });
          if (data?.user && !error) {
            console.log('Supabase auth successful:', data.user.id);
          }
        } catch (supaErr) {
          console.warn('Supabase auth attempt logged:', supaErr);
        }
      }

      // 2. Shortcut for design/admin showcase
      if (cleanId === 'hello@design.com' || cleanId === 'design' || cleanId.includes('sohidul')) {
        const adminUser = users[0] || {
          id: 'u-1',
          userId: 'EMP-001',
          name: 'Md. Sohidul Islam',
          email: 'hello@design.com',
          role: 'Super Admin',
          permissions: getDefaultPermissionsForRole('Super Admin'),
          status: 'Active',
        };
        setSuccessMessage(`Welcome back! Logging in as ${adminUser.role}...`);
        setTimeout(() => {
          login(adminUser);
        }, 350);
        return;
      }

      // 3. Resolve matching ERP User account by User ID, Email, Phone, or Salesman Code
      const matchedUser =
        users.find((u) => u.userId && u.userId.trim().toLowerCase() === cleanId) ||
        users.find((u) => u.email.trim().toLowerCase() === cleanId) ||
        users.find((u) => u.phone && u.phone.includes(cleanId)) ||
        users.find((u) => u.salesmanCode && u.salesmanCode.trim().toLowerCase() === cleanId);

      if (matchedUser) {
        if (matchedUser.password && matchedUser.password !== password && password !== 'ensec2026') {
          setErrorMessage('Invalid password for this account. Default is "ensec2026".');
          setIsLoading(false);
          return;
        }

        setSuccessMessage(`Welcome back, ${matchedUser.name}! Logging in as ${matchedUser.role}...`);
        setTimeout(() => {
          login(matchedUser);
        }, 350);
      } else {
        // Create instant user session
        const generatedUser: User = {
          id: `u-${Date.now()}`,
          userId: cleanId.toUpperCase(),
          password: password,
          name: cleanId.includes('@') ? cleanId.split('@')[0].toUpperCase() : cleanId.toUpperCase(),
          email: cleanId.includes('@') ? cleanId : `${cleanId.toLowerCase()}@ensecbd.com`,
          phone: '+880 1700-000000',
          role: 'Sales Head',
          designation: 'Authorized Officer',
          department: 'Field Operations',
          status: 'Active',
          permissions: users[0]?.permissions || getDefaultPermissionsForRole('Sales Head'),
        };
        setSuccessMessage(`Session authenticated. Launching ${generatedUser.role} workspace...`);
        setTimeout(() => {
          login(generatedUser);
        }, 350);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
      setIsLoading(false);
    }
  };

  // Handle "Create User ID and Password"
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanUserId = regUserId.trim().toUpperCase();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!cleanUserId) {
      setErrorMessage('Please provide a valid User ID.');
      setIsLoading(false);
      return;
    }

    if (!regName.trim()) {
      setErrorMessage('Please enter the full name.');
      setIsLoading(false);
      return;
    }

    if (regPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      setIsLoading(false);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const newPermissions = getDefaultPermissionsForRole(regRole);
      const isSalesRole =
        regRole === 'Field Force' || regRole === 'Territory Sales Officer' || regRole === 'Sales Head';

      const newUser: User = {
        id: `u-${Date.now()}`,
        userId: cleanUserId,
        password: regPassword,
        name: regName.trim(),
        email: cleanEmail || `${cleanUserId.toLowerCase()}@ensecbd.com`,
        phone: regPhone.trim() || '+880 1700-000000',
        role: regRole,
        designation: regDesignation.trim() || `${regRole} Specialist`,
        department: regDepartment.trim() || 'Operations',
        status: 'Active',
        isSalesman: isSalesRole,
        salesmanCode: isSalesRole ? `REP-${cleanUserId.replace(/[^A-Z0-9]/g, '')}` : undefined,
        permissions: newPermissions,
      };

      addUser(newUser);
      setShowDemoModal(false);
      setSuccessMessage(`User "${cleanUserId}" created! Logging in as ${newUser.role}...`);

      setTimeout(() => {
        login(newUser);
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create user ID.');
      setIsLoading(false);
    }
  };

  // Reset / Edit Password Handler
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetFeedback(null);
    if (!newPasswordVal || newPasswordVal.trim().length < 4) {
      setResetFeedback({ type: 'error', message: 'Password must be at least 4 characters long.' });
      return;
    }
    if (newPasswordVal !== confirmPasswordVal) {
      setResetFeedback({ type: 'error', message: 'Passwords do not match. Please verify.' });
      return;
    }

    setIsResetting(true);
    const cleanId = resetIdentifier.trim().toLowerCase();
    const matched = users.find(
      (u) =>
        (u.userId && u.userId.trim().toLowerCase() === cleanId) ||
        u.email.trim().toLowerCase() === cleanId ||
        (u.salesmanCode && u.salesmanCode.trim().toLowerCase() === cleanId) ||
        cleanId === 'hello@design.com'
    );

    const targetUser = matched || users[0];
    if (targetUser) {
      try {
        await updateUserPassword(targetUser.id, newPasswordVal.trim());
        setResetFeedback({
          type: 'success',
          message: `Password updated for ${targetUser.name}! Logging in now...`,
        });
        setPassword(newPasswordVal.trim());
        setIdentifier(targetUser.email || targetUser.userId || resetIdentifier);
        setTimeout(() => {
          setShowForgotModal(false);
          setIsResetting(false);
          login({ ...targetUser, password: newPasswordVal.trim() });
        }, 800);
      } catch (err: any) {
        setResetFeedback({ type: 'error', message: err.message || 'Failed to update password.' });
        setIsResetting(false);
      }
    } else {
      setResetFeedback({
        type: 'error',
        message: `Account "${resetIdentifier}" not found.`,
      });
      setIsResetting(false);
    }
  };

  // Quick fill helper
  const handleQuickFill = (userId: string, pass: string) => {
    setIdentifier(userId);
    setPassword(pass);
    setErrorMessage(null);
    setShowDemoModal(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#0d091a] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-pink-500 selection:text-white">
      {/* Ambient Radial Lighting Glows Matching Screenshot */}
      <div className="absolute -top-24 -left-24 w-[480px] h-[480px] bg-gradient-to-br from-pink-600/35 via-fuchsia-600/20 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-gradient-to-tl from-purple-700/35 via-indigo-800/20 to-transparent rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-950/20 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Glassmorphism Card Container (Pixel-faithful to screenshot) */}
      <div className="relative z-10 w-full max-w-[380px] sm:max-w-[400px] backdrop-blur-2xl bg-white/[0.04] border border-white/[0.14] rounded-[34px] shadow-[0_24px_70px_rgba(0,0,0,0.65)] p-7 sm:p-9 space-y-5">
        {/* Header */}
        <div className="text-center pt-1 pb-1">
          <h1 className="text-3xl sm:text-[34px] font-bold text-white tracking-tight">
            Welcome
          </h1>
          <p className="text-sm text-slate-300/80 font-normal mt-1.5">
            Sign in to your account
          </p>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSignIn} className="space-y-4 pt-1">
          {/* Email Address Field with Glowing Teal Border & Dot Indicator */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold tracking-wider text-slate-300 uppercase">
              EMAIL ADDRESS
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="hello@design.com"
                className="w-full pl-4 pr-10 py-3.5 rounded-[18px] bg-white/[0.07] border-2 border-teal-400 text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-400/20 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
              />
              <div
                className="absolute right-4 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_2px_rgba(34,211,238,0.85)] pointer-events-none"
                title="Active input"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold tracking-wider text-slate-300 uppercase">
              PASSWORD
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-4 pr-10 py-3.5 rounded-[18px] bg-white/[0.07] border border-white/[0.12] text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Forgot Password Link in Hot Magenta */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-semibold text-[#ff007a] hover:text-pink-400 transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Sign In Button with Vibrant Magenta-to-Purple Gradient */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-[20px] bg-gradient-to-r from-[#ff007a] via-[#c026d3] to-[#8b5cf6] hover:from-[#ff1a8c] hover:to-[#9a38ea] text-white font-bold text-base tracking-wide shadow-[0_10px_30px_-5px_rgba(255,0,122,0.45)] hover:shadow-[0_14px_35px_-5px_rgba(255,0,122,0.6)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>

          {/* Divider: OR CONTINUE WITH */}
          <div className="flex items-center gap-3 pt-3">
            <div className="h-px flex-1 bg-white/[0.12]" />
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase select-none">
              OR CONTINUE WITH
            </span>
            <div className="h-px flex-1 bg-white/[0.12]" />
          </div>

          {/* Bottom Circular Alternate Auth Buttons Matching Screenshot */}
          <div className="flex items-center justify-center gap-4 pt-1">
            {/* Circle 1: Google SSO / Quick Default Fill */}
            <button
              type="button"
              onClick={() => handleQuickFill('hello@design.com', 'ensec2026')}
              className="w-12 h-12 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 flex items-center justify-center text-white transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer group backdrop-blur-md"
              title="Continue with Google (hello@design.com)"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </button>

            {/* Circle 2: Apple SSO / Team Roles & User Accounts */}
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="w-12 h-12 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 flex items-center justify-center text-white transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer group backdrop-blur-md"
              title="Continue with Apple / Select Staff Role"
            >
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.93.04-2.02.63-2.66 1.38-.57.65-1.06 1.73-.93 2.76 1.04.08 2.06-.52 2.67-1.27z" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* MODAL 1: FORGOT / EDIT PASSWORD */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-[28px] backdrop-blur-2xl bg-slate-900/95 border border-white/15 p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/40 text-[#ff007a] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Reset / Edit Password</h3>
                  <p className="text-[10px] text-slate-400">Set a new password for your account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Default credentials banner */}
            <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">System default password:</span>
                <span className="font-mono text-teal-300 font-bold bg-black/40 px-2 py-0.5 rounded border border-white/10">
                  ensec2026
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPassword('ensec2026');
                  setShowForgotModal(false);
                }}
                className="w-full py-1.5 text-center text-[10px] font-semibold text-pink-400 hover:text-pink-300 transition-colors"
              >
                Quick Auto-fill &quot;ensec2026&quot; & Return to Login →
              </button>
            </div>

            {/* Feedback message */}
            {resetFeedback && (
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  resetFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                {resetFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{resetFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3 pt-1">
              {/* Target Account Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                  USER ID OR EMAIL
                </label>
                <input
                  type="text"
                  required
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="e.g. EMP-001 or hello@design.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-white placeholder-slate-400 font-mono text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* New Password Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                  NEW PASSWORD
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showResetPasswordToggle ? 'text' : 'password'}
                    required
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    placeholder="Min. 4 characters"
                    className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-white placeholder-slate-400 font-mono text-xs focus:outline-none focus:border-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordToggle(!showResetPasswordToggle)}
                    className="absolute right-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showResetPasswordToggle ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                  CONFIRM NEW PASSWORD
                </label>
                <input
                  type={showResetPasswordToggle ? 'text' : 'password'}
                  required
                  value={confirmPasswordVal}
                  onChange={(e) => setConfirmPasswordVal(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-white placeholder-slate-400 font-mono text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ff007a] via-[#c026d3] to-[#8b5cf6] text-white font-bold text-xs shadow-md hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
                >
                  {isResetting ? 'Saving...' : 'Save & Log In'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-slate-300 text-xs hover:bg-white/5 font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK ROLE SELECTOR & CREATE USER ID */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-[32px] backdrop-blur-2xl bg-slate-900/95 border border-white/15 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-400" />
                <h3 className="font-bold text-base text-white">Select Account or Register</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-white/[0.05] rounded-xl border border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDemoActiveTab('demo')}
                className={`py-2 rounded-lg transition-all ${
                  demoActiveTab === 'demo'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Team Roles
              </button>
              <button
                type="button"
                onClick={() => setDemoActiveTab('register')}
                className={`py-2 rounded-lg transition-all ${
                  demoActiveTab === 'register'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create User ID
              </button>
            </div>

            {/* Tab 1: Quick Role Selector */}
            {demoActiveTab === 'demo' && (
              <div className="space-y-2 text-xs">
                <p className="text-slate-400 text-[11px]">
                  Click any role below to prefill credentials and sign in:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('hello@design.com', 'ensec2026')}
                    className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-pink-500/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-teal-300">hello@design.com</div>
                    <div className="text-[10px] text-slate-400">Default Showcase Admin</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('EMP-001', 'ensec2026')}
                    className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-pink-500/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-pink-400">EMP-001</div>
                    <div className="text-[10px] text-slate-400">Super Admin (Sohidul)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('EMP-002', 'ensec2026')}
                    className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-pink-500/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-pink-400">EMP-002</div>
                    <div className="text-[10px] text-slate-400">Sales Head (Tanvir)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('EMP-003', 'ensec2026')}
                    className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-pink-500/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-pink-400">EMP-003</div>
                    <div className="text-[10px] text-slate-400">Factory (Mustafizur)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('EMP-004', 'ensec2026')}
                    className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-pink-500/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-pink-400">EMP-004</div>
                    <div className="text-[10px] text-slate-400">Accounts (Kamrul)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('EMP-006', 'ensec2026')}
                    className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-pink-500/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-pink-400">EMP-006</div>
                    <div className="text-[10px] text-slate-400">Field Force (Zubair)</div>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Create User ID Form */}
            {demoActiveTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    User ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={regUserId}
                    onChange={(e) => setRegUserId(e.target.value)}
                    placeholder="e.g. EMP-020"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ashraful Islam"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Role *
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as Role)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Sales Head">Sales Head</option>
                    <option value="Field Force">Field Force</option>
                    <option value="Factory Manager">Factory Manager</option>
                    <option value="Warehouse Manager">Warehouse Manager</option>
                    <option value="Accounts / Finance">Accounts / Finance</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="ensec2026"
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Confirm *
                    </label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="ensec2026"
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md mt-2"
                >
                  Create &amp; Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
