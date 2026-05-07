import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import ConfirmModal from './ConfirmModal';
import ResetSuccessModal from './ResetSuccessModal';
import InvitationModal from './auth/InvitationModal';
import { USER_ROLES, ROLE_LABELS } from '../constants/auth';
import { useRole } from '../hooks/useRole';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, userId: null, userName: '' });
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showResetSuccess, setShowResetSuccess] = useState(false);
    const [showInvitation, setShowInvitation] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: USER_ROLES.USUARIO,
        status: 'ATIVO'
    });

    const { role: userRole, isSuperAdmin, isAdmin, isUsuarioAdmin } = useRole();
    const currentUserId = parseInt(localStorage.getItem('user_id'));

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleResetSystem = async () => {
        try {
            setIsResetting(true);
            const response = await api.post('/system/reset-database');
            if (response.ok) {
                setShowResetConfirm(false);
                setShowResetSuccess(true);
            } else {
                alert("Erro ao resetar sistema. Verifique as permissões de rede.");
            }
        } catch (error) {
            console.error("Erro no reset:", error);
        } finally {
            setIsResetting(false);
            setShowResetConfirm(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async (user) => {
        let newRole;
        if (user.role === USER_ROLES.USUARIO) newRole = USER_ROLES.USUARIO_ADMIN;
        else if (user.role === USER_ROLES.USUARIO_ADMIN) newRole = USER_ROLES.ADMIN;
        else if (user.role === USER_ROLES.ADMIN) newRole = USER_ROLES.SUPERADMIN;
        else return;

        try {
            const response = await api.patch(`/users/${user.id}/role`, { role: newRole });
            if (response.ok) fetchUsers();
            else alert("Erro ao promover usuário.");
        } catch (error) {
            console.error("Erro ao promover:", error);
        }
    };

    const handleRevoke = async (user) => {
        let newRole;
        if (user.role === USER_ROLES.SUPERADMIN) newRole = USER_ROLES.ADMIN;
        else if (user.role === USER_ROLES.ADMIN) newRole = USER_ROLES.USUARIO_ADMIN;
        else if (user.role === USER_ROLES.USUARIO_ADMIN) newRole = USER_ROLES.USUARIO;
        else return;

        try {
            const response = await api.patch(`/users/${user.id}/role`, { role: newRole });
            if (response.ok) fetchUsers();
            else {
                const data = await response.json();
                alert(data.detail || "Erro ao revogar acesso.");
            }
        } catch (error) {
            console.error("Erro ao revogar:", error);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: user.password,
                role: user.role,
                status: user.status
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: USER_ROLES.USUARIO,
                status: 'ATIVO'
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = editingUser
                ? await api.put(`/users/${editingUser.id}`, formData)
                : await api.post('/users', formData);

            if (response.ok) {
                setShowModal(false);
                fetchUsers();
            } else {
                alert("Erro ao salvar usuário. Verifique se o e-mail já existe.");
            }
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
        }
    };

    const handleDeleteClick = (user) => {
        setConfirmDelete({
            isOpen: true,
            userId: user.id,
            userName: user.name
        });
    };

    const handleConfirmDelete = async () => {
        try {
            await api.delete(`/users/${confirmDelete.userId}`);
            setConfirmDelete({ isOpen: false, userId: null, userName: '' });
            fetchUsers();
        } catch (error) {
            console.error("Erro ao deletar usuário:", error);
        }
    };

    const [showPromotionModal, setShowPromotionModal] = useState(false);
    const [promotionUser, setPromotionUser] = useState(null);

    const handleOpenPromotionModal = (user) => {
        setPromotionUser(user);
        setShowPromotionModal(true);
    };

    const handleUpdateRole = async (newRole) => {
        try {
            const response = await api.patch(`/users/${promotionUser.id}/role`, { role: newRole });
            if (response.ok) {
                setShowPromotionModal(false);
                fetchUsers();
            } else {
                const data = await response.json();
                alert(data.detail || "Erro ao alterar papel do usuário.");
            }
        } catch (error) {
            console.error("Erro ao alterar papel:", error);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="user-management">
            <header className="page-header">
                <div className="title-group">
                    <h1>Gestão de Usuários</h1>
                    {isSuperAdmin && (
                        <button
                            className="reset-system-btn"
                            onClick={() => setShowResetConfirm(true)}
                            title="Limpar todos os dados do banco"
                        >
                            <span className="icon">⚠️</span> Zerar Sistema
                        </button>
                    )}
                </div>
                <button className="add-user-btn" onClick={() => setShowInvitation(true)}>
                    <span className="icon">👤</span> Convidar Usuário
                </button>
            </header>

            <div className="filter-bar">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="role-select"
                >
                    <option value="all">Todos os Cargos</option>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            <div className="users-table-container card-premium">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>NOME / EMAIL</th>
                            <th>CARGO</th>
                            <th>STATUS</th>
                            <th className="text-right">AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" className="text-center">Carregando usuários...</td></tr>
                        ) : filteredUsers.map(user => (
                            <tr key={user.id} className="user-row">
                                <td>
                                    <div className="user-cell">
                                        <span className="user-name">{user.name}</span>
                                        <span className="user-email">{user.email}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge badge-${(user.role || '').toLowerCase().replace(' ', '-')}`}>
                                        {ROLE_LABELS[user.role] || user.role}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-indicator ${user.status === 'ATIVO' ? 'active' : 'inactive'}`}>
                                        <span className="checkmark">{user.status === 'ATIVO' ? '✓' : '○'}</span> {user.status}
                                    </span>
                                </td>
                                <td className="text-right">
                                    <div className="row-actions">
                                        {user.id !== currentUserId && (
                                            <>
                                                {((isSuperAdmin || isAdmin) || (isUsuarioAdmin && (user.role === USER_ROLES.USUARIO || user.role === USER_ROLES.USUARIO_ADMIN))) && (
                                                    <button 
                                                        className="action-btn promote" 
                                                        onClick={() => handleOpenPromotionModal(user)} 
                                                        title="Alterar Cargo / Promover"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>
                                                    </button>
                                                )}
                                                
                                                {(isSuperAdmin || (isAdmin && user.role !== USER_ROLES.SUPERADMIN) || (isUsuarioAdmin && user.role === USER_ROLES.USUARIO)) && (
                                                    <button className="action-btn delete" onClick={() => handleDeleteClick(user)} title="Excluir">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content user-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-refined">
                            <div className="modal-title-with-icon">
                                <div className="user-icon-circle">
                                    <span className="user-emoji">👤</span>
                                    <span className="plus-badge">+</span>
                                </div>
                                <h2 className="modal-title">{editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="user-form">
                            <div className="form-group">
                                <label>NOME COMPLETO</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: João Silva"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>EMAIL DAS BOAS-VINDAS</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="exemplo@email.com"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <div className="form-group">
                                <label>SENHA INICIAL</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="........"
                                        required={!editingUser}
                                        autoComplete="new-password"
                                        style={{ paddingRight: '40px', width: '100%' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#94a3b8' }}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>NÍVEL DE ACESSO (ROLE)</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        {Object.entries(ROLE_LABELS).map(([value, label]) => {
                                            if (isUsuarioAdmin && value !== USER_ROLES.USUARIO && value !== USER_ROLES.USUARIO_ADMIN) return null;
                                            if (isAdmin && value === USER_ROLES.SUPERADMIN) return null;
                                            return <option key={value} value={value}>{label}</option>;
                                        })}
                                    </select>
                                </div>
                                <div className="form-group half">
                                    <label>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="ATIVO">Ativo</option>
                                        <option value="INATIVO">Inativo</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="modal-btn modal-btn-confirm">
                                    Salvar Usuário
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPromotionModal && promotionUser && (
                <div className="modal-overlay" onClick={() => setShowPromotionModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header-refined">
                            <h2 className="modal-title">Alterar Cargo</h2>
                            <button className="modal-close-btn" onClick={() => setShowPromotionModal(false)}>✕</button>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                Selecione o novo cargo para <strong>{promotionUser.name}</strong>. 
                                O cargo atual é <strong>{ROLE_LABELS[promotionUser.role]}</strong>.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {Object.entries(ROLE_LABELS).map(([value, label]) => {
                                    // Regras de exibição no modal de promoção:
                                    // 1. SuperAdmin pode promover para qualquer um.
                                    // 2. Admin pode promover para Usuario, UsuarioAdmin ou Admin.
                                    // 3. UsuarioAdmin pode promover apenas para Usuario ou UsuarioAdmin.
                                    
                                    const isSelf = promotionUser.id === currentUserId;
                                    if (isSelf) return null;

                                    if (isUsuarioAdmin && value !== USER_ROLES.USUARIO && value !== USER_ROLES.USUARIO_ADMIN) return null;
                                    if (isAdmin && value === USER_ROLES.SUPERADMIN) return null;
                                    
                                    const isCurrent = promotionUser.role === value;

                                    return (
                                        <button
                                            key={value}
                                            onClick={() => handleUpdateRole(value)}
                                            disabled={isCurrent}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: isCurrent ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                                                background: isCurrent ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                                                color: isCurrent ? '#818cf8' : 'white',
                                                cursor: isCurrent ? 'default' : 'pointer',
                                                textAlign: 'left',
                                                fontWeight: isCurrent ? 'bold' : 'normal',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {label} {isCurrent && ' (Atual)'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onCancel={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title="Excluir Usuário"
                message={`Tem certeza que deseja excluir o usuário "${confirmDelete.userName}"? Esta ação não pode ser desfeita.`}
                confirmText="Excluir Usuário"
                cancelText="Cancelar"
                type="danger"
            />

            <ConfirmModal
                isOpen={showResetConfirm}
                onCancel={() => setShowResetConfirm(false)}
                onConfirm={handleResetSystem}
                title="⚠️ ZERAR TODO O SISTEMA?"
                message="ESTA É UMA AÇÃO IRREVERSÍVEL! Todos os agentes, configurações de RAG, bases de conhecimento, logs de conversas e ferramentas serão EXCLUÍDOS PERMANENTEMENTE para deixar o projeto limpo. Apenas os usuários cadastrados serão mantidos. Deseja prosseguir?"
                confirmText={isResetting ? "Limpando..." : "Sim, Zerar Agora"}
                cancelText="Cancelar"
                type="danger"
            />

            <ResetSuccessModal
                isOpen={showResetSuccess}
                onClose={() => window.location.reload()}
            />

            <InvitationModal 
                isOpen={showInvitation}
                onClose={() => setShowInvitation(false)}
                userRole={userRole}
            />
        </div>
    );
};

export default UserManagement;
