import React from 'react';
import { hasPermission } from '../../utils/guards';

/**
 * Component that conditionally renders children based on user role.
 */
const RoleGuard = ({ children, userRole, requiredRoles, fallback = null }) => {
  if (hasPermission(userRole, requiredRoles)) {
    return <>{children}</>;
  }
  return fallback;
};

export default RoleGuard;
