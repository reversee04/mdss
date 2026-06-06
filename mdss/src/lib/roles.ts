/**
 * User roles available in the application
 */
export const VALID_ROLES = ['admin', 'ministry_official', 'data_analyst'] as const;

export type UserRole = typeof VALID_ROLES[number];

/**
 * Validates if the provided role is a valid user role
 * @param role - The role to validate
 * @returns true if the role is valid, false otherwise
 */
export const validateRole = (role: string): role is UserRole => {
  return VALID_ROLES.includes(role as UserRole);
};

/**
 * Role descriptions for UI/documentation
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Administrator - Full system access',
  ministry_official: 'Ministry Official - Access to ministry-level data and reports',
  data_analyst: 'Data Analyst - Access to disease surveillance and outbreak data',
};
