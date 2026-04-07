import { Trans, type TransProps } from 'react-i18next'

const richComponents = {
  b: <strong />,
  i: <em />,
  u: <u />,
  br: <br />,
}

export function T(props: Omit<TransProps<string>, 'components'>) {
  return <Trans components={richComponents} {...props} />
}
