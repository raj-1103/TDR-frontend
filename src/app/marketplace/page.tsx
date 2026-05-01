'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  getMarketplaceListings,
  getMyListings,
  getBidsForListing,
  placeBid,
  acceptBid,
  withdrawBid,
  cancelListing,
  getMyBids,
  confirmBid,
  MarketplaceListing,
  BidDetail,
} from '@/lib/api'
import {
  ShoppingBag, Search, Tag, User, Map, Gavel,
  RefreshCw, ChevronDown, ChevronUp, CheckCircle, Clock,
} from 'lucide-react'
import { toast } from 'sonner'

export default function MarketplacePage() {
  const { user } = useAuth()

  // ── Browse (buyer) state ──────────────────────────────────
  const [listings, setListings]     = useState<MarketplaceListing[]>([])
  const [loadingAll, setLoadingAll] = useState(true)
  const [search, setSearch]         = useState('')
  const [bidModal, setBidModal]     = useState<MarketplaceListing | null>(null)
  const [bidAmount, setBidAmount]   = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── My Listings (seller) state ────────────────────────────
  const [myListings, setMyListings]         = useState<MarketplaceListing[]>([])
  const [loadingMine, setLoadingMine]       = useState(true)
  const [expandedListing, setExpanded]      = useState<string | null>(null)
  const [bidsMap, setBidsMap]               = useState<Record<string, BidDetail[]>>({})
  const [loadingBids, setLoadingBids]       = useState<string | null>(null)
  const [acceptingBid, setAcceptingBid]     = useState<string | null>(null)

  // ── My Bids (buyer) state ─────────────────────────────────
  const [myBids, setMyBids]               = useState<BidDetail[]>([])
  const [loadingMyBids, setLoadingMyBids] = useState(true)
  const [confirmingBid, setConfirmingBid] = useState<string | null>(null)

  useEffect(() => { if (user) { loadAll(); loadMine(); loadMyBids() } }, [user])

  const loadAll = async () => {
    setLoadingAll(true)
    try {
      const res = await getMarketplaceListings()
      setListings(res.listings || [])
    } catch (e: any) { toast.error(e.message) }
    setLoadingAll(false)
  }

  const loadMine = async () => {
    if (!user) return
    setLoadingMine(true)
    try {
      const res = await getMyListings(user.fabricID)
      setMyListings(res.listings || [])
    } catch (e: any) { toast.error(e.message) }
    setLoadingMine(false)
  }

  const toggleBids = async (listingID: string) => {
    if (expandedListing === listingID) { setExpanded(null); return }
    setExpanded(listingID)
    if (bidsMap[listingID]) return // already loaded

    setLoadingBids(listingID)
    try {
      const res = await getBidsForListing(listingID)
      setBidsMap(prev => ({ ...prev, [listingID]: res.bids || [] }))
    } catch (e: any) { toast.error(e.message) }
    setLoadingBids(null)
  }

  const handleAcceptBid = async (bidID: string, listingID: string) => {
    if (!user) return
    setAcceptingBid(bidID)
    try {
      await acceptBid(user.fabricID, bidID)
      toast.success('Bid accepted! Awaiting buyer confirmation.')
      // Refresh bids for this listing
      const res = await getBidsForListing(listingID)
      setBidsMap(prev => ({ ...prev, [listingID]: res.bids || [] }))
      loadMine()
    } catch (e: any) { toast.error(e.message) }
    setAcceptingBid(null)
  }

  const handlePlaceBid = async () => {
    if (!bidModal || !user) return
    setSubmitting(true)
    try {
      await placeBid(user.fabricID, bidModal.listingID || bidModal.id, parseFloat(bidAmount))
      toast.success('Bid placed successfully! Awaiting seller acceptance.')
      setBidModal(null)
      setBidAmount('')
      loadMyBids()
    } catch (e: any) { toast.error(e.message) }
    setSubmitting(false)
  }

  const loadMyBids = async () => {
    if (!user) return
    setLoadingMyBids(true)
    try {
      const res = await getMyBids(user.fabricID)
      setMyBids(res.bids || [])
    } catch (e: any) { toast.error(e.message) }
    setLoadingMyBids(false)
  }

  const handleConfirmBid = async (bid: BidDetail) => {
    if (!user || !bid.actionID) return
    setConfirmingBid(bid.bidID)
    try {
      await confirmBid(user.fabricID, bid.actionID)
      toast.success('Sale confirmed! Entering approval queue.')
      loadMyBids()
    } catch (e: any) { toast.error(e.message) }
    setConfirmingBid(null)
  }

  const handleWithdrawBid = async (bidID: string) => {
    if (!user) return
    if (!window.confirm('Withdraw this bid?')) return
    try {
      await withdrawBid(user.fabricID, bidID)
      toast.success('Bid withdrawn.')
      loadMyBids()
    } catch (e: any) { toast.error(e.message) }
  }

  const handleCancelListing = async (listingID: string) => {
    if (!user) return
    if (!window.confirm('Cancel this listing? All pending bids will be rejected.')) return
    try {
      await cancelListing(user.fabricID, listingID)
      toast.success('Listing cancelled.')
      loadMine()
      loadAll()
    } catch (e: any) { toast.error(e.message) }
  }

  const filtered = listings.filter(l =>
    l.tdrID.toLowerCase().includes(search.toLowerCase()) ||
    l.seller.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (s: string) => {
    if (s === 'PENDING')   return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
    if (s === 'ACCEPTED')  return { bg: 'rgba(16,185,129,0.1)', color: '#10b981' }
    if (s === 'REJECTED' || s === 'WITHDRAWN') return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' }
    return { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <main>

        {/* ── Header ─────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>TDR Marketplace</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Browse and bid on verified Transferable Development Rights.</p>
          </div>
          <button className="btn-ghost" onClick={() => { loadAll(); loadMine() }} disabled={loadingAll}>
            <RefreshCw size={14} style={{ animation: loadingAll ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* ── MY LISTINGS (seller view) ───────────────────── */}
        {myListings.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <Tag size={14} color="#10b981" />
              My Active Listings ({myListings.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myListings.map(listing => {
                const isExpanded = expandedListing === listing.listingID
                const bids = bidsMap[listing.listingID] || []
                const pendingBids = bids.filter(b => b.status === 'PENDING')

                return (
                  <div key={listing.listingID} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Listing header row */}
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 20px', cursor: 'pointer',
                        background: isExpanded ? 'rgba(16,185,129,0.04)' : 'transparent',
                        borderBottom: isExpanded ? '1px solid rgba(0,0,0,0.06)' : 'none',
                      }}
                      onClick={() => toggleBids(listing.listingID)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>TDR ID</div>
                          <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14 }}>{listing.tdrID}</code>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Area</div>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{listing.area.toLocaleString()} sq m</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Asking Price</div>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>₹ {listing.askingPrice.toLocaleString()}</span>
                        </div>
                        <div style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                          background: listing.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
                          color: listing.status === 'ACTIVE' ? '#10b981' : '#94a3b8',
                        }}>
                          {listing.status}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {pendingBids.length > 0 && (
                          <div style={{
                            fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 12,
                            background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                            display: 'flex', alignItems: 'center', gap: 5
                          }}>
                            <Gavel size={11} />
                            {pendingBids.length} bid{pendingBids.length !== 1 ? 's' : ''} waiting
                          </div>
                        )}
                        {isExpanded ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                      </div>
                    </div>

                    {/* Bids panel */}
                    {isExpanded && (
                      <div style={{ padding: '16px 20px' }}>
                        {loadingBids === listing.listingID ? (
                          <div style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                            Loading bids...
                          </div>
                        ) : bids.length === 0 ? (
                          <div style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                            No bids yet on this listing.
                          </div>
                        ) : (
                          <table className="tdr-table" style={{ minWidth: 500 }}>
                            <thead>
                              <tr>
                                <th>Bid ID</th>
                                <th>Bidder</th>
                                <th>Amount</th>
                                <th>Message</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bids.map(bid => {
                                const sc = statusColor(bid.status)
                                return (
                                  <tr key={bid.bidID}>
                                    <td>
                                      <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--navy-400)' }}>
                                        {bid.bidID.slice(0, 12)}...
                                      </code>
                                    </td>
                                    <td style={{ fontSize: 12 }}>
                                      <code style={{ fontFamily: 'var(--font-mono)' }}>{bid.bidderID.slice(0, 16)}...</code>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>₹ {bid.amount.toLocaleString()}</td>
                                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                      {bid.message || '—'}
                                    </td>
                                    <td>
                                      <span style={{
                                        fontSize: 11, fontWeight: 700,
                                        padding: '3px 8px', borderRadius: 8,
                                        background: sc.bg, color: sc.color
                                      }}>
                                        {bid.status}
                                      </span>
                                    </td>
                                    <td>
                                      {bid.status === 'PENDING' ? (
                                        <button
                                          className="btn-success"
                                          style={{ padding: '5px 12px', fontSize: 12 }}
                                          onClick={() => handleAcceptBid(bid.bidID, listing.listingID)}
                                          disabled={acceptingBid === bid.bidID}
                                        >
                                          <CheckCircle size={12} />
                                          {acceptingBid === bid.bidID ? '…' : 'Accept'}
                                        </button>
                                      ) : (
                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <Clock size={12} /> {bid.status}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── MY BIDS (buyer view) ───────────────────────── */}
        {myBids.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <Gavel size={14} color="#f59e0b" />
              My Bids ({myBids.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myBids.map(bid => {
                const needsConfirm = bid.status === 'AWAITING_BUYER_CONFIRMATION'
                const sc = statusColor(bid.status)

                return (
                  <div key={bid.bidID} className="glass-card" style={{
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                    // Highlight rows that need action
                    border: needsConfirm ? '1.5px solid #f59e0b' : undefined,
                    background: needsConfirm ? 'rgba(245,158,11,0.04)' : undefined,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Listing</div>
                        <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>
                          {bid.listingID}
                        </code>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Your Bid</div>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>₹ {bid.amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Placed</div>
                        <span style={{ fontSize: 12 }}>{bid.placedAt}</span>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                        background: sc.bg, color: sc.color,
                      }}>
                        {needsConfirm ? 'SELLER ACCEPTED — ACTION NEEDED' : bid.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {needsConfirm ? (
                        // ── This is the key button the buyer needs ──
                        <button
                          className="btn-primary"
                          style={{ padding: '8px 20px', fontSize: 13, background: '#f59e0b', borderColor: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}
                          onClick={() => handleConfirmBid(bid)}
                          disabled={confirmingBid === bid.bidID}
                        >
                          <CheckCircle size={14} />
                          {confirmingBid === bid.bidID ? 'Confirming...' : 'Confirm Sale'}
                        </button>
                      ) : bid.status === 'PENDING' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> Awaiting seller
                          </span>
                          <button
                            className="btn-danger"
                            style={{ fontSize: 12, padding: '5px 12px' }}
                            onClick={() => handleWithdrawBid(bid.bidID)}
                          >
                            Withdraw
                          </button>
                        </div>
                      ) : bid.status === 'ACCEPTED' ? (
                        <span style={{ fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={12} /> Sale complete
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── BROWSE ALL LISTINGS (buyer view) ───────────── */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
            marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8
          }}>
            <ShoppingBag size={14} color="#3b82f6" />
            All Active Listings
          </h2>
          <div className="glass-card" style={{ padding: '14px 20px', marginBottom: 20 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                className="tdr-input"
                placeholder="Search by TDR ID or Seller..."
                style={{ paddingLeft: 38, width: '100%' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loadingAll ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            Loading marketplace listings...
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: 16, margin: '0 auto 16px' }} />
            <p>No active listings found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map(listing => {
              const isMine = listing.sellerID === user?.fabricID || listing.seller === user?.fabricID
              return (
                <div key={listing.listingID} className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ background: 'var(--navy-hero)', padding: '20px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, letterSpacing: '0.05em' }}>TDR Asset</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isMine && (
                          <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                            YOUR LISTING
                          </span>
                        )}
                        <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 10 }}>{listing.status}</span>
                      </div>
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{listing.tdrID}</h3>
                  </div>
                  <div style={{ padding: '20px', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Map size={16} color="var(--text-secondary)" />
                        <span style={{ fontSize: 14 }}><strong>{listing.area.toLocaleString()}</strong> sq m Area</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Tag size={16} color="var(--text-secondary)" />
                        <span style={{ fontSize: 14 }}>Asking <strong>₹ {listing.askingPrice.toLocaleString()}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <User size={16} color="var(--text-secondary)" />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          Seller: <code style={{ fontFamily: 'var(--font-mono)' }}>{(listing.seller || '').slice(0, 16)}...</code>
                        </span>
                      </div>
                    </div>

                    {isMine ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button
                          className="btn-ghost"
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={() => toggleBids(listing.listingID)}
                        >
                          <Gavel size={16} /> View Bids
                        </button>
                        {listing.status === 'ACTIVE' && (
                          <button
                            className="btn-danger"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => handleCancelListing(listing.listingID)}
                          >
                            Cancel Listing
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => setBidModal(listing)}
                      >
                        <Gavel size={16} /> Place Bid
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Bid Modal ───────────────────────────────────── */}
        {bidModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Place Bid</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                You are bidding on TDR ID: <strong>{bidModal.tdrID}</strong><br />
                Asking Price: ₹ {bidModal.askingPrice.toLocaleString()}
              </p>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Your Bid Amount (₹)
                </label>
                <input
                  type="number"
                  className="tdr-input"
                  style={{ width: '100%' }}
                  placeholder="Enter amount..."
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button className="btn-ghost" onClick={() => setBidModal(null)}>Cancel</button>
                <button
                  className="btn-primary"
                  onClick={handlePlaceBid}
                  disabled={submitting || !bidAmount}
                >
                  {submitting ? 'Placing Bid...' : 'Submit Bid'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}