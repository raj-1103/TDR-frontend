const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface UserSession {
  fabricID: string
  email: string
  name: string
  role: 'USER' | 'ADMIN' | 'SUPERADMIN' | 'JUNIOR' | 'ASSISTANT' | 'TDO' | 'CITY' | 'COMMISSIONER'
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
  approvals?: number
  totalRequired?: number
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
  approvals?: number
  totalRequired?: number
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

export interface PendingAction {
  id: string
  type: 'ISSUE_TDR' | 'TRANSFER_TDR' | 'ACCEPT_BID'
  requester: string
  createdAt: string
  status: string
  details: {
    docID?: string
    tdrID?: string
    fromOwner?: string
    toOwner?: string
    price?: number
    amount?: number
  }
  approvals: number
  totalRequired: number
}

export interface MarketplaceListing {
  id:          string
  listingID:   string
  tdrID:       string
  docID:       string
  area:        number
  askingPrice: number
  seller:      string
  sellerID:    string
  description: string
  status:      'ACTIVE' | 'SOLD' | 'CANCELLED'
}

export interface Bid {
  id: string
  listingID: string
  bidder: string
  amount: number
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CONFIRMED'
}

export interface BidDetail {
  bidID: string
  listingID: string
  tdrID: string
  bidderID: string
  amount: number
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
  placedAt: string
  message: string
  actionID?: string
}

export const getBidsForListing = (listingID: string) =>
  req<{ bids: BidDetail[] }>(`/marketplace/bids?listingID=${encodeURIComponent(listingID)}`)

export const getMyListings = (fabricID: string) =>
  req<{ listings: any[] }>(`/marketplace/my-listings?fabricID=${encodeURIComponent(fabricID)}`)
    .then(res => ({
      listings: (res.listings || []).map((l: any) => ({
        id:          l.listingID || '',   // ← normalize
        listingID:   l.listingID || '',
        tdrID:       l.tdrID     || '',
        docID:       l.docID     || '',
        area:        l.area      ?? 0,
        askingPrice: l.askingPrice ?? 0,
        seller:      l.sellerID  || '',
        sellerID:    l.sellerID  || '',
        description: l.description || '',
        status:      l.status    || 'ACTIVE',
      }))
    }))

export const withdrawBid = (fabricID: string, bidID: string) =>
  req<{ bidID: string; txID: string; status: string }>('/marketplace/withdraw-bid', {
    method: 'POST', body: JSON.stringify({ fabricID, bidID })
  })

export const cancelListing = (fabricID: string, listingID: string) =>
  req<{ listingID: string; txID: string; status: string }>('/marketplace/cancel-listing', {
    method: 'POST', body: JSON.stringify({ fabricID, listingID })
  })

export const getMyBids = (fabricID: string) =>
  req<{ bids: BidDetail[] }>(`/marketplace/my-bids?fabricID=${encodeURIComponent(fabricID)}`)

export const getHighestBid = (fabricID: string, listingID: string) =>
  req<BidDetail>(`/marketplace/highest-bid?fabricID=${encodeURIComponent(fabricID)}&listingID=${encodeURIComponent(listingID)}`)

export const getListingDetail = (fabricID: string, listingID: string) =>
  req<any>(`/marketplace/listing?fabricID=${encodeURIComponent(fabricID)}&listingID=${encodeURIComponent(listingID)}`)

export const getBidDetail = (fabricID: string, bidID: string) =>
  req<BidDetail>(`/marketplace/bid-detail?fabricID=${encodeURIComponent(fabricID)}&bidID=${encodeURIComponent(bidID)}`)

export const confirmBid = (fabricID: string, actionID: string) =>
  req<{ actionID: string; txID: string; status: string }>('/marketplace/confirm-bid', {
    method: 'POST', body: JSON.stringify({ fabricID, actionID })
  })

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(API.includes('loca.lt') ? { 'Bypass-Tunnel-Reminder': 'true' } : {}), // Bypasses localtunnel's 511 interstitial page only if using tunnel
    ...((options?.headers as Record<string, string>) || {})
  }

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers,
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

export const register = (body: { email: string; name: string; password: string; org?: string }) =>
  req<{ message: string }>('/register', { method: 'POST', body: JSON.stringify(body) })

