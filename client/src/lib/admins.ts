import type { User } from "firebase/auth";

export const ADMIN_EMAILS = [
  "stackapps.app@gmail.com",
  "stackapps.app@gmail.com",
];

// Open-source note: replace `ADMIN_EMAILS` with the deployer's own admin emails.

export const isAdmin = (user: User | null | undefined): boolean => {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email);
};
