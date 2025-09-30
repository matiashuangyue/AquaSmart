export function evaluate(value, th) {
  if (!th || th.min === undefined || th.max === undefined) return "ok";

  if (value < th.min || value > th.max) {
    return "danger";
  }
  return "ok";
}
