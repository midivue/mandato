import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="text-center">
        <p className="text-sm font-medium text-red-600">{t('error.title')}</p>
        <p className="mt-1 text-xs text-zinc-500">{t('error.description')}</p>
        <button
          type="button"
          onClick={onReset}
          className="mt-3 text-xs font-medium text-zinc-500 underline transition hover:text-zinc-900"
        >
          {t('error.retry')}
        </button>
      </div>
    </div>
  )
}

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />
    }
    return this.props.children
  }
}
