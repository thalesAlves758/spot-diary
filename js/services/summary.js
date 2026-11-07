// Derived data about a place's visits. Pure functions: nothing here is stored.

/** Newest first: by visit date, then by creation time (two visits on the same day). */
export function compareVisitsNewestFirst(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
}

/** Average of integer ratings with one decimal place, halves rounded up (RN08). */
export function averageRating(ratings) {
  const total = ratings.reduce((sum, r) => sum + r, 0);
  return Math.round((total * 10) / ratings.length) / 10;
}

/**
 * Summary of a place's visits (RN07, RN08). `visits` are the visits of this place only.
 * Returns `{ average, lastVisit, lastWouldReturn, visitCount }`; without visits,
 * `average`, `lastVisit` and `lastWouldReturn` are `null`.
 * `lastVisit` is the date (`YYYY-MM-DD`) of the most recent visit.
 */
export function placeSummary(place, visits = []) {
  if (!visits.length) {
    return { average: null, lastVisit: null, lastWouldReturn: null, visitCount: 0 };
  }
  const latest = visits.reduce((best, v) => (compareVisitsNewestFirst(v, best) < 0 ? v : best));
  return {
    average: averageRating(visits.map((v) => v.rating)),
    lastVisit: latest.date,
    lastWouldReturn: latest.wouldReturn,
    visitCount: visits.length,
  };
}

/** Groups visits by `placeId` in a Map (one pass, so 1.000 places stay fast). */
export function groupVisitsByPlace(visits) {
  const map = new Map();
  for (const visit of visits) {
    const list = map.get(visit.placeId);
    if (list) list.push(visit);
    else map.set(visit.placeId, [visit]);
  }
  return map;
}

/** Pairs every place with its summary: `[{ place, summary }]`. */
export function withSummaries(places, visits) {
  const byPlace = groupVisitsByPlace(visits);
  return places.map((place) => ({ place, summary: placeSummary(place, byPlace.get(place.id)) }));
}
