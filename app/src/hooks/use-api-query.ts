import { useEffect, useRef, useState } from 'react'

type ApiQueryResult<T> = {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useApiQuery<T>(
  fetcher: (() => Promise<T>) | null,
  deps: unknown[] = [],
): ApiQueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(fetcher !== null)
  const [error, setError] = useState<string | null>(null)
  const versionRef = useRef(0)

  function execute() {
    if (!fetcher) return
    const version = ++versionRef.current
    setLoading(true)
    setError(null)

    fetcher()
      .then((result) => {
        if (version === versionRef.current) setData(result)
      })
      .catch((err) => {
        if (version === versionRef.current) setError(err instanceof Error ? err.message : 'Request failed')
      })
      .finally(() => {
        if (version === versionRef.current) setLoading(false)
      })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(execute, deps)

  return { data, loading, error, refetch: execute }
}
