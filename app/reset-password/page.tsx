'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { validatePassword } from '@/lib/password';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const passwordError = validatePassword(password);
    if (passwordError) {
      showToast(passwordError, 'error');
      return;
    }
    if (password !== confirm) {
      showToast('La confirmation ne correspond pas.', 'error');
      return;
    }

    setLoading(true);
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password, confirmPassword: confirm }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      showToast(data.error ?? 'Réinitialisation impossible.', 'error');
      return;
    }

    showToast('Mot de passe mis à jour.', 'success');
    router.push('/login');
  };

  if (!token) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
        Lien invalide. Demandez un nouveau lien de réinitialisation.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <input
        className="form-control"
        type="password"
        placeholder="Nouveau mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <input
        className="form-control"
        type="password"
        placeholder="Confirmer le mot de passe"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
      <button className="btn btn-primary w-full" disabled={loading}>
        {loading ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#0f172a,#1e3a5f)] text-white">
      <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-4 py-10">
        <section className="w-full rounded-4 bg-white/95 p-8 text-slate-800 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-sky-700">Nouveau mot de passe</p>
          <h1 className="mt-3 text-3xl font-bold">Réinitialisation</h1>
          <Suspense fallback={<p className="mt-4 text-slate-500">Chargement...</p>}>
            <ResetPasswordForm />
          </Suspense>
          <p className="mt-5 text-sm text-slate-600">
            <Link href="/login" className="text-sky-700 transition hover:text-sky-900">
              ← Retour à la connexion
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
