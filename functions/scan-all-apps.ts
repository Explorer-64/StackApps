import * as admin from 'firebase-admin';
import { scanApp } from './src/scanner';
import { db } from './src/admin';

async function run() {
  const snapshot = await db.collection('apps').where('moderationStatus', '==', 'approved').get();

  console.log(`Scanning ${snapshot.docs.length} apps...`);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    console.log(`Scanning: ${data.name} (${docSnap.id})`);

    try {
      const fields = await scanApp(data as any);
      const passesBaseline = fields.scan_reachable && fields.scan_robots && fields.scan_sitemap && fields.scan_llms;

      const update: Record<string, unknown> = {
        ...fields,
        scan_timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (!passesBaseline && data.status === 'live') {
        update.status = 'building';
        console.log(`  → Demoted to building (failed baseline)`);
      } else if (passesBaseline && data.status === 'building' && data.safetyVerified === true) {
        update.status = 'live';
        console.log(`  → Promoted back to live`);
      }

      await docSnap.ref.update(update);
      console.log(`  ✓ Score: ${fields.scan_score}/12`);
    } catch (err) {
      console.error(`  ✗ Failed:`, err);
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('Done.');
}

run().catch(console.error);
