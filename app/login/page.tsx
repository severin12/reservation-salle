'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, remember }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      showToast(data.error ?? 'Identifiants invalides.', 'error');
      return;
    }

    showToast('Connexion réussie.', 'success');
    router.push('/');
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#0f172a,#1e3a5f)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-4 py-10 lg:flex-row lg:gap-10">
        <section
          className="w-full max-w-xl rounded-4 p-8 shadow-2xl lg:p-10"
          style={{ background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(14px)' }}
        >
          <p className="text-sm uppercase tracking-[0.25em] text-sky-200">Système de réservation</p>
          <h1 className="mt-3 text-4xl font-bold">Connexion</h1>
          <p className="mt-3 text-slate-200">Accédez au tableau de bord, aux salles et aux réservations.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <input
              className="form-control"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
            />
            <div className="flex items-center justify-between text-sm text-slate-200">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Se souvenir de moi
              </label>
              <Link href="/forgot-password" className="text-sky-200 transition hover:text-white">
                Mot de passe oublié ?
              </Link>
            </div>
            <button className="btn btn-light w-full fw-semibold" disabled={loading} style={{ color: '#1e3a5f' }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <p className="mt-5 text-sm text-slate-200">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-sky-200 transition hover:text-white">
              Créer un compte
            </Link>
          </p>
        </section>
        <aside className="mt-8 w-full max-w-md rounded-4 bg-white p-8 text-slate-800 shadow-2xl lg:mt-0">
          <h2 className="text-2xl font-semibold">Pourquoi ce système ?</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>• Dashboard temps réel et statistiques</li>
            <li>• Gestion des réservations et des salles</li>
            <li>• Export CSV/PDF/Impression</li>
            <li>• Notifications par email</li>
            <li>• Interface responsive mobile-first</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
