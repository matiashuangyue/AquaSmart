export function go(view) {
  window.dispatchEvent(new CustomEvent("nav:go", { detail: view }));
}
