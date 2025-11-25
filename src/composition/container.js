// src/composition/container.js
import { makeUsecases } from "../app/usecases.js";

// 👇 Usar repos HTTP reales (API backend)
import { HttpHistoryRepo, HttpThresholdsRepo } from "../infra/http/httpRepo.js";

export const usecases = makeUsecases(HttpHistoryRepo, HttpThresholdsRepo);

// 👇 Usar repos locales (LocalStorage) - para desarrollo sin backend
// import { LocalHistoryRepo } from "../infra/local/historyRepo.js";
// import { LocalThresholdsRepo } from "../infra/local/thresholdsRepo.js";
// export const usecases = makeUsecases(LocalHistoryRepo, LocalThresholdsRepo);
