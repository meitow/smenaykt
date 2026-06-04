const DEFAULT_CITY = "Якутск";
const DEFAULT_CITY_SLUG = "yakutsk";

function placeQuery(place: string, city = DEFAULT_CITY): string {
  const trimmedPlace = place.trim();
  if (!trimmedPlace) return city;
  if (trimmedPlace.toLowerCase().includes(city.toLowerCase())) return trimmedPlace;
  return `${trimmedPlace}, ${city}`;
}

/**
 * Opens 2GIS app if installed, otherwise the web map.
 * @see https://help.2gis.ru/question/razrabotchikam-zapusk-ideystviya-vmobilnom-prilozhenii-cherez-deeplink
 */
export function build2GisSearchUrl(query: string, citySlug = DEFAULT_CITY_SLUG): string {
  const trimmed = query.trim();
  if (!trimmed) return `https://2gis.ru/${citySlug}`;
  return `https://2gis.ru/${citySlug}/search/${encodeURIComponent(trimmed)}`;
}

/** Search a task address in Yakutsk. */
export function build2GisPlaceUrl(place: string, city = DEFAULT_CITY, citySlug = DEFAULT_CITY_SLUG): string {
  return build2GisSearchUrl(placeQuery(place, city), citySlug);
}

/** Pedestrian route search in 2GIS (opens route builder). */
export function build2GisRouteUrl(place: string, city = DEFAULT_CITY, citySlug = DEFAULT_CITY_SLUG): string {
  const query = encodeURIComponent(placeQuery(place, city));
  return `https://2gis.ru/${citySlug}/directions/points/|${query}`;
}

export { DEFAULT_CITY, DEFAULT_CITY_SLUG };
