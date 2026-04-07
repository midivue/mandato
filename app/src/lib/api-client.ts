import type {
  CreatePredictionRequest,
  Prediction,
  PredictionUpdate,
  SharedPrediction,
  LeaderboardEntry,
  StatsResponse,
  GroupDetail,
  BestGroupEntry,
} from '@mandatoto/shared/types'

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1'

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const text = await res.text()
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    throw new ApiError(res.status, `Server error (${res.status})`)
  }

  if (!res.ok) {
    const msg = (body as Record<string, unknown>)?.error
    throw new ApiError(res.status, typeof msg === 'string' ? msg : 'Request failed')
  }

  return body as T
}

export async function createPrediction(
  data?: CreatePredictionRequest,
  turnstileToken?: string,
): Promise<Prediction> {
  return request<Prediction>('/predictions', {
    method: 'POST',
    body: JSON.stringify(data ?? {}),
    headers: turnstileToken ? { 'X-Turnstile-Token': turnstileToken } : undefined,
  })
}

export async function getPrediction(token: string): Promise<Prediction | null> {
  try {
    return await request<Prediction>(`/predictions/${token}`)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export async function updatePrediction(
  token: string,
  data: PredictionUpdate,
): Promise<Prediction> {
  return request<Prediction>(`/predictions/${token}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function finalizePrediction(token: string, turnstileToken?: string): Promise<Prediction> {
  return request<Prediction>(`/predictions/${token}/finalize`, {
    method: 'POST',
    headers: turnstileToken ? { 'X-Turnstile-Token': turnstileToken } : undefined,
  })
}

export async function deletePrediction(token: string): Promise<void> {
  await request<{ deleted: boolean }>(`/predictions/${token}`, {
    method: 'DELETE',
  })
}

export async function getMyGroups(
  token: string,
): Promise<{ groupToken: string; name: string }[]> {
  try {
    return await request<{ groupToken: string; name: string }[]>('/groups/my-groups', {
      headers: { 'X-User-Token': token },
    })
  } catch {
    return []
  }
}

export async function getSharedPrediction(shareToken: string): Promise<SharedPrediction> {
  return request<SharedPrediction>(`/share/${shareToken}`)
}

export async function getLeaderboard(query?: string): Promise<LeaderboardEntry[]> {
  const qs = query ? `?q=${encodeURIComponent(query)}` : ''
  return request<LeaderboardEntry[]>(`/leaderboard${qs}`)
}

export async function getStats(): Promise<StatsResponse> {
  return request<StatsResponse>('/stats')
}

export async function getGroupDetail(groupToken: string): Promise<GroupDetail> {
  return request<GroupDetail>(`/groups/${groupToken}`)
}

export async function getBestGroups(): Promise<BestGroupEntry[]> {
  return request<BestGroupEntry[]>('/groups/best')
}

export async function createGroup(
  userToken: string,
  name?: string,
  turnstileToken?: string,
): Promise<{ groupToken: string; name: string }> {
  return request<{ groupToken: string; name: string }>('/groups', {
    method: 'POST',
    headers: {
      'X-User-Token': userToken,
      ...(turnstileToken ? { 'X-Turnstile-Token': turnstileToken } : {}),
    },
    body: JSON.stringify(name ? { name } : {}),
  })
}

export async function updateGroup(
  groupToken: string,
  userToken: string,
  data: { name?: string; visibility?: string },
): Promise<GroupDetail> {
  return request<GroupDetail>(`/groups/${groupToken}`, {
    method: 'PUT',
    headers: { 'X-User-Token': userToken },
    body: JSON.stringify(data),
  })
}

export async function joinGroup(
  groupToken: string,
  userToken: string,
  turnstileToken?: string,
): Promise<void> {
  await request<unknown>(`/groups/${groupToken}/join`, {
    method: 'POST',
    headers: {
      'X-User-Token': userToken,
      ...(turnstileToken ? { 'X-Turnstile-Token': turnstileToken } : {}),
    },
  })
}

export async function addGroupMember(
  groupToken: string,
  userToken: string,
  shareToken: string,
): Promise<GroupDetail> {
  return request<GroupDetail>(`/groups/${groupToken}/members`, {
    method: 'POST',
    headers: { 'X-User-Token': userToken },
    body: JSON.stringify({ shareToken }),
  })
}

export async function removeGroupMember(
  groupToken: string,
  userToken: string,
  memberShareToken: string,
): Promise<GroupDetail | { deleted: boolean }> {
  return request<GroupDetail | { deleted: boolean }>(`/groups/${groupToken}/members/${memberShareToken}`, {
    method: 'DELETE',
    headers: { 'X-User-Token': userToken },
  })
}

export { ApiError }
