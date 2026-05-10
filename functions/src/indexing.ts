import { GoogleAuth } from "google-auth-library";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

type AppDocument = {
  slug?: string;
  status?: string;
  moderationStatus?: string;
};

const indexingEndpoint = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const indexingScope = "https://www.googleapis.com/auth/indexing";

export const pingGoogleIndexing = onDocumentWritten("apps/{appId}", async (event) => {
  const before = event.data?.before.data() as AppDocument | undefined;
  const afterSnapshot = event.data?.after;

  if (!afterSnapshot?.exists) {
    return;
  }

  const after = afterSnapshot.data() as AppDocument;

  if (
    after.moderationStatus !== "approved" ||
    after.status !== "live" ||
    before?.moderationStatus === "approved"
  ) {
    return;
  }

  if (typeof after.slug !== "string" || after.slug.trim() === "") {
    return;
  }

  const url = `https://stackapps.app/apps/${encodeURIComponent(after.slug)}`;

  try {
    const auth = new GoogleAuth({ scopes: [indexingScope] });
    const token = await auth.getAccessToken();

    if (!token) {
      console.error("Google Indexing API token unavailable", { appId: event.params.appId, url });
      return;
    }

    const response = await fetch(indexingEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, type: "URL_UPDATED" }),
    });

    console.log("Google Indexing API response", {
      appId: event.params.appId,
      url,
      status: response.status,
    });
  } catch (error) {
    console.error("Google Indexing API ping failed", { appId: event.params.appId, url, error });
  }
});
