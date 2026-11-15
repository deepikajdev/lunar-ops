import cmeRecords from '../../tests/fixtures/nasa/donki-cme-2024-05-08-to-12-demokey-test.json' with { type: 'json' };
import cmeMetadata from '../../tests/fixtures/nasa/donki-cme-2024-05-08-to-12-demokey-test.meta.json' with { type: 'json' };
import gstRecords from '../../tests/fixtures/nasa/donki-gst-2024-05-08-to-12-demokey-test.json' with { type: 'json' };
import gstMetadata from '../../tests/fixtures/nasa/donki-gst-2024-05-08-to-12-demokey-test.meta.json' with { type: 'json' };
import sepRecords from '../../tests/fixtures/nasa/donki-sep-2024-05-08-to-12-demokey-test.json' with { type: 'json' };
import sepMetadata from '../../tests/fixtures/nasa/donki-sep-2024-05-08-to-12-demokey-test.meta.json' with { type: 'json' };
import ipsRecords from '../../tests/fixtures/nasa/donki-ips-2024-05-08-to-12-demokey-test.json' with { type: 'json' };
import ipsMetadata from '../../tests/fixtures/nasa/donki-ips-2024-05-08-to-12-demokey-test.meta.json' with { type: 'json' };
import imageSearch from '../../tests/fixtures/nasa/images-search-lunar-outpost.json' with { type: 'json' };
import imageAsset from '../../tests/fixtures/nasa/images-asset-jsc2026e417568.json' with { type: 'json' };
import imageMetadata from '../../tests/fixtures/nasa/images-metadata-jsc2026e417568.json' with { type: 'json' };

function archiveSource(metadata) {
  const url = new URL(metadata.endpoint);
  for (const [key, value] of Object.entries(metadata.queryParameters ?? {})) url.searchParams.set(key, value);
  const archivedAt = new Date(metadata.responseHeaders.Date).toISOString();
  return Object.freeze({ type: 'NASA_ARCHIVE', sourceUrl: url.toString(), archivedAt });
}

export const NASA_EVENT_SNAPSHOTS = Object.freeze({
  cme: Object.freeze({ kind: 'cme', records: cmeRecords, provenance: archiveSource(cmeMetadata) }),
  gst: Object.freeze({ kind: 'gst', records: gstRecords, provenance: archiveSource(gstMetadata) }),
  sep: Object.freeze({ kind: 'sep', records: sepRecords, provenance: archiveSource(sepMetadata) }),
  ips: Object.freeze({ kind: 'ips', records: ipsRecords, provenance: archiveSource(ipsMetadata) }),
});

export const NASA_IMAGE_SNAPSHOT = Object.freeze({ search: imageSearch, asset: imageAsset, metadata: imageMetadata });
