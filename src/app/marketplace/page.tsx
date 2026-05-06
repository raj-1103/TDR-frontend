'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { 
  getMarketplaceListings, 
  placeBid, 
  getMyBids, 
  withdrawBid, 
  confirmBid, 
  rejectBid,
  getBidsForListing,
  acceptBid,
  cancelListing,
  MarketplaceListing,
  BidDetail
} from '@/lib/api'
import { 
  Gavel, 
  Search, 
  ShoppingBag, 
  Tag, 
  User, 
  Map, 
  Shield, 
  XCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardBody, CardHeader } from '@/components/Card'

export default function MarketplacePage() {
  const { user } = useAuth()
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([])
  const [myBids, setMyBids] = useState<BidDetail[]>([])
  const [search, setSearch] = useState('')
  const [loadingAll, setLoadingAll] = useState(true)
  const [bidModal, setBidModal] = useState<MarketplaceListing | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Seller view states
  const [expandedListing, setExpandedListing] = useState<string | null>(null)
  const [bidsMap, setBidsMap] = useState<Record<string, BidDetail[]>>({})
  const [loadingBids, setLoadingBids] = useState<string | null>(null)
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null)
  const [rejectingIncomingBid, setRejectingIncomingBid] = useState<string | null>(null)

  // Buyer confirmation states
  const [confirmingBid, setConfirmingBid] = useState<string | null>(null)
  const [rejectingBid, setRejectingBid] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoadingAll(true)
    try {
      const res = await getMarketplaceListings()
      setListings(res.listings || [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load marketplace')
    } finally {
      setLoadingAll(false)
    }
  }, [])

  const loadMine = useCallback(async () => {
    if (!user) return
    try {
      const res = await getMarketplaceListings()
      const mine = (res.listings || []).filter((l: any) => l.sellerID === user.fabricID || l.seller === user.fabricID)
      setMyListings(mine)
      
      const bidsRes = await getMyBids(user.fabricID)
      setMyBids(bidsRes.bids || [])
    } catch (err: any) {
      console.error('Failed to load my data', err)
    }
  }, [user])

  useEffect(() => {
    loadAll()
    if (user) loadMine()
  }, [user, loadAll, loadMine])

  const toggleBids = async (listingID: string) => {
    if (expandedListing === listingID) {
      setExpandedListing(null)
      return
    }
    setExpandedListing(listingID)
    setLoadingBids(listingID)
    try {
      const res = await getBidsForListing(listingID)
      setBidsMap(prev => ({ ...prev, [listingID]: res.bids || [] }))
    } catch (err: any) {
      toast.error('Failed to load bids for this listing')
    } finally {
      setLoadingBids(null)
    }
  }

  const handlePlaceBid = async () => {
    if (!bidModal || !user || !bidAmount) return
    setSubmitting(true)
    try {
      await placeBid(
        user.fabricID,
        bidModal.listingID,
        Number(bidAmount),
        `Bid from ${user.name}`
      )
      toast.success('Bid placed successfully!')
      setBidModal(null)
      setBidAmount('')
      loadAll()
      loadMine()
    } catch (err: any) {
      toast.error(err.message || 'Failed to place bid')
    } finally {
      setSubmitting(false)
    }
  }

  const handleWithdrawBid = async (bidID: string) => {
    if (!confirm('Are you sure you want to withdraw this bid?')) return
    try {
      await withdrawBid(user!.fabricID, bidID)
      toast.success('Bid withdrawn')
      loadMine()
    } catch (err: any) {
      toast.error(err.message || 'Withdrawal failed')
    }
  }

  const handleAcceptBid = async (bidID: string, listingID: string) => {
    setAcceptingBid(bidID)
    try {
      await acceptBid(user!.fabricID, bidID)
      toast.success('Bid accepted! Awaiting buyer confirmation.')
      const res = await getBidsForListing(listingID)
      setBidsMap(prev => ({ ...prev, [listingID]: res.bids || [] }))
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept bid')
    } finally {
      setAcceptingBid(null)
    }
  }

  const handleRejectIncomingBid = async (bidID: string, listingID: string) => {
    setRejectingIncomingBid(bidID)
    try {
      await rejectBid(user!.fabricID, bidID)
      toast.success('Bid rejected')
      const res = await getBidsForListing(listingID)
      setBidsMap(prev => ({ ...prev, [listingID]: res.bids || [] }))
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject bid')
    } finally {
      setRejectingIncomingBid(null)
    }
  }

  const handleConfirmBid = async (bid: BidDetail) => {
    setConfirmingBid(bid.bidID)
    try {
      // In confirmBid, the second arg is actionID if it's a multisig action, 
      // but here it seems we use bidID or the actionID from the bid if present.
      await confirmBid(user!.fabricID, bid.actionID || bid.bidID)
      toast.success('Sale confirmed! TDR ownership transfer requested.')
      loadAll()
      loadMine()
    } catch (err: any) {
      toast.error(err.message || 'Confirmation failed')
    } finally {
      setConfirmingBid(null)
    }
  }

  const handleRejectBidFromBuyer = async (bid: BidDetail) => {
    setRejectingBid(bid.bidID)
    try {
      await rejectBid(user!.fabricID, bid.bidID)
      toast.success('Sale rejected.')
      loadMine()
    } catch (err: any) {
      toast.error(err.message || 'Rejection failed')
    } finally {
      setRejectingBid(null)
    }
  }

  const handleCancelListing = async (listingID: string) => {
    if (!confirm('Cancel this listing? This will withdraw all pending bids.')) return
    try {
      await cancelListing(user!.fabricID, listingID)
      toast.success('Listing cancelled')
      loadAll()
      loadMine()
    } catch (err: any) {
      toast.error(err.message || 'Cancellation failed')
    }
  }

  const filtered = listings.filter(l => 
    l.tdrID.toLowerCase().includes(search.toLowerCase()) ||
    l.area.toString().includes(search)
  )

  const statusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return { bg: '#fff7ed', color: '#f59e0b' }
      case 'ACCEPTED': return { bg: '#ecfdf5', color: '#10b981' }
      case 'REJECTED': return { bg: '#fef2f2', color: '#ef4444' }
      case 'WITHDRAWN': return { bg: '#f1f5f9', color: '#64748b' }
      case 'AWAITING_BUYER_CONFIRMATION': return { bg: '#eff6ff', color: '#3b82f6' }
      default: return { bg: '#f8fafc', color: '#64748b' }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <main>
        {/* ── Header ─────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 6, letterSpacing: '-0.02em', color: '#0f172a' }}>TDR Marketplace</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500 }}>Browse and bid on verified Transferable Development Rights with blockchain transparency.</p>
          </div>
          <button className="btn-ghost" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 18px' }} onClick={() => { loadAll(); loadMine() }} disabled={loadingAll}>
            <RefreshCw size={15} style={{ animation: loadingAll ? 'spin 1s linear infinite' : 'none' }} className="mr-2" />
            Refresh Markets
          </button>
        </div>

        {/* ── MY LISTINGS (seller view) ───────────────────── */}
        {myListings.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <div style={{
              fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10
            }}>
              <Tag size={14} className="text-blue-600" />
              My Active Listings ({myListings.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {myListings.map(listing => {
                const isExpanded = expandedListing === listing.listingID
                const bids = bidsMap[listing.listingID] || []
                const pendingBids = bids.filter(b => b.status === 'PENDING')

                return (
                  <Card key={listing.listingID} className={`border-slate-200 transition-all ${isExpanded ? 'ring-2 ring-blue-500/10' : ''}`}>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '20px 24px', cursor: 'pointer',
                        background: isExpanded ? 'rgba(59,130,246,0.02)' : 'transparent',
                      }}
                      onClick={() => toggleBids(listing.listingID)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Listing ID</div>
                          <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{listing.tdrID}</code>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Area Size</div>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{listing.area.toLocaleString()} sq m</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Asking Price</div>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#2563eb' }}>₹ {listing.askingPrice.toLocaleString()}</span>
                        </div>
                        <div style={{
                          fontSize: 10, fontWeight: 900, padding: '4px 12px', borderRadius: 20,
                          background: listing.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
                          color: listing.status === 'ACTIVE' ? '#10b981' : '#94a3b8',
                          border: listing.status === 'ACTIVE' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(148,163,184,0.2)',
                          textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                          {listing.status}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {pendingBids.length > 0 && (
                          <div style={{
                            fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 20,
                            background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                            display: 'flex', alignItems: 'center', gap: 6,
                            border: '1px solid rgba(245,158,11,0.2)'
                          }}>
                            <Gavel size={12} />
                            {pendingBids.length} Pending Bid{pendingBids.length !== 1 ? 's' : ''}
                          </div>
                        )}
                        <div className={`p-2 rounded-lg ${isExpanded ? 'bg-slate-100' : 'hover:bg-slate-50'} transition-colors`}>
                          {isExpanded ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
                        </div>
                      </div>
                    </div>

                    {/* Bids panel */}
                    {isExpanded && (
                      <CardBody className="pt-0 border-t border-slate-50">
                        <div style={{ marginTop: 20 }}>
                          {loadingBids === listing.listingID ? (
                            <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: '40px 0', fontWeight: 600 }}>
                              <RefreshCw size={24} className="animate-spin mx-auto mb-4 text-blue-500 opacity-20" />
                              Verifying Bids on Ledger...
                            </div>
                          ) : bids.length === 0 ? (
                            <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: '40px 0', fontWeight: 600 }}>
                              No bids received yet for this listing.
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-100">
                              <table className="tdr-table" style={{ minWidth: 600, border: 'none' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                  <tr>
                                    <th style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Bid Details</th>
                                    <th style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Bidder</th>
                                    <th style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Amount</th>
                                    <th style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Message</th>
                                    <th style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Status</th>
                                    <th style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', textAlign: 'right' }}>Actions</th>
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
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                          <button
                                            className="btn-success"
                                            style={{ padding: '5px 12px', fontSize: 12 }}
                                            onClick={() => handleAcceptBid(bid.bidID, listing.listingID)}
                                            disabled={acceptingBid === bid.bidID || rejectingIncomingBid === bid.bidID}
                                          >
                                            Accept
                                          </button>
                                          <button
                                            className="btn-danger"
                                            style={{ padding: '5px 12px', fontSize: 12 }}
                                            onClick={() => handleRejectIncomingBid(bid.bidID, listing.listingID)}
                                            disabled={acceptingBid === bid.bidID || rejectingIncomingBid === bid.bidID}
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      ) : (
                                        <div style={{ textAlign: 'right' }}>
                                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>—</span>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )
                               })}
                             </tbody>
                           </table>
                         </div>
                       )}
                     </div>
                   </CardBody>
                 )}
               </Card>
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
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                        background: sc.bg, color: sc.color,
                      }}>
                        {needsConfirm ? 'SELLER ACCEPTED — ACTION NEEDED' : bid.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {needsConfirm ? (
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            className="btn-primary"
                            style={{ padding: '8px 20px', fontSize: 13, background: '#f59e0b', borderColor: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}
                            onClick={() => handleConfirmBid(bid)}
                            disabled={confirmingBid === bid.bidID || rejectingBid === bid.bidID}
                          >
                            <CheckCircle size={14} />
                            {confirmingBid === bid.bidID ? 'Confirming...' : 'Confirm Sale'}
                          </button>
                          <button
                            className="btn-danger"
                            style={{ padding: '8px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                            onClick={() => handleRejectBidFromBuyer(bid)}
                            disabled={confirmingBid === bid.bidID || rejectingBid === bid.bidID}
                          >
                            <XCircle size={14} />
                            {rejectingBid === bid.bidID ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      ) : bid.status === 'PENDING' ? (
                        <button
                          className="btn-danger"
                          style={{ fontSize: 12, padding: '5px 12px' }}
                          onClick={() => handleWithdrawBid(bid.bidID)}
                        >
                          Withdraw
                        </button>
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
          <div style={{ 
            background: 'white', 
            border: '1px solid var(--border)', 
            borderRadius: 16, 
            padding: '4px 8px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            maxWidth: 500
          }}>
            <Search size={20} className="text-slate-400 ml-3" />
            <input 
              placeholder="Search by TDR ID or Area..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', padding: '12px 0', outline: 'none', fontSize: 15, fontWeight: 500 }}
            />
          </div>
        </div>

        {loadingAll ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500 opacity-20" />
            Synchronizing Marketplace Ledger...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-20 text-center border-dashed border-2 border-slate-200 bg-slate-50/50">
            <ShoppingBag size={64} style={{ opacity: 0.1, marginBottom: 20, margin: '0 auto' }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>No active listings</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>There are currently no TDR assets listed for sale.</p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {filtered.map(listing => {
              const isMine = listing.sellerID === user?.fabricID || listing.seller === user?.fabricID
              return (
                <Card key={listing.listingID} hoverable className="h-full flex flex-col border-slate-200">
                  <div style={{ 
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                    padding: '24px', 
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05 }}>
                      <Shield size={120} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.1em' }}>TDR Asset Unit</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {isMine && (
                          <span style={{ fontSize: 9, background: '#10b981', color: 'white', padding: '3px 10px', borderRadius: 20, fontWeight: 900, border: '1px solid rgba(255,255,255,0.2)' }}>
                            OWN LISTING
                          </span>
                        )}
                        <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{listing.status}</span>
                      </div>
                    </div>
                    <h3 style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>{listing.tdrID}</h3>
                  </div>
                  
                  <CardBody className="flex-1 flex flex-col pt-6">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 36, height: 36, background: '#f8fafc', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Map size={18} className="text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Certificate Area</span>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{listing.area.toLocaleString()} sq m</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 36, height: 36, background: '#f0f9ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Tag size={18} className="text-blue-500" />
                        </div>
                        <div className="flex flex-col">
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Asking Price</span>
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#2563eb' }}>₹ {listing.askingPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto">
                      {isMine ? (
                        <button
                          className="btn-ghost"
                          style={{ width: '100%', justifyContent: 'center', height: 44, borderRadius: 12, fontWeight: 800 }}
                          onClick={() => toggleBids(listing.listingID)}
                        >
                          <Gavel size={16} /> Manage Bids
                        </button>
                      ) : (
                        <button
                          className="btn-primary"
                          style={{ width: '100%', justifyContent: 'center', height: 46, borderRadius: 12, fontSize: 14, fontWeight: 900, boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}
                          onClick={() => setBidModal(listing)}
                        >
                          <Gavel size={18} /> Place a Bid
                        </button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        )}

        {/* ── Bid Modal ───────────────────────────────────── */}
        {bidModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}>
            <Card className="w-full max-w-[440px] shadow-2xl animate-in zoom-in-95 duration-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <Gavel size={20} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>New Purchase Bid</h3>
                </div>
                <button onClick={() => setBidModal(null)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors border-none bg-transparent cursor-pointer">
                  <XCircle size={20} className="text-slate-400" />
                </button>
              </CardHeader>
              
              <CardBody className="p-8">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Target Asset</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 20 }}>₹ {bidModal.askingPrice.toLocaleString()} Ask</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>{bidModal.tdrID}</div>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Enter Bid Amount (₹)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94a3b8' }}>₹</div>
                    <input
                      type="number"
                      className="tdr-input"
                      style={{ width: '100%', paddingLeft: 36, fontSize: 18, fontWeight: 800, height: 56, borderRadius: 14 }}
                      placeholder="0.00"
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, fontWeight: 600 }}>Enter the price you are willing to pay for this TDR certificate.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    className="btn-primary"
                    style={{ width: '100%', height: 52, borderRadius: 14, fontSize: 15, fontWeight: 900, boxShadow: '0 10px 20px -5px rgba(37,99,235,0.3)' }}
                    onClick={handlePlaceBid}
                    disabled={submitting || !bidAmount}
                  >
                    {submitting ? 'Confirming with Ledger...' : 'Confirm & Place Bid'}
                  </button>
                  <button 
                    className="btn-ghost" 
                    style={{ height: 44, fontSize: 13, fontWeight: 700, color: '#64748b' }}
                    onClick={() => setBidModal(null)}
                  >
                    Cancel Transaction
                  </button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}