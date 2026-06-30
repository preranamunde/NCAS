// ─────────────────────────────────────────────────────────────────────────────
// Temporary base URL override — Create Profile API only
// ─────────────────────────────────────────────────────────────────────────────
//
// The "Create Profile" (POST /profile) call currently needs to hit a
// different backend than the rest of the app (localhost:8080), while every
// other API call keeps using the shared API_BASE_URL from ./config.
//
// Kept in its own file on purpose so it's easy to find and delete once the
// Create Profile endpoint moves over to the shared base URL.

export const CREATE_PROFILE_BASE_URL = 'http://localhost:8080/api';