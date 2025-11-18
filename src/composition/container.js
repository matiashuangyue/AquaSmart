// src/composition/container.js
import { makeUsecases } from "../app/usecases.js";

// 👇 Usar repos locales, solo FRONT
import { LocalHistoryRepo } from "../infra/local/historyRepo.js";
import { LocalThresholdsRepo } from "../infra/local/thresholdsRepo.js";

export const usecases = makeUsecases(LocalHistoryRepo, LocalThresholdsRepo);

// Si más adelante querés volver a la API, cambiarías a:
// import { HttpHistoryRepo, HttpThresholdsRepo } from "../infra/http/httpRepo.js";
// export const usecases = makeUsecases(HttpHistoryRepo, HttpThresholdsRepo);
