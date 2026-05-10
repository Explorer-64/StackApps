import type { User } from "firebase/auth";

const ENTITLEMENTS_API = "https://backend-api-968318684377.us-central1.run.app";
const APP_ID = "stackapps";
const REGISTERED_KEY = "stackapps_entitlement_registered";

async function getFirebaseToken(user: User): Promise<string> {
  return user.getIdToken();
}

export async function registerEntitlement(user: User): Promise<void> {
  const cacheKey = `${REGISTERED_KEY}_${user.uid}`;
  if (sessionStorage.getItem(cacheKey)) return;

  try {
    const token = await getFirebaseToken(user);
    const res = await fetch(`${ENTITLEMENTS_API}/entitlements/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        app_id: APP_ID,
        plan: "free",
      }),
    });
    if (res.ok || res.status === 409) {
      sessionStorage.setItem(cacheKey, "true");
    } else {
      console.error("Entitlement registration failed:", res.status);
    }
  } catch (err) {
    console.error("Entitlement registration error:", err);
  }
}

export async function checkEntitlement(user: User): Promise<boolean> {
  try {
    const token = await getFirebaseToken(user);
    const res = await fetch(`${ENTITLEMENTS_API}/entitlements/check/${APP_ID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.has_access === true;
  } catch (err) {
    console.error("Entitlement check error:", err);
    return false;
  }
}
