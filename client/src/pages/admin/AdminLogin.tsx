import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { adminVerifyKey, setAdminKey } from "@/lib/admin-api";

export default function AdminLogin() {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError("");
    try {
      const ok = await adminVerifyKey(key.trim());
      if (ok) {
        setAdminKey(key.trim());
        setLocation("/admin/dashboard");
      } else {
        setError("Неверный ключ доступа");
      }
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 mb-4 shadow-lg shadow-blue-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Панель администратора</h1>
          <p className="text-slate-400 text-sm mt-1">LogHist — Аналитика и управление</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#131929] border border-white/10 rounded-2xl p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Секретный ключ
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={show ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="ADMIN_SECRET_KEY"
                className="w-full bg-[#0d1424] border border-white/10 text-white placeholder:text-slate-600 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="mt-2 text-red-400 text-xs">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Проверка...</> : "Войти в панель"}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">
          Доступ только для авторизованных администраторов
        </p>
      </div>
    </div>
  );
}
