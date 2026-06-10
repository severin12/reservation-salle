export function validatePassword(password: string): string | null {
  if (password.length < 4) {
    return 'Le mot de passe doit contenir au moins 4 caractères.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une lettre majuscule.';
  }
  return null;
}
