// src/composition/container.js
import { makeUsecases } from "../app/usecases.js";

// ⬇️ Usa los repos que llaman a tu API
import { HttpHistoryRepo, HttpThresholdsRepo } from "../infra/http/httpRepo.js";

// Si alguna vez querés volver a localStorage (sin API):
// import { LocalHistoryRepo } from "../infra/local/historyRepo.js";
// import { LocalThresholdsRepo } from "../infra/local/thresholdsRepo.js";
// export const usecases = makeUsecases(LocalHistoryRepo, LocalThresholdsRepo);

export const usecases = makeUsecases(HttpHistoryRepo, HttpThresholdsRepo);
