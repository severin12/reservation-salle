'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      showToast(data.error ?? 'Erreur lors de l\'envoi.', 'error');
      return;
    }

    setSent(true);
    showToast(data.message ?? 'Email envoyé si le compte existe.', 'success');
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#0f172a,#1e3a5f)] text-white">
      <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-4 py-10">
        <section className="w-full rounded-4 bg-white/95 p-8 text-slate-800 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-sky-700">Mot de passe oublié</p>
          <h1 className="mt-3 text-3xl font-bold">Réinitialisation</h1>
          <p className="mt-2 text-slate-600">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>

          {sent ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                className="form-control"
                type="email"
                placeholder="Votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </form>
          )}

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
