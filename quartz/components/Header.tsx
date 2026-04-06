import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Header: QuartzComponent = ({ children }: QuartzComponentProps) => {
  return children.length > 0 ? <header class="page-header">{children}</header> : null
}

Header.css = `
header.page-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0 0 1.5rem;
  gap: 1.5rem;
}

header.page-header h1 {
  margin: 0;
  flex: auto;
}
`

export default (() => Header) satisfies QuartzComponentConstructor
