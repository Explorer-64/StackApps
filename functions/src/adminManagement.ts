import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { db } from "./admin";

const SUPER_ADMIN_EMAILS = ["stackapps.app@gmail.com"];

export const grantAdmin = onCall(async (request) => {
  if (!request.auth || !SUPER_ADMIN_EMAILS.includes(request.auth.token.email ?? "")) {
    throw new HttpsError("permission-denied", "Superadmin only.");
  }

  const email = request.data?.email;
  if (typeof email !== "string" || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Valid email required.");
  }

  try {
    const user = await getAuth().getUserByEmail(email);
    await db.collection("admin_users").doc(user.uid).set({
      email,
      grantedAt: new Date().toISOString(),
      grantedBy: request.auth.token.email,
    });
    return { uid: user.uid, email };
  } catch {
    throw new HttpsError("not-found", "No Firebase user found with that email.");
  }
});

export const revokeAdmin = onCall(async (request) => {
  if (!request.auth || !SUPER_ADMIN_EMAILS.includes(request.auth.token.email ?? "")) {
    throw new HttpsError("permission-denied", "Superadmin only.");
  }

  const uid = request.data?.uid;
  if (typeof uid !== "string" || uid.trim() === "") {
    throw new HttpsError("invalid-argument", "uid required.");
  }

  await db.collection("admin_users").doc(uid).delete();
  return { uid };
});

export const listAdmins = onCall(async (request) => {
  if (!request.auth || !SUPER_ADMIN_EMAILS.includes(request.auth.token.email ?? "")) {
    throw new HttpsError("permission-denied", "Superadmin only.");
  }

  const snap = await db.collection("admin_users").get();
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
});

