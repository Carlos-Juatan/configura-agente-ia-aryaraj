import { USER_ROLES } from '../constants/auth';

export const useRole = () => {
  const role = localStorage.getItem('user_role');

  const isSuperAdmin = role === USER_ROLES.SUPERADMIN;
  const isAdmin = role === USER_ROLES.ADMIN;
  const isUsuarioAdmin = role === USER_ROLES.USUARIO_ADMIN;
  const isUsuario = role === USER_ROLES.USUARIO;

  const isTeam = isSuperAdmin || isAdmin;
  const isManagement = isTeam || isUsuarioAdmin;

  return {
    role,
    isSuperAdmin,
    isAdmin,
    isUsuarioAdmin,
    isUsuario,
    isTeam,
    isManagement
  };
};
