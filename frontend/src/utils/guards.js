import { USER_ROLES } from '../constants/auth';

/**
 * Checks if a user has at least one of the required roles.
 * @param {string} userRole 
 * @param {string[]} requiredRoles 
 * @returns {boolean}
 */
export const hasPermission = (userRole, requiredRoles) => {
  if (!userRole) return false;
  
  // SUPERADMIN has all permissions
  if (userRole === USER_ROLES.SUPERADMIN) return true;
  
  return requiredRoles.includes(userRole);
};

/**
 * Hierarchy helper: Checks if role A is equal or higher than role B
 * Hierarchy: SUPERADMIN > ADMIN > USUARIO_ADMIN > USUARIO
 */
const ROLE_HIERARCHY = [
  USER_ROLES.USUARIO,
  USER_ROLES.USUARIO_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.SUPERADMIN
];

export const isAtLeast = (userRole, targetRole) => {
  const userIdx = ROLE_HIERARCHY.indexOf(userRole);
  const targetIdx = ROLE_HIERARCHY.indexOf(targetRole);
  return userIdx >= targetIdx && userIdx !== -1;
};
