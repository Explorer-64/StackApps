import "./admin";
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ region: "us-central1" });

export { ssrAppListing } from "./ssr";
export { manualRescan, runReadinessScan } from "./scanner";
export { appBadge } from "./badge";
export { sitemapXml } from "./sitemap";
export { pingGoogleIndexing } from "./indexing";
export { grantAdmin, revokeAdmin, listAdmins } from "./adminManagement";
export { publicScan } from "./publicScan";
