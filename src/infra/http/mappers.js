// Convierte el objeto de API -> dominio (lo que espera tu UI)
export function toDomainThresholds(api) {
    if (!api) return null;
    return {
      ph: { min: api.phMin, max: api.phMax },
      cl: { min: api.chlorMin, max: api.chlorMax },
      t:  { min: api.tempMin, max: api.tempMax },
    };
  }
  
  // Convierte dominio -> API para guardar
  export function toApiThresholds(domain, poolId = "pool1") {
    return {
      poolId,
      phMin: domain.ph.min,   phMax: domain.ph.max,
      chlorMin: domain.cl.min, chlorMax: domain.cl.max,
      tempMin: domain.t.min,   tempMax: domain.t.max,
    };
  }
  