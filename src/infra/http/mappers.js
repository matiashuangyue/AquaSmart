export function toDomainThresholds(api) {
  if (!api) return null;

  return {
    ph: {
      min: api.phMin,
      max: api.phMax,
    },
    cl: {
      min: api.chlorMin,
      max: api.chlorMax,
    },
    t: {
      min: api.tempMin,
      max: api.tempMax,
    },
  };
}

export function toApiThresholds(domain, poolId) {
  return {
    poolId,
    phMin: domain.ph.min,
    phMax: domain.ph.max,
    chlorMin: domain.cl.min,
    chlorMax: domain.cl.max,
    tempMin: domain.t.min,
    tempMax: domain.t.max,
  };
}
