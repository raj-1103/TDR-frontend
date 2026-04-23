const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface UserSession {
  fabricID: string
  email: string
  name: string
  role: 'USER' | 'ADMIN' | 'SUPERADMIN'
}

export interface TransferRequest {
  requestID: string
  docID: string
  tdrID: string
  fromOwner: string
  toOwner: string
  status: string
  txID: string
  createdAt: string
  resolvedAt?: string
  reason?: string
}

export interface IssueRequest {
  requestID: string
  docID: string
  tdrID: string
  owner: string
  area: number
  status: string
  txID: string
  createdAt: string
  resolvedAt?: string
  reason?: string
}

export interface MyDocument {
  docID: string
  filename: string
  hash: string
  status: string
  tdrID: string
  pdfPath: string
  createdAt: string
}

export interface HistoryEntry {
  action: string
  actor: string
  fromOwner: string
  toOwner: string
  txID: string
  timestamp: string
}

export interface VerifyResult {
  valid: boolean
  status: string
  docID: string
  ethTxHash: string
  merkleRoot: string
  batchID: string
  reason: string
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Auth: OTP-based user flow ──────────────────────────────

export const sendOTP = (email: string) =>
  req<{ message: string }>('/send-otp', { method: 'POST', body: JSON.stringify({ email }) })

export const verifyOTP = (email: string, otp: string) =>
  req<{ message: string; fabricID: string; name: string; role: string }>('/verify-otp', {
    method: 'POST', body: JSON.stringify({ email, otp })
  })

export const register = (body: { email: string; name: string; org?: string }) =>
  req<{ message: string }>('/register', { method: 'POST', body: JSON.stringify(body) })

// ── Auth: Admin separate login (password-based) ────────────

export const adminLogin = (body: { email: string; password: string }) =>
  req<UserSession>('/admin-login', { method: 'POST', body: JSON.stringify(body) })

// ── User lookup ────────────────────────────────────────────

export const getUser = (email: string) =>
  req<UserSession>(`/get-user?email=${encodeURIComponent(email)}`)

export const lookupFabricID = async (email: string): Promise<{ fabricID: string; name: string }> => {
  const user = await req<UserSession>(`/get-user?email=${encodeURIComponent(email)}`)
  return { fabricID: user.fabricID, name: user.name }
}

export const listUsers = () =>
  req<{ users: Array<{ email: string; name: string; fabricID: string; role: string; createdAt: string }> }>('/list-users')

// ── Documents ─────────────────────────────────────────────

export const uploadDocument = async (fabricID: string, file: File) => {
  const form = new FormData()
  form.append('fabricID', fabricID)
  form.append('file', file)
  const res = await fetch(`${API}/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{ docID: string; txID: string }>
}

export const verifyDocument = (docID: string, hash: string) =>
  req<VerifyResult>(`/verify?docID=${docID}&hash=${hash}`)

export const getHistory = (docID: string) =>
  req<{ docID: string; history: HistoryEntry[] }>(`/history?docID=${docID}`)

export const getMutationGraph = (docID: string) =>
  req<{ docID: string; chain: string; nodes: any[]; edges: any[] }>(`/mutation-graph?docID=${docID}`)

export const getMyDocuments = (fabricID: string) =>
  req<{ documents: MyDocument[] }>(`/my-documents?fabricID=${encodeURIComponent(fabricID)}`)

export const getMyRequests = (fabricID: string) =>
  req<{ transferRequests: TransferRequest[]; issueRequests: IssueRequest[] }>(
    `/my-requests?fabricID=${encodeURIComponent(fabricID)}`
  )

// ── PDF Download ───────────────────────────────────────────

export const downloadTransferPDF = async (docID: string, tdrID: string): Promise<void> => {
  const res = await fetch(`${API}/download-pdf?docID=${encodeURIComponent(docID)}`)
  if (!res.ok) throw new Error((await res.text()) || 'PDF not found')
  const contentType = res.headers.get('Content-Type') || ''
  if (!contentType.includes('application/pdf')) throw new Error('Server did not return a PDF')
  const blob = await res.blob()
  if (blob.size === 0) throw new Error('PDF is empty')
  const objectURL = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectURL
  a.download = `TDR_${tdrID || docID}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => window.open(objectURL, '_blank'), 300)
  setTimeout(() => URL.revokeObjectURL(objectURL), 15000)
}

// ── TDR Issuance ──────────────────────────────────────────

export const requestIssueTDR = (body: { fabricID: string; docID: string; tdrID: string; area: number }) =>
  req<{ requestID: string; txID: string; status: string }>('/request-issue-tdr', {
    method: 'POST', body: JSON.stringify(body)
  })

export const getPendingIssueRequests = () =>
  req<{ requests: IssueRequest[] }>('/pending-issue-requests')

export const approveIssueTDR = (adminFabricID: string, requestID: string) =>
  req<{ requestID: string; tdrID: string; txID: string; status: string }>('/approve-issue-tdr', {
    method: 'POST', body: JSON.stringify({ adminFabricID, requestID })
  })

export const rejectIssueTDR = (adminFabricID: string, requestID: string, reason: string) =>
  req<{ requestID: string; txID: string; status: string; reason: string }>('/reject-issue-tdr', {
    method: 'POST', body: JSON.stringify({ adminFabricID, requestID, reason })
  })

// ── TDR Transfer ──────────────────────────────────────────

export const requestTransfer = (body: { fabricID: string; docID: string; newOwner: string }) =>
  req<{ requestID: string; txID: string; status: string }>('/request-transfer', {
    method: 'POST', body: JSON.stringify(body)
  })

export const getPendingRequests = () =>
  req<{ requests: TransferRequest[] }>('/pending-requests')

export const approveTransfer = async (adminFabricID: string, requestID: string) => {
  const res = await fetch(`${API}/approve-transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminFabricID, requestID }),
  })
  if (!res.ok) throw new Error(await res.text())
  const contentType = res.headers.get('Content-Type') || ''
  if (contentType.includes('application/pdf')) {
    const blob = await res.blob()
    const objectURL = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectURL
    a.download = 'TDR_approved.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => window.open(objectURL, '_blank'), 300)
    setTimeout(() => URL.revokeObjectURL(objectURL), 15000)
    return { status: 'APPROVED', pdf: true }
  }
  return res.json()
}

export const rejectTransfer = (adminFabricID: string, requestID: string, reason: string) =>
  req<{ requestID: string; txID: string; status: string }>('/reject-transfer', {
    method: 'POST', body: JSON.stringify({ adminFabricID, requestID, reason })
  })

// ── Admin ─────────────────────────────────────────────────

export const promoteToAdmin = (superAdminFabricID: string, targetFabricID: string) =>
  req<{ targetFabricID: string; newRole: string; txID: string }>('/promote-to-admin', {
    method: 'POST', body: JSON.stringify({ superAdminFabricID, targetFabricID })
  })

export const getTDR = (fabricID: string, tdrID: string) =>
  req<{ tdrId: string; owner: string; fabricId: string; area: number }>(
    `/get-tdr?fabricID=${fabricID}&tdrID=${tdrID}`
  )

export const createAdminBySuperAdmin = (superAdminFabricID: string, email: string, name: string) =>
  req<{ fabricID: string; email: string; message: string }>('/create-admin-by-superadmin', {
    method: 'POST', body: JSON.stringify({ superAdminFabricID, email, name })
  })

export const changePassword = (fabricID: string, currentPassword: string, newPassword: string) =>
  req<{ message: string }>('/change-password', {
    method: 'POST', body: JSON.stringify({ fabricID, currentPassword, newPassword })
  })