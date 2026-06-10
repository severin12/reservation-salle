'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { validatePassword } from '@/lib/password';

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'Personnel',
    department: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      showToast(passwordError, 'error');
      return;
    }
    if (form.password !== form.confirm) {
      showToast('La confirmation du mot de passe ne correspond pas.', 'error');
      return;
    }

    setLoading(true);
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirm,
        role: form.role,
        department: form.department,
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      showToast(data.error ?? 'Impossible de créer le compte.', 'error');
      return;
    }

    showToast('Compte créé avec succès.', 'success');
    router.push('/');
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#0f172a,#1e3a5f)] text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10">
        <section className="w-full rounded-4 bg-white/95 p-8 text-slate-800 shadow-2xl lg:p-10">
          <p className="text-sm uppercase tracking-[0.25em] text-sky-700">Créer un compte</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Inscription</h1>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <input
              className="form-control"
              placeholder="Nom complet"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
            <input
              className="form-control"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
            <input
              className="form-control"
              placeholder="Mot de passe (min. 4 car., 1 majuscule)"
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
            />
            <input
              className="form-control"
              placeholder="Confirmer le mot de passe"
              type="password"
              value={form.confirm}
              onChange={(e) => handleChange('confirm', e.target.value)}
              required
            />
            <select className="form-select" value={form.role} onChange={(e) => handleChange('role', e.target.value)}>
              <option value="Personnel">Personnel</option>
              <option value="Enseignant">Enseignant</option>
              <option value="Responsable">Responsable</option>
            </select>
            <input
              className="form-control"
              placeholder="Département"
              value={form.department}
              onChange={(e) => handleChange('department', e.target.value)}
            />
            <div className="md:col-span-2">
              <button className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
            </div>
          </form>
          <p className="mt-5 text-sm text-slate-600">
            Vous avez déjà un compte ?{' '}
            <Link href="/login" className="text-sky-700 transition hover:text-sky-900">
              Se connecter
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
