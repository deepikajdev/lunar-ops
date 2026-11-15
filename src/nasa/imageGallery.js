import { NASA_IMAGE_SNAPSHOT } from '../data/nasaSnapshots.js';

/** Curate only genuine NASA Images search results captured in the M0 response fixture. */
export function getCuratedNasaImages(snapshot = NASA_IMAGE_SNAPSHOT) {
  const items = (snapshot?.search ?? snapshot)?.collection?.items;
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    const data = item?.data?.[0];
    const image = item?.links?.find((link) => link.render === 'image' && /~medium\.(jpg|jpeg|png)$/i.test(link.href || ''));
    if (data?.media_type !== 'image' || !data.nasa_id || !data.title || !image) return [];
    return [{
      nasaId: data.nasa_id,
      title: data.title,
      description: data.description_508 || data.description || 'No description was supplied in the NASA Images record.',
      imageUrl: image.href,
      mediaType: data.media_type,
      credit: data.photographer || data.secondary_creator || data.center || 'Credit not supplied in the NASA Images record.',
      dateCreated: data.date_created || null,
      sourceUrl: item.href,
    }];
  });
}
