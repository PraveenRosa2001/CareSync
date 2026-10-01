export const ROLES = Object.freeze({
  ADMIN: "Admin",
  DOCTOR: "Doc",
  PHARMACIST: "Phuser",
  PATIENT: "patient",
});

export const ACCESS = Object.freeze({
  DASHBOARD: [ROLES.ADMIN, ROLES.DOCTOR],
  PATIENT_RECORDS: [ROLES.ADMIN, ROLES.DOCTOR],
  DRUG_INVENTORY: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST],
  PHARMACY: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST],
  APPOINTMENTS: [ROLES.ADMIN, ROLES.DOCTOR],
  USER_STAFF: [ROLES.ADMIN],
  CLINICAL_DETAILS: [ROLES.ADMIN, ROLES.DOCTOR],
  PHARMACY_DETAILS: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST],
});

export const normalizeRole = (rawRole) => {
  const value = String(rawRole || "").trim().toLowerCase();

  if (
    ["admin", "administrator", "super admin", "superadmin"].includes(value)
  ) {
    return ROLES.ADMIN;
  }

  if (
    ["doc", "doctor", "attending doctor", "physician"].includes(value)
  ) {
    return ROLES.DOCTOR;
  }

  if (
    ["phuser", "pharmacist", "pharmacy", "licensed pharmacist"].includes(value)
  ) {
    return ROLES.PHARMACIST;
  }

  if (value === "patient") {
    return ROLES.PATIENT;
  }

  return "";
};

export const hasAccess = (rawRole, allowedRoles = []) => {
  const role = normalizeRole(rawRole);

  return Boolean(role) && allowedRoles.includes(role);
};

export const getDefaultDashboardPath = (rawRole) => {
  const role = normalizeRole(rawRole);

  if (role === ROLES.PHARMACIST) {
    return "/dashboard/register-medicines";
  }

  if (role === ROLES.ADMIN || role === ROLES.DOCTOR) {
    return "/dashboard/overview";
  }

  return "/welcome";
};

export const getRoleLabel = (rawRole) => {
  const role = normalizeRole(rawRole);

  if (role === ROLES.ADMIN) return "Super Admin";

  if (role === ROLES.DOCTOR) return "Attending Doctor";

  if (role === ROLES.PHARMACIST) return "Pharmacist";

  return "Staff User";
};