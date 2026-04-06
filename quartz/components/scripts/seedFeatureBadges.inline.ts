/**
 * One feature-badge popover at a time: entering a badge clears others before the delayed open.
 * Delay matches seed-docs.scss (1s), except prefers-reduced-motion → immediate.
 */
document.addEventListener("nav", () => {
  const delayMs = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1000

  const shells = [...document.querySelectorAll(".seed-feature-badge-shell")].filter((s) =>
    s.querySelector(".seed-feature-badge__popover"),
  ) as HTMLElement[]

  let pendingTimer: ReturnType<typeof setTimeout> | null = null
  let pendingShell: HTMLElement | null = null

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

  function arm(shell: HTMLElement) {
    cancelPending()
    closeAllOpen()
    pendingShell = shell
    pendingTimer = setTimeout(() => {
      pendingTimer = null
      pendingShell = null
      shell.classList.add("seed-feature-badge-shell--popover-open")
    }, delayMs)
  }

  function deactivate(shell: HTMLElement) {
    if (pendingShell === shell) cancelPending()
    shell.classList.remove("seed-feature-badge-shell--popover-open")
  }

  const cleanups: (() => void)[] = []

  for (const shell of shells) {
    const pointerEnter = () => arm(shell)
    const pointerLeave = (e: PointerEvent) => {
      const next = e.relatedTarget
      if (next instanceof Node && shell.contains(next)) return
      deactivate(shell)
    }
    const focusIn = () => arm(shell)
    const focusOut = (e: FocusEvent) => {
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
