export function isAdmin(profile) {
  return profile?.role === "admin";
}