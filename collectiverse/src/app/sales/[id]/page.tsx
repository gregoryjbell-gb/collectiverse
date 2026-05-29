'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const STEPS = [
  { key: 'LISTED', label: 'Listed', icon: '1' },
  { key: 'OFFER_ACCEPTED', label: 'Offer Accepted', icon: '2' },
  { key: 'PAYMENT', label: 'Payment', icon: '3' },
  { key: 'SHIPPING', label: 'Shipping', icon: '4' },
  { key: 'DELIVERY', label: 'Delivery', icon: '5' },
  { key: 'TRANSFER', label: 'Transfer', icon: '6' },
  { key: 'FEEDBACK', label: 'Feedback', icon: '7' },
  { key: 'COMPLETED', label: 'Complete', icon: '8' },
];

const STATUS_STEP_MAP: Record<string, number> = {
  DRAFT: 0, LISTED: 0, OFFER_RECEIVED: 0,
  OFFER_ACCEPTED: 1, PAYMENT_PENDING: 2, PAYMENT_MARKED_PAID: 2, READY_TO_SHIP: 3,
  SHIPPED: 3, DELIVERED: 4, TRANSFER_PENDING: 5, TRANSFER_COMPLETED: 5,
  FEEDBACK_PENDING: 6, COMPLETED: 7, CANCELLED: -1, DISPUTED: -1,
};

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-silver/20 text-silver' },
  LISTED: { label: 'Listed', color: 'bg-blue-400/20 text-blue-400' },
  OFFER_RECEIVED: { label: 'Offer Received', color: 'bg-amber-400/20 text-amber-400' },
  OFFER_ACCEPTED: { label: 'Offer Accepted', color: 'bg-green-400/20 text-green-400' },
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'bg-amber-400/20 text-amber-400' },
  PAYMENT_MARKED_PAID: { label: 'Paid', color: 'bg-green-400/20 text-green-400' },
  READY_TO_SHIP: { label: 'Ready to Ship', color: 'bg-blue-400/20 text-blue-400' },
  SHIPPED: { label: 'Shipped', color: 'bg-purple-400/20 text-purple-400' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-400/20 text-green-400' },
  TRANSFER_PENDING: { label: 'Transfer Pending', color: 'bg-amber-400/20 text-amber-400' },
  TRANSFER_COMPLETED: { label: 'Transfer Done', color: 'bg-green-400/20 text-green-400' },
  FEEDBACK_PENDING: { label: 'Feedback Pending', color: 'bg-blue-400/20 text-blue-400' },
  COMPLETED: { label: 'Completed', color: 'bg-green-400/20 text-green-400' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-400/20 text-red-400' },
  DISPUTED: { label: 'Disputed', color: 'bg-red-400/20 text-red-400' },
};

export default function SaleDetailPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [shipForm, setShipForm] = useState({ carrier: 'USPS', trackingNumber: '', trackingUrl: '' });
  const [disputeForm, setDisputeForm] = useState({ reason: 'ITEM_NOT_AS_DESCRIBED', description: '' });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const fetchSale = () => {
    fetch(`/api/sales/${id}`)
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null; }
        if (!r.ok) { router.push('/sales'); return null; }
        return r.json();
      })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSale();
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(d => { if (d?.user) setCurrentUserId(d.user.id); });
  }, [id]);

  const doAction = async (action: string, body?: any) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : '{}',
      });
      if (res.ok) fetchSale();
      else { const d = await res.json(); alert(d.error || 'Action failed'); }
    } finally { setActionLoading(false); }
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return null;

  const { sale, listing, offer, payment, shipment, transfer, item, group, seller, buyer } = data;
  const st = statusLabels[sale.status] || { label: sale.status, color: 'bg-silver/20 text-silver' };
  const currentStep = STATUS_STEP_MAP[sale.status] ?? -1;
  const isSeller = currentUserId === sale.sellerUserId;
  const isBuyer = currentUserId === sale.buyerUserId;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Sale Details</h1>
          <Link href="/sales" className="text-sm text-silver hover:text-electric">All Sales</Link>
        </div>

        {/* Status + Summary */}
        <div className="card-surface p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-silver">Sale #{sale.id.slice(-8)}</p>
              {(item || group) && (
                <p className="text-lg font-bold mt-1">{item?.cardName || group?.name || 'Item'}</p>
              )}
              {item && <p className="text-sm text-silver">{item.setName} #{item.cardNumber}</p>}
            </div>
            <span className={`badge text-xs px-3 py-1 rounded-full ${st.color}`}>{st.label}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-silver">Seller</p><p className="text-sm font-medium">{seller?.displayName || seller?.username || '—'}</p></div>
            <div><p className="text-xs text-silver">Buyer</p><p className="text-sm font-medium">{buyer?.displayName || buyer?.username || 'Awaiting buyer'}</p></div>
            <div><p className="text-xs text-silver">Price</p><p className="text-sm font-bold text-electric">{sale.totalAmount ? `$${sale.totalAmount.toLocaleString()}` : sale.salePrice ? `$${sale.salePrice.toLocaleString()}` : 'TBD'}</p></div>
            <div><p className="text-xs text-silver">Updated</p><p className="text-sm">{new Date(sale.updatedAt).toLocaleDateString()}</p></div>
          </div>
        </div>

        {/* Timeline */}
        {sale.status !== 'CANCELLED' && sale.status !== 'DISPUTED' && (
          <div className="card-surface p-6 mb-6">
            <h3 className="text-sm font-semibold mb-4">Progress</h3>
            <div className="flex items-center justify-between overflow-x-auto">
              {STEPS.map((step, i) => (
                <div key={step.key} className="flex flex-col items-center min-w-[60px]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentStep ? 'bg-electric text-white' : 'bg-gunmetal/50 text-silver'}`}>
                    {i < currentStep ? '✓' : step.icon}
                  </div>
                  <p className={`text-xs mt-1 text-center ${i <= currentStep ? 'text-electric' : 'text-silver'}`}>{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Action */}
        <NextActionPanel
          sale={sale}
          isSeller={isSeller}
          isBuyer={isBuyer}
          actionLoading={actionLoading}
          doAction={doAction}
          shipForm={shipForm}
          setShipForm={setShipForm}
          disputeForm={disputeForm}
          setDisputeForm={setDisputeForm}
        />

        {/* Panels */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {/* Payment Panel */}
          <div className="card-surface p-5">
            <h3 className="text-sm font-semibold mb-3">Payment</h3>
            {payment ? (
              <dl className="text-sm space-y-1">
                <div className="flex justify-between"><dt className="text-silver">Amount</dt><dd className="font-bold">${payment.amount?.toLocaleString()}</dd></div>
                <div className="flex justify-between"><dt className="text-silver">Status</dt><dd><span className="badge bg-silver/10 text-xs">{payment.status}</span></dd></div>
                {payment.paidAt && <div className="flex justify-between"><dt className="text-silver">Paid</dt><dd>{new Date(payment.paidAt).toLocaleDateString()}</dd></div>}
              </dl>
            ) : <p className="text-xs text-silver">No payment created yet.</p>}
          </div>

          {/* Shipment Panel */}
          <div className="card-surface p-5">
            <h3 className="text-sm font-semibold mb-3">Shipment</h3>
            {shipment ? (
              <dl className="text-sm space-y-1">
                <div className="flex justify-between"><dt className="text-silver">Carrier</dt><dd>{shipment.carrier}</dd></div>
                <div className="flex justify-between"><dt className="text-silver">Tracking</dt><dd>{shipment.trackingNumber || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-silver">Status</dt><dd><span className="badge bg-silver/10 text-xs">{shipment.shippingStatus}</span></dd></div>
                {shipment.trackingUrl && <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-electric text-xs hover:underline block mt-2">Track Package</a>}
              </dl>
            ) : <p className="text-xs text-silver">No shipment created yet.</p>}
          </div>

          {/* Transfer Panel */}
          <div className="card-surface p-5">
            <h3 className="text-sm font-semibold mb-3">Ownership Transfer</h3>
            {transfer ? (
              <dl className="text-sm space-y-1">
                <div className="flex justify-between"><dt className="text-silver">Type</dt><dd>{transfer.transferType}</dd></div>
                <div className="flex justify-between"><dt className="text-silver">Status</dt><dd><span className="badge bg-silver/10 text-xs">{transfer.status}</span></dd></div>
                {transfer.acceptedAt && <div className="flex justify-between"><dt className="text-silver">Accepted</dt><dd>{new Date(transfer.acceptedAt).toLocaleDateString()}</dd></div>}
              </dl>
            ) : <p className="text-xs text-silver">Transfer will be created after offer is accepted.</p>}
          </div>

          {/* Listing Panel */}
          <div className="card-surface p-5">
            <h3 className="text-sm font-semibold mb-3">Listing</h3>
            {listing ? (
              <dl className="text-sm space-y-1">
                <div className="flex justify-between"><dt className="text-silver">Type</dt><dd>{listing.listingType}</dd></div>
                <div className="flex justify-between"><dt className="text-silver">Price</dt><dd>{listing.price ? `$${listing.price.toLocaleString()}` : '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-silver">Status</dt><dd><span className="badge bg-silver/10 text-xs">{listing.status}</span></dd></div>
                <div className="flex justify-between"><dt className="text-silver">Offers</dt><dd>{listing.allowOffers ? 'Yes' : 'No'}</dd></div>
              </dl>
            ) : <p className="text-xs text-silver">No listing linked.</p>}
          </div>
        </div>

        {/* Cancel / Dispute at bottom */}
        {!['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(sale.status) && (
          <div className="flex gap-3 mt-6 pt-4 border-t border-silver/10">
            <button onClick={() => doAction('cancel')} disabled={actionLoading} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors">Cancel Sale</button>
          </div>
        )}
      </div>
    </main>
  );
}

function NextActionPanel({ sale, isSeller, isBuyer, actionLoading, doAction, shipForm, setShipForm, disputeForm, setDisputeForm }: any) {
  const status = sale.status;

  if (status === 'COMPLETED') return <div className="card-surface p-5 border-green-400/30 border"><p className="text-green-400 font-medium text-sm">Sale completed successfully.</p></div>;
  if (status === 'CANCELLED') return <div className="card-surface p-5 border-red-400/30 border"><p className="text-red-400 font-medium text-sm">This sale has been cancelled.</p></div>;
  if (status === 'DISPUTED') return <div className="card-surface p-5 border-amber-400/30 border"><p className="text-amber-400 font-medium text-sm">This sale is under dispute.</p></div>;

  return (
    <div className="card-surface p-5 border-electric/20 border">
      <h3 className="text-sm font-semibold mb-3">Next Step</h3>

      {status === 'LISTED' && isSeller && (
        <p className="text-sm text-silver">Waiting for a buyer to make an offer on your listing.</p>
      )}

      {status === 'OFFER_RECEIVED' && isSeller && (
        <div>
          <p className="text-sm text-silver mb-3">You have received an offer. Accept to proceed with the sale.</p>
          <button onClick={() => doAction('accept-offer')} disabled={actionLoading} className="btn-primary text-sm">Accept Offer</button>
        </div>
      )}

      {status === 'PAYMENT_PENDING' && isBuyer && (
        <div>
          <p className="text-sm text-silver mb-3">Please complete payment to proceed.</p>
          <button onClick={() => doAction('mark-paid')} disabled={actionLoading} className="btn-primary text-sm">Mark as Paid</button>
        </div>
      )}
      {status === 'PAYMENT_PENDING' && isSeller && (
        <p className="text-sm text-silver">Waiting for buyer to complete payment.</p>
      )}

      {status === 'READY_TO_SHIP' && isSeller && (
        <div>
          <p className="text-sm text-silver mb-3">Payment received. Ship the item and add tracking.</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <select className="input-field text-xs" value={shipForm.carrier} onChange={e => setShipForm({...shipForm, carrier: e.target.value})}>
              <option value="USPS">USPS</option><option value="UPS">UPS</option><option value="FEDEX">FedEx</option><option value="DHL">DHL</option><option value="OTHER">Other</option>
            </select>
            <input className="input-field text-xs" placeholder="Tracking #" value={shipForm.trackingNumber} onChange={e => setShipForm({...shipForm, trackingNumber: e.target.value})} />
            <input className="input-field text-xs" placeholder="Tracking URL" value={shipForm.trackingUrl} onChange={e => setShipForm({...shipForm, trackingUrl: e.target.value})} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => doAction('create-shipment', shipForm)} disabled={actionLoading} className="btn-secondary text-sm">Save Tracking</button>
            <button onClick={() => doAction('mark-shipped')} disabled={actionLoading} className="btn-primary text-sm">Mark Shipped</button>
          </div>
        </div>
      )}

      {status === 'SHIPPED' && isBuyer && (
        <div>
          <p className="text-sm text-silver mb-3">Item has been shipped. Confirm when you receive it.</p>
          <button onClick={() => doAction('confirm-delivery')} disabled={actionLoading} className="btn-primary text-sm">Confirm Delivery</button>
        </div>
      )}
      {status === 'SHIPPED' && isSeller && (
        <p className="text-sm text-silver">Waiting for buyer to confirm delivery.</p>
      )}

      {status === 'DELIVERED' && isSeller && (
        <div>
          <p className="text-sm text-silver mb-3">Buyer confirmed delivery. Initiate ownership transfer.</p>
          <button onClick={() => doAction('initiate-transfer')} disabled={actionLoading} className="btn-primary text-sm">Initiate Transfer</button>
        </div>
      )}

      {status === 'TRANSFER_PENDING' && isBuyer && (
        <div>
          <p className="text-sm text-silver mb-3">Seller initiated ownership transfer. Accept to complete.</p>
          <button onClick={() => doAction('complete-transfer')} disabled={actionLoading} className="btn-primary text-sm">Accept Transfer</button>
        </div>
      )}
      {status === 'TRANSFER_PENDING' && isSeller && (
        <p className="text-sm text-silver">Waiting for buyer to accept ownership transfer.</p>
      )}

      {status === 'FEEDBACK_PENDING' && (
        <div>
          <p className="text-sm text-silver mb-3">Transaction complete! Leave feedback for the other party.</p>
          <Link href="/feedback" className="btn-primary text-sm inline-block">Leave Feedback</Link>
        </div>
      )}

      {/* Dispute option for active sales */}
      {!['COMPLETED', 'CANCELLED', 'DISPUTED', 'DRAFT', 'LISTED'].includes(status) && (
        <details className="mt-4 pt-3 border-t border-silver/10">
          <summary className="text-xs text-amber-400 cursor-pointer">Open a dispute</summary>
          <div className="mt-3 space-y-2">
            <select className="input-field text-xs w-full" value={disputeForm.reason} onChange={e => setDisputeForm({...disputeForm, reason: e.target.value})}>
              <option value="ITEM_NOT_AS_DESCRIBED">Item not as described</option>
              <option value="ITEM_NOT_RECEIVED">Item not received</option>
              <option value="DAMAGED_IN_TRANSIT">Damaged in transit</option>
              <option value="COUNTERFEIT_CONCERN">Counterfeit concern</option>
              <option value="PAYMENT_ISSUE">Payment issue</option>
              <option value="TRANSFER_ISSUE">Transfer issue</option>
              <option value="OTHER">Other</option>
            </select>
            <textarea className="input-field text-xs w-full min-h-[60px]" placeholder="Describe the issue..." value={disputeForm.description} onChange={e => setDisputeForm({...disputeForm, description: e.target.value})} />
            <button onClick={() => doAction('dispute', disputeForm)} disabled={actionLoading || !disputeForm.description} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors">Submit Dispute</button>
          </div>
        </details>
      )}
    </div>
  );
}
