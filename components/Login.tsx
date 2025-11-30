
import React, { useState } from 'react';
import { GoogleIcon, ScissorsIcon } from './icons';

interface LoginProps {
  onLogin: () => void;
  shopLogoUrl?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, shopLogoUrl }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    
    // Hardcoded check for admin user
    if (email.toLowerCase() === 'admin' && password === 'admin') {
      onLogin();
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  // Simulate Google login for demo purposes
  const handleGoogleLogin = () => {
    // In a real app, this would trigger the Google OAuth flow.
    // For this demo, we'll just log in directly.
    onLogin();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg animate-fade-in-down">
        <div className="text-center">
          <div className="flex flex-col items-center justify-center text-white text-3xl font-bold mb-4">
            {shopLogoUrl ? (
                <img src={shopLogoUrl} alt="Logo" className="w-24 h-24 mb-4 rounded-full object-cover border-2 border-amber-500" />
            ) : (
                <ScissorsIcon className="w-20 h-20 text-amber-500 mb-4" />
            )}
            <span>EffiSync Manager</span>
          </div>
          <p className="text-gray-400">Faça login para gerenciar seu negócio com alta performance.</p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-300">Email ou Usuário</label>
            <input
              id="email"
              name="email"
              type="text" // Use text to allow 'admin'
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="admin"
            />
          </div>

          <div>
            <label htmlFor="password"  className="text-sm font-medium text-gray-300">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="admin"
            />
          </div>

          {error && (
            <p className="text-sm text-center text-red-400">{error}</p>
          )}

          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500 transition-colors"
            >
              Entrar
            </button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-400 bg-gray-800">OU</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex justify-center items-center px-4 py-2 font-medium text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-colors"
          >
            <GoogleIcon className="w-5 h-5 mr-3" />
            Entrar com Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
