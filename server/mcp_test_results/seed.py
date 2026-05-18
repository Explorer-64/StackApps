import json
import os
from datetime import datetime, timezone
from pathlib import Path


def main() -> None:
    raw = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
    if not raw:
        raise SystemExit("FIREBASE_SERVICE_ACCOUNT_KEY is not set")

    import firebase_admin
    from firebase_admin import credentials, firestore

    if not firebase_admin._apps:
        cred = credentials.Certificate(json.loads(raw))
        firebase_admin.initialize_app(cred, {
            "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET", ""),
        })

    here = Path(__file__).resolve().parent
    payload = json.loads((here / "gemini_run_1.json").read_text(encoding="utf-8"))

    model = str(payload.get("model") or "").strip() or "gemini"
    result_obj = dict(payload)
    result_obj.pop("savedAt", None)

    db = firestore.client()
    doc_ref = db.collection("mcp_blueprint_test_runs").document()
    doc_ref.set({
        "model": model,
        "result": result_obj,
        "savedAt": datetime.now(timezone.utc).isoformat(),
        "savedBy": "seed-script",
    })

    print(doc_ref.id)


if __name__ == "__main__":
    main()
