// Default dark for parity with seedprotocol.io when no stored preference. The Darkmode plugin
// falls back to prefers-color-scheme, so seed the stored theme before it reads it.
if (localStorage.getItem("theme") === null) {
  localStorage.setItem("theme", "dark")
  document.documentElement.setAttribute("saved-theme", "dark")
}
