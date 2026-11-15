import test from 'node:test';
import assert from 'node:assert/strict';
import { getCuratedNasaImages } from '../imageGallery.js';
import { NASA_IMAGE_SNAPSHOT } from '../../data/nasaSnapshots.js';

test('curated gallery uses genuine NASA fixture titles, credits, source links, and image URLs', () => {
  const results = getCuratedNasaImages();
  assert.equal(results.length, 3);
  assert.deepEqual(results.map((item) => item.nasaId), NASA_IMAGE_SNAPSHOT.search.collection.items.map((item) => item.data[0].nasa_id));
  for (const item of results) {
    assert.ok(item.title);
    assert.ok(item.credit);
    assert.equal(item.mediaType, 'image');
    assert.match(item.imageUrl, /^https:\/\/images-assets\.nasa\.gov\//);
    assert.match(item.sourceUrl, /^https:\/\/images-assets\.nasa\.gov\//);
  }
});

test('gallery rejects malformed and non-image entries without fabricating metadata', () => {
  assert.deepEqual(getCuratedNasaImages({ collection: { items: [{ data: [{ nasa_id: 'x', title: 'not enough' }], links: [] }] } }), []);
  assert.deepEqual(getCuratedNasaImages({}), []);
});
