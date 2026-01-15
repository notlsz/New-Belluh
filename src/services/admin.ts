
// ✅ HARDCODED - Your specific user ID only.
// This prevents anyone else from even triggering the admin logic.
// Replace this with your actual Supabase User ID found in the Authentication tab.
export const ADMIN_USER_ID = 'd95a25a6-e873-41d1-80ef-26258d3ff3b7';

export const isAdmin = (userId: string | null | undefined): boolean => {
  if (!userId) return false;
  return userId === ADMIN_USER_ID;
};