export const userLogin = (body: { email: string; password: string }) =>
  req<UserSession>('/user-login', { method: 'POST', body: JSON.stringify(body) })

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
  const res = await fetch(`${API}/upload`, { 
    method: 'POST', 
    body: form,
    headers: API.includes('loca.lt') ? { 'Bypass-Tunnel-Reminder': 'true' } : undefined
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{ docID: string; txID: string }>
}

export const verifyDocument = (docID: string) =>
  req<VerifyResult>(`/verify?docID=${docID}`)

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
    headers: { 
      'Content-Type': 'application/json',
      ...(API.includes('loca.lt') ? { 'Bypass-Tunnel-Reminder': 'true' } : {})
    },
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

// ── Marketplace ──────────────────────────────────────────

export const getMarketplaceListings = () =>
  req<{ listings: any[] }>('/marketplace/listings').then(res => ({
    listings: (res.listings || []).map((l: any) => ({
      id:          l.listingID || l.id || '',
      listingID:   l.listingID || l.id || '',
      tdrID:       l.tdrID    || l.tdrId  || '',
      docID:       l.docID    || l.docId  || '',
      area:        l.area     ?? 0,
      askingPrice: l.askingPrice ?? 0,
      seller:      l.sellerID   || l.seller || '',
      sellerID:    l.sellerID   || '',
      description: l.description || '',
      status:      l.status || 'ACTIVE',
    }))
  }))

export const placeBid = (fabricID: string, listingID: string, amount: number, message = '') =>
  req<{ bidID: string }>('/marketplace/bid', {
    method: 'POST', body: JSON.stringify({ fabricID, listingID, amount, message })
  })

export const listForSale = (fabricID: string, tdrID: string, askingPrice: number, description = '') =>
  req<{ listingID: string }>('/marketplace/list', {
    method: 'POST', body: JSON.stringify({ fabricID, tdrID, askingPrice, description })
  })

export const acceptBid = (fabricID: string, bidID: string) =>
  req<{ message: string }>('/marketplace/accept-bid', {
    method: 'POST', body: JSON.stringify({ fabricID, bidID })
  })

// ── Universal Approval Queue ──────────────────────────────

export const getPendingActions = (role?: string, fabricID?: string) => {
  const params = new URLSearchParams()
  if (role) params.append('role', role)
  if (fabricID) params.append('fabricID', fabricID)
  const qs = params.toString()
  return req<{ actions: PendingAction[] }>(`/pending-actions${qs ? `?${qs}` : ''}`)
}

export const getNotifications = (fabricID: string) =>
  req<{ notifications: any[] }>(`/notifications?fabricID=${fabricID}`)

export const approveAction = (adminFabricID: string, actionID: string, comment: string) =>
  req<{ message: string }>('/approve-action', {
    method: 'POST', body: JSON.stringify({ adminFabricID, actionID, comment })
  })

export const rejectAction = (adminFabricID: string, actionID: string, reason: string) =>
  req<{ message: string }>('/reject-action', {
    method: 'POST', body: JSON.stringify({ adminFabricID, actionID, reason })
  })

export const getAdminStats = () =>
  req<{
    totalDocuments: number
    pendingRequests: number
    tdrIssued: number
    transferred: number
    totalUsers: number
  }>('/admin-stats')

export const directAssignRole = (superAdminFabricID: string, targetEmail: string, newRole: string) =>
  req<{ message: string, txID: string }>('/direct-assign-role', {
    method: 'POST', body: JSON.stringify({ superAdminFabricID, targetEmail, newRole })
  })

export const retireIdentity = (superAdminFabricID: string, targetEmail: string) =>
  req<{ message: string, txID: string }>('/retire-identity', {
    method: 'POST', body: JSON.stringify({ superAdminFabricID, targetEmail })
  })

// ── TDR Ownership & History ───────────────────────────────

export interface TDRRecord {
  tdrID:        string
  owner:        string
  fabricID:     string
  area:         number
  status:       string
  acquiredAt:   string
  acquiredFrom: string
  listingID:    string
  askingPrice:  number
}

export interface TransferHistoryEntry {
  tdrID:       string
  action:      string
  fromOwner:   string
  toOwner:     string
  timestamp:   string
  txID:        string
  listingID:   string
  askingPrice: number
  soldAmount:  number
  buyerName:   string
  sellerName:  string
  direction:   'SENT' | 'RECEIVED'
}

export const getMyTDRs = (fabricID: string) =>
  req<{ tdrs: TDRRecord[] }>(`/my-tdrs?fabricID=${encodeURIComponent(fabricID)}`)

export const getMyTransferHistory = (fabricID: string) =>
  req<{ history: TransferHistoryEntry[] }>(`/my-transfer-history?fabricID=${encodeURIComponent(fabricID)}`)