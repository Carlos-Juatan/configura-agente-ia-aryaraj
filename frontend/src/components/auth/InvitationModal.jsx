import React, { useState } from 'react';
import { api } from '../../api/client';
import { USER_ROLES, ROLE_LABELS } from '../../constants/auth';

const InvitationModal = ({ isOpen, onClose, userRole }) => {
  const [targetRole, setTargetRole] = useState(USER_ROLES.USUARIO);
  const [expiresIn, setExpiresIn] = useState(24);
  const [invitationLink, setInvitationLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isSuperAdmin = userRole === USER_ROLES.SUPERADMIN;
  const isAdmin = userRole === USER_ROLES.ADMIN;
  const isUsuarioAdmin = userRole === USER_ROLES.USUARIO_ADMIN;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await api.post('/invitations', {
        target_role: targetRole,
        expires_in_hours: parseInt(expiresIn)
      });
      const data = await response.json();
      if (data.token) {
        const link = `${window.location.origin}/register?token=${data.token}`;
        setInvitationLink(link);
      }
    } catch (error) {
      console.error("Erro ao gerar convite:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header-refined">
          <div className="modal-title-with-icon">
            <div className="user-icon-circle" style={{ background: 'var(--primary-color)' }}>
              <span className="user-emoji">✉️</span>
            </div>
            <h2 className="modal-title">Convidar Novo Usuário</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="invitation-body" style={{ padding: '1.5rem 0' }}>
          {!invitationLink ? (
            <div className="invitation-form">
              <div className="form-group">
                <label>PAPEL DO CONVIDADO</label>
                <select 
                  value={targetRole} 
                  onChange={e => setTargetRole(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => {
                    if (isUsuarioAdmin && value !== USER_ROLES.USUARIO && value !== USER_ROLES.USUARIO_ADMIN) return null;
                    if (isAdmin && value === USER_ROLES.SUPERADMIN) return null;
                    return <option key={value} value={value}>{label}</option>;
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>EXPIRA EM (HORAS)</label>
                <input 
                  type="number" 
                  value={expiresIn} 
                  onChange={e => setExpiresIn(e.target.value)}
                  min="1"
                  max="168"
                />
              </div>
              <button 
                className="modal-btn modal-btn-confirm" 
                onClick={handleGenerate}
                disabled={loading}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {loading ? 'Gerando...' : 'Gerar Link de Convite'}
              </button>
            </div>
          ) : (
            <div className="invitation-result">
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Envie este link para o novo usuário. Ele expira em {expiresIn} horas.
              </p>
              <div className="link-copy-box" style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                background: 'rgba(0,0,0,0.05)', 
                padding: '0.75rem', 
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <input 
                  type="text" 
                  readOnly 
                  value={invitationLink} 
                  style={{ flex: 1, border: 'none', background: 'none', fontSize: '0.9rem' }}
                />
                <button 
                  onClick={copyToClipboard}
                  style={{ background: copied ? '#10b981' : 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', padding: '0 1rem', cursor: 'pointer' }}
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <button 
                className="modal-btn modal-btn-cancel" 
                onClick={() => setInvitationLink('')}
                style={{ width: '100%', marginTop: '1.5rem' }}
              >
                Gerar Outro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitationModal;
