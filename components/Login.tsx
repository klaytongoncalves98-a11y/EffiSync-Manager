
import React, { useState, useEffect } from 'react';
import { GoogleIcon, ScissorsIcon } from './icons';
import Modal from './Modal';

interface LoginProps {
  onLogin: (rememberMe: boolean, email: string) => void;
  shopLogoUrl?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, shopLogoUrl }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot Password State
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Clear messages when switching modes
  useEffect(() => {
    setError('');
    setSuccessMessage('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setIsLoading(false);
  }, [isRegistering]);

  const isValidEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    // Simulate network delay for realism
    setTimeout(() => {
        // Load users from local storage
        const storedUsers = localStorage.getItem('effisync_users');
        const users = storedUsers ? JSON.parse(storedUsers) : [];

        if (isRegistering) {
            // REGISTRATION LOGIC
            if (!email || !password || !confirmPassword) {
                setError('Preencha todos os campos.');
                setIsLoading(false);
                return;
            }

            if (!isValidEmail(email)) {
                setError('Por favor, insira um email válido.');
                setIsLoading(false);
                return;
            }

            if (password !== confirmPassword) {
                setError('As senhas não coincidem.');
                setIsLoading(false);
                return;
            }

            if (password.length < 4) {
                 setError('A senha deve ter pelo menos 4 caracteres.');
                 setIsLoading(false);
                 return;
            }

            const userExists = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
            if (userExists) {
                setError('Este email já está cadastrado.');
                setIsLoading(false);
                return;
            }

            // Save new user (Simple obfuscation with btoa for demo purposes - not real encryption)
            const newUser = { email, password: btoa(password) }; 
            users.push(newUser);
            localStorage.setItem('effisync_users', JSON.stringify(users));
            
            setSuccessMessage('Conta criada com sucesso! Faça login.');
            setIsRegistering(false); // Switch back to login mode
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setIsLoading(false);

        } else {
            // LOGIN LOGIC
            // 1. Check local storage users (checking both plain text for old users and btoa for new)
            const validUser = users.find((u: any) => 
                u.email.toLowerCase() === email.toLowerCase() && 
                (u.password === password || u.password === btoa(password))
            );

            // 2. Fallback for 'admin' ONLY if no users exist yet (Legacy/Setup support)
            // If users exist, admin/admin is disabled unless explicitly registered.
            const isLegacyAdmin = users.length === 0 && email.toLowerCase() === 'admin' && password === 'admin';

            if (validUser || isLegacyAdmin) {
                onLogin(rememberMe, email);
            } else {
                setError('Email ou senha incorretos.');
            }
            setIsLoading(false);
        }
    }, 800);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          setIsForgotPasswordOpen(false);
          setSuccessMessage(`Um link de redefinição foi enviado para ${forgotEmail} (Simulação).`);
          setForgotEmail('');
      }, 1500);
  };

  const handleGoogleLogin = () => {
    // Robust Popup Centering (Works on Dual Monitors)
    const width = 500;
    const height = 600;
    
    const screenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    const screenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

    const screenWidth = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    const screenHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    const left = screenLeft + (screenWidth - width) / 2;
    const top = screenTop + (screenHeight - height) / 2;

    const popup = window.open(
      '',
      'google_login_popup',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=no,resizable=yes`
    );

    if (popup) {
        const googleLoginContent = `
            <html>
                <head>
                    <title>Fazer login com o Google</title>
                    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet">
                    <style>
                        body { 
                            font-family: 'Roboto', sans-serif; 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center; 
                            justify-content: center; 
                            height: 100vh; 
                            margin: 0; 
                            background: #fff; 
                            color: #202124; 
                        }
                        .logo-container { margin-bottom: 30px; }
                        .spinner { 
                            border: 4px solid rgba(0, 0, 0, 0.1); 
                            border-left-color: #4285F4; 
                            border-radius: 50%; 
                            width: 40px; 
                            height: 40px; 
                            animation: spin 1s linear infinite; 
                            margin-bottom: 24px; 
                        }
                        h2 { 
                            font-weight: 500; 
                            margin: 0 0 8px 0; 
                            font-size: 24px; 
                        }
                        p { 
                            color: #5f6368; 
                            font-size: 16px; 
                            margin: 0; 
                        }
                        .footer {
                            margin-top: 40px;
                            font-size: 12px;
                            color: #5f6368;
                        }
                        @keyframes spin { 
                            0% { transform: rotate(0deg); } 
                            100% { transform: rotate(360deg); } 
                        }
                    </style>
                </head>
                <body>
                    <div class="logo-container">
                        <svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v8.51h13.9c-.59 2.97-2.27 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                    </div>
                    <div class="spinner"></div>
                    <h2>Um momento</h2>
                    <p>Conectando sua conta Google...</p>
                    <div class="footer">EffiSync Manager • Seguro e Privado</div>
                </body>
            </html>
        `;

        popup.document.write(googleLoginContent);

        // Simulate network delay and authentication
        setTimeout(() => {
            if (!popup.closed) popup.close();
            
            // Register a mock Google user in local storage
            const storedUsers = localStorage.getItem('effisync_users');
            const users = storedUsers ? JSON.parse(storedUsers) : [];
            const googleUserEmail = "usuario.google@gmail.com";
            
            if (!users.find((u: any) => u.email === googleUserEmail)) {
                // Save google user
                users.push({ email: googleUserEmail, password: "google-oauth-token-placeholder" });
                localStorage.setItem('effisync_users', JSON.stringify(users));
            }
            
            setSuccessMessage('Login com Google realizado com sucesso!');
            setTimeout(() => {
                 onLogin(true, googleUserEmail); // Always remember google login session
            }, 800);
        }, 3000); // 3 seconds delay for better UX
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg animate-fade-in-down">
        <div className="text-center">
          <div className="flex flex-col items-center justify-center text-white text-3xl font-bold mb-4">
            {shopLogoUrl ? (
                <img src={shopLogoUrl} alt="Logo" className="w-24 h-24 mb-4 rounded-full object-cover border-2 border-cyan-500 shadow-cyan-500/20 shadow-lg" />
            ) : (
                <ScissorsIcon className="w-20 h-20 text-cyan-500 mb-4" />
            )}
            <span>EffiSync Manager</span>
          </div>
          <p className="text-gray-400">
            {isRegistering 
                ? "Crie sua conta profissional." 
                : "Bem-vindo de volta! Acesse sua conta."}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              placeholder="seu@email.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
                 <label htmlFor="password"  className="text-sm font-medium text-gray-300">Senha</label>
                 {!isRegistering && (
                     <button 
                        type="button" 
                        onClick={() => setIsForgotPasswordOpen(true)}
                        className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                        Esqueceu a senha?
                    </button>
                 )}
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isRegistering ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              placeholder="******"
              disabled={isLoading}
            />
          </div>

          {isRegistering && (
            <div className="animate-fade-in">
                <label htmlFor="confirmPassword"  className="text-sm font-medium text-gray-300">Confirmar Senha</label>
                <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                placeholder="******"
                disabled={isLoading}
                />
            </div>
          )}

          {!isRegistering && (
             <div className="flex items-center">
                <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-600 rounded bg-gray-700"
                    disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                    Lembrar de mim
                </label>
            </div>
          )}

          {error && (
            <p className="text-sm text-center text-red-400 bg-red-900/20 p-2 rounded border border-red-500/50 animate-fade-in">{error}</p>
          )}
          
          {successMessage && (
            <p className="text-sm text-center text-green-400 bg-green-900/20 p-2 rounded border border-green-500/50 animate-fade-in">{successMessage}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-colors disabled:bg-cyan-800 disabled:cursor-wait"
            >
              {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              ) : null}
              {isLoading ? 'Processando...' : (isRegistering ? 'Cadastrar Conta' : 'Acessar Sistema')}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm">
            <p className="text-gray-400">
                {isRegistering ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
                <button 
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline focus:outline-none"
                    disabled={isLoading}
                >
                    {isRegistering ? "Faça Login" : "Criar conta grátis"}
                </button>
            </p>
        </div>

        {!isRegistering && (
            <>
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
                    disabled={isLoading}
                    className="w-full flex justify-center items-center px-4 py-2 font-medium text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-colors disabled:opacity-50"
                >
                    <GoogleIcon className="w-5 h-5 mr-3" />
                    Entrar com Google
                </button>
                </div>
            </>
        )}
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} title="Recuperar Senha">
          <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-gray-300 text-sm">
                  Digite seu email abaixo e enviaremos um link para você redefinir sua senha.
              </p>
              <div>
                  <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-300 mb-1">Email Cadastrado</label>
                  <input
                    id="forgotEmail"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="seu@email.com"
                  />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setIsForgotPasswordOpen(false)} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                      Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center disabled:bg-cyan-800"
                  >
                      {isLoading && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                      Enviar Link
                  </button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Login;
