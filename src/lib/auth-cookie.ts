const COOKIE_NAME = "accessToken";

export function setAccessTokenCookie(token: string) {
  if (typeof window === "undefined") return;
  let maxAge = 3600;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp) {
      maxAge = payload.exp - Math.floor(Date.now() / 1000);
    }
  } catch {
    // keep default
  }
  document.cookie = `${COOKIE_NAME}=${token}; path=/; SameSite=Lax; max-age=${maxAge}`;
}

export function clearAccessTokenCookie() {
  if (typeof window === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; SameSite=Lax; max-age=0`;
}
