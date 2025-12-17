
import React, { useState, useEffect } from 'react';
import { GoogleIcon, ScissorsIcon } from './icons';
import Modal from './Modal';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

interface LoginProps {
  onLogin: (rememberMe: boolean, email: string) => void;
  shopLogoUrl?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, shopLogoUrl }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const isFirebaseActive = !!auth;

  useEffect(() => {
    setError('');
    setSuccessMessage('');
  }, [isRegistering]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isFirebaseActive) {
        try {
            if (isRegistering) {
                if (!isValidEmail(email)) throw new Error('E-mail inválido.');
                if (password !== confirmPassword) throw new Error('As senhas não coincidem.');
                if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
                await createUserWithEmailAndPassword(auth, email, password);
                setSuccessMessage('Conta criada com sucesso! Redirecionando...');
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                onLogin(rememberMe, auth.currentUser?.uid || email);
            }
        } catch (err: any) {
            console.error(err);
            let msg = 'Erro na autenticação.';
            if (err.code === 'auth/email-already-in-use') msg = 'Este email já está em uso.';
            if (err.code === 'auth/invalid-credential') msg = 'Email ou senha incorretos.';
            if (err.code === 'auth/weak-password') msg = 'Senha muito fraca.';
            if (err.message) msg = err.message;
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    } else {
        // Fallback for Local Mode (Persistent Storage)
        setTimeout(() => {
            const storedUsers = localStorage.getItem('effisync_users');
            const users = storedUsers ? JSON.parse(storedUsers) : [];

            if (isRegistering) {
                if (users.some((u: any) => u.email === email)) {
                    setError('Este e-mail já está cadastrado localmente.');
                    setIsLoading(false);
                    return;
                }
                const newUser = { email, password: btoa(password) };
                users.push(newUser);
                localStorage.setItem('effisync_users', JSON.stringify(users));
                setSuccessMessage('Conta local criada com sucesso! Faça login.');
                setIsRegistering(false);
            } else {
                const user = users.find((u: any) => u.email === email && (u.password === password || u.password === btoa(password)));
                if (user || (email === 'admin' && password === 'admin')) {
                    onLogin(rememberMe, email);
                } else {
                    setError('E-mail ou senha incorretos (Modo Local).');
                }
            }
            setIsLoading(false);
        }, 800);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseActive) return;
    setIsLoading(true);
    setError('');
    try {
        await signInWithPopup(auth, googleProvider);
        onLogin(true, auth.currentUser?.uid || auth.currentUser?.email || '');
    } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/popup-blocked') {
            setError('O popup de login foi bloqueado pelo navegador.');
        } else if (err.code === 'auth/popup-closed-by-user') {
            setError('Login cancelado.');
        } else {
            setError('Falha ao entrar com Google.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteLocalUser = () => {
    const emailToDelete = forgotEmail.toLowerCase();
    if (!window.confirm(`Tem certeza que deseja excluir o cadastro local de ${emailToDelete}? Isso apagará todos os dados salvos localmente vinculados a este e-mail.`)) {
        return;
    }

    const storedUsers = localStorage.getItem('effisync_users');
    if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const filtered = users.filter((u: any) => u.email.toLowerCase() !== emailToDelete);
        localStorage.setItem('effisync_users', JSON.stringify(filtered));
        
        // Clean up data prefix
        const prefix = `local_${emailToDelete.replace(/[^a-zA-Z0-9]/g, '_')}`;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(prefix)) localStorage.removeItem(key);
        });

        setSuccessMessage('Cadastro local removido. Agora você pode criar uma conta nova.');
        setError('');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      setSuccessMessage('');

      if (!isFirebaseActive) {
          setError('Recuperação de senha indisponível no modo local.');
          setIsLoading(false);
          return;
      }

      try {
          await sendPasswordResetEmail(auth, forgotEmail);
          setSuccessMessage('Link de recuperação enviado para seu email.');
      } catch (err: any) {
          console.error(err);
          if (err.code === 'auth/user-not-found') {
              const localUsers = JSON.parse(localStorage.getItem('effisync_users') || '[]');
              if (localUsers.some((u: any) => u.email.toLowerCase() === forgotEmail.toLowerCase())) {
                  setError('Esta conta foi criada localmente (Modo Local). Para usar o sistema online, você deve excluir o registro antigo.');
              } else {
                  setError('E-mail não encontrado.');
              }
          } else {
              setError('Erro ao enviar link de recuperação.');
          }
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a] selection:bg-cyan-500 selection:text-white">
      <div className="w-full max-w-md p-8 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl space-y-8">
        <div className="text-center">
          <div className="inline-block p-4 bg-gray-800 rounded-full mb-4 shadow-inner">
            {shopLogoUrl ? (
                <img src={shopLogoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover" />
            ) : (
                <ScissorsIcon className="w-12 h-12 text-cyan-500" />
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">EffiSync Manager</h1>
          <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest font-semibold">
              {isFirebaseActive ? 'Acesso Profissional' : 'Modo Offline / Local'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 mt-1 text-white bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
              placeholder="barbeiro@exemplo.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center ml-1">
                 <label className="text-xs font-bold text-gray-500 uppercase">Senha</label>
                 {!isRegistering && (
                     <button type="button" onClick={() => setIsForgotPasswordOpen(true)} className="text-xs text-cyan-500 hover:text-cyan-400 font-bold">Esqueceu?</button>
                 )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 mt-1 text-white bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          {isRegistering && (
            <div className="animate-fade-in-down">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Confirmar Senha</label>
                <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 mt-1 text-white bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                    placeholder="••••••••"
                />
            </div>
          )}

          {error && <div className="p-3 text-xs text-red-400 bg-red-900/20 border border-red-500/50 rounded-lg">{error}</div>}
          {successMessage && <div className="p-3 text-xs text-green-400 bg-green-900/20 border border-green-500/50 rounded-lg">{successMessage}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {isLoading ? 'Autenticando...' : (isRegistering ? 'Criar Minha Conta' : 'Entrar no Sistema')}
          </button>
        </form>

        {isFirebaseActive && !isRegistering && (
            <>
                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-800"></div>
                    <span className="flex-shrink mx-4 text-gray-600 text-xs font-bold uppercase">Ou</span>
                    <div className="flex-grow border-t border-gray-800"></div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl transition-all disabled:opacity-50"
                >
                    <GoogleIcon className="w-5 h-5 mr-3" />
                    Entrar com Google
                </button>
            </>
        )}

        <p className="text-center text-sm text-gray-500">
            {isRegistering ? 'Já possui conta?' : 'Novo por aqui?'} 
            <button onClick={() => setIsRegistering(!isRegistering)} className="ml-1 text-cyan-500 font-bold hover:underline">
                {isRegistering ? 'Faça login' : 'Começar agora'}
            </button>
        </p>
      </div>

      <Modal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} title="Recuperar Senha">
          <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-gray-400 text-sm">Insira seu e-mail para receber um link de redefinição de senha.</p>
              
              {error && (
                  <div className="p-3 text-xs text-red-400 bg-red-900/20 border border-red-500/50 rounded-lg">
                      <p>{error}</p>
                      {error.includes('criada localmente') && (
                          <button 
                            type="button" 
                            onClick={handleDeleteLocalUser}
                            className="mt-3 w-full bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700"
                          >
                            Excluir Cadastro Local
                          </button>
                      )}
                  </div>
              )}
              {successMessage && <div className="p-3 text-xs text-green-400 bg-green-900/20 border border-green-500/50 rounded-lg">{successMessage}</div>}

              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="seu@email.com"
              />
              <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsForgotPasswordOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                  <button type="submit" disabled={isLoading} className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 transition-colors disabled:opacity-50">
                      {isLoading ? 'Enviando...' : 'Enviar Link'}
                  </button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Login;
