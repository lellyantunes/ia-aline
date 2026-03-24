export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Check if we're in demo mode (no OAuth configured)
export const isDemoMode = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  return !oauthPortalUrl || oauthPortalUrl === "" || oauthPortalUrl === "undefined";
};

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // In demo mode, redirect to demo login endpoint
  if (isDemoMode()) {
    return `/api/demo-login`;
  }

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
