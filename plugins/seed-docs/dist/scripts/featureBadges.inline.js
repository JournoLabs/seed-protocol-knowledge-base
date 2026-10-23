/**
 * One feature-badge popover at a time: entering a badge clears others before the delayed open.
 * Delay matches seed-docs.scss (1s), except prefers-reduced-motion → immediate.
 */
document.addEventListener("nav", () => {
  const delayMs = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1000

  const shells = [...document.querySelectorAll(".seed-feature-badge-shell")].filter((s) =>
    s.querySelector(".seed-feature-badge__popover"),
  )

  let pendingTimer = null
  let pendingShell = null

  function cancelPending() {
    if (pendingTimer !== null) {
      clearTimeout(pendingTimer)
      pendingTimer = null
    }
    pendingShell = null
  }

  function closeAllOpen() {
    for (const s of shells) {
      s.classList.remove("seed-feature-badge-shell--popover-open")
    }
  }

  function arm(shell) {
    cancelPending()
    closeAllOpen()
    pendingShell = shell
    pendingTimer = setTimeout(() => {
      pendingTimer = null
      pendingShell = null
      shell.classList.add("seed-feature-badge-shell--popover-open")
    }, delayMs)
  }

  function deactivate(shell) {
    if (pendingShell === shell) cancelPending()
    shell.classList.remove("seed-feature-badge-shell--popover-open")
  }

  const cleanups = []

  for (const shell of shells) {
    const pointerEnter = () => arm(shell)
    const pointerLeave = (e) => {
      const next = e.relatedTarget
      if (next instanceof Node && shell.contains(next)) return
      deactivate(shell)
    }
    const focusIn = () => arm(shell)
    const focusOut = (e) => {
      const next = e.relatedTarget
      if (next instanceof Node && shell.contains(next)) return
      deactivate(shell)
    }

    shell.addEventListener("pointerenter", pointerEnter, { passive: true })
    shell.addEventListener("pointerleave", pointerLeave, { passive: true })
    shell.addEventListener("focusin", focusIn)
    shell.addEventListener("focusout", focusOut)

    cleanups.push(() => shell.removeEventListener("pointerenter", pointerEnter))
    cleanups.push(() => shell.removeEventListener("pointerleave", pointerLeave))
    cleanups.push(() => shell.removeEventListener("focusin", focusIn))
    cleanups.push(() => shell.removeEventListener("focusout", focusOut))
  }

  window.addCleanup(() => {
    cancelPending()
    closeAllOpen()
    for (const fn of cleanups) fn()
  })
})
