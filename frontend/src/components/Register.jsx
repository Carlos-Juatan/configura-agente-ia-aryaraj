import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const Register = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de convite ausente.');
      setLoading(false);
      return;
    }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await api.get(`/invitations/${token}`);
      if (response.ok) {
        const data = await response.json();
        setInvitation(data);
      } else {
        setError('Convite inválido ou expirado.');
      }
    } catch (err) {
      setError('Erro ao validar convite.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await api.post('/register', {
        token,
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      if (response.ok) {
        alert('Cadastro realizado com sucesso! Agora você pode fazer login.');
        navigate('/login');
      } else {
        const data = await response.json();
        alert(data.detail || 'Erro ao realizar cadastro.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="login-page">
      <div className="mesh-background"></div>
      <div className="login-box fade-in">
        <p style={{ color: '#94a3b8' }}>Validando convite...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="login-page">
      <div className="mesh-background"></div>
      <div className="login-box fade-in" style={{ borderColor: '#ef4444' }}>
        <div className="brand-logo" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>⚠️</div>
        <h1 style={{ color: '#ef4444', background: 'none', WebkitTextFillColor: '#ef4444' }}>Ops!</h1>
        <p style={{ marginTop: '1rem' }}>{error}</p>
        <button className="login-btn-primary" onClick={() => navigate('/login')} style={{ marginTop: '2rem' }}>
          Voltar ao Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="login-page">
      <div className="mesh-background"></div>
      <div className="login-box fade-in" style={{ maxWidth: '460px' }}>
        <div className="login-header">
          <div className="brand-logo">🤖</div>
          <h1>Criar sua Conta</h1>
          <p>Você foi convidado como <strong>{invitation.target_role}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>NOME COMPLETO</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input 
                type="text" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Como deseja ser chamado?"
              />
            </div>
          </div>

          <div className="form-group">
            <label>E-MAIL</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input 
                type="email" 
                required 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>SENHA</label>
            <div className="input-wrapper">
              <span className="input-icon">🔑</span>
              <input 
                type={showPassword ? "text" : "password"}
                required 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
              />
              <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
              >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>CONFIRMAR SENHA</label>
            <div className="input-wrapper">
              <span className="input-icon">🛡️</span>
              <input 
                type={showPassword ? "text" : "password"}
                required 
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button type="submit" className="login-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Cadastrando...' : 'Finalizar Cadastro'}
          </button>
        </form>

        <div className="login-footer">
            &copy; 2024 Agent Flow &bull; Automação Sem Limites
        </div>

        <style>{`
          .login-page {
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: transparent;
              color: white;
              overflow: hidden;
          }

          .login-box {
              width: 100%;
              max-width: 420px;
              padding: 2.5rem;
              background: rgba(30, 41, 59, 0.4);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 30px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
              text-align: center;
          }

          .login-header { margin-bottom: 2rem; }
          
          .brand-logo {
              font-size: 3.5rem;
              margin-bottom: 1rem;
              display: inline-block;
              background: rgba(99, 102, 241, 0.1);
              width: 80px;
              height: 80px;
              line-height: 80px;
              border-radius: 20px;
              border: 1px solid rgba(99, 102, 241, 0.2);
              box-shadow: 0 0 20px rgba(99, 102, 241, 0.1);
          }

          .login-header h1 {
              font-size: 2rem;
              font-weight: 800;
              margin: 0;
              background: linear-gradient(135deg, #fff, #94a3b8);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
          }

          .login-header p {
              color: #94a3b8;
              font-size: 0.95rem;
              margin-top: 8px;
          }

          .login-form { text-align: left; }

          .form-group { margin-bottom: 1.2rem; }
          
          .form-group label {
              display: block;
              font-size: 0.85rem;
              font-weight: 600;
              color: #e2e8f0;
              margin-bottom: 8px;
              margin-left: 12px;
          }

          .input-wrapper {
              position: relative;
              width: 100%;
          }

          .input-icon {
              position: absolute;
              left: 16px;
              top: 50%;
              transform: translateY(-50%);
              z-index: 2;
              opacity: 0.8;
              color: #6366f1;
              pointer-events: none;
          }

          .input-wrapper input {
              width: 100%;
              padding: 12px 16px 12px 48px;
              background: rgba(15, 23, 42, 0.7) !important;
              border: 2px solid rgba(255, 255, 255, 0.2) !important;
              border-radius: 16px;
              color: white !important;
              font-size: 0.95rem;
              outline: none;
              transition: all 0.3s;
              caret-color: #6366f1;
          }

          .input-wrapper input:focus {
              border-color: #6366f1 !important;
              box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2) !important;
              background: rgba(30, 41, 59, 0.8) !important;
          }

          .toggle-password {
              position: absolute;
              right: 12px;
              top: 50%;
              transform: translateY(-50%);
              z-index: 2;
              background: transparent;
              border: none;
              color: #94a3b8;
              cursor: pointer;
              padding: 8px;
              font-size: 1.2rem;
              display: flex;
              align-items: center;
              justify-content: center;
          }

          .login-btn-primary {
              width: 100%;
              padding: 14px;
              background: linear-gradient(135deg, #6366f1, #4f46e5);
              color: white;
              border: none;
              border-radius: 16px;
              font-weight: 700;
              font-size: 1rem;
              cursor: pointer;
              transition: all 0.3s;
              box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
              margin-top: 1rem;
          }

          .login-btn-primary:hover:not(:disabled) {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
          }

          .login-btn-primary:disabled {
              opacity: 0.6;
              cursor: not-allowed;
          }

          .login-footer {
              margin-top: 2rem;
              font-size: 0.75rem;
              color: #64748b;
              letter-spacing: 0.05em;
          }

          .fade-in {
              animation: fadeIn 0.8s ease-out;
          }

          @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Register;
