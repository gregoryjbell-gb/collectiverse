'use client';

import { useState, useEffect } from 'react';

const EXPENSE_TYPES = [
  'PLATFORM_FEE', 'PAYMENT_PROCESSING_FEE', 'SHIPPING_LABEL',
  'INSURANCE', 'PACKAGING_SUPPLIES', 'SALES_TAX', 'REFUND', 'OTHER',
];

export default function SaleFinancials({ saleId, isSeller }: { saleId: string; isSeller: boolean }) {
  const [fin, setFin] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [expForm, setExpForm] = useState({ expenseType: 'PLATFORM_FEE', amount: '', description: '', expenseDate: new Date().toISOString().split('T')[0] });
  const [showExpForm, setShowExpForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch(`/api/sales/${saleId}/financials`).then(r => r.ok ? r.json() : null).then(d => { if (d) setFin(d.financials); });
  };

  useEffect(() => { load(); }, [saleId]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/sales/${saleId}/financials`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setEditing(false);
    load();
    setSaving(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/sales/${saleId}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(expForm) });
    setShowExpForm(false);
    setExpForm({ expenseType: 'PLATFORM_FEE', amount: '', description: '', expenseDate: new Date().toISOString().split('T')[0] });
    load();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Delete this expense?')) return;
    await fetch(`/api/sales/${saleId}/expenses/${expenseId}`, { method: 'DELETE' });
    load();
  };

  if (!fin) return null;

  return (
    <div className="card-surface p-5 mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Financials</h3>
        {isSeller && !editing && <button onClick={() => { setEditing(true); setForm({ platformFees: fin.platformFees, paymentProcessingFee: fin.paymentProcessingFee, shippingCost: fin.shippingCost, insuranceCost: fin.insuranceCost, suppliesCost: fin.suppliesCost, otherCosts: fin.otherCosts, costBasis: fin.costBasis, taxCollected: fin.taxCollected }); }} className="text-electric text-xs hover:underline">Edit</button>}
      </div>

      {editing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-silver">Platform Fees</label><input type="number" step="0.01" className="input-field text-xs" value={form.platformFees || ''} onChange={e => setForm({...form, platformFees: e.target.value})} /></div>
            <div><label className="text-xs text-silver">Payment Processing</label><input type="number" step="0.01" className="input-field text-xs" value={form.paymentProcessingFee || ''} onChange={e => setForm({...form, paymentProcessingFee: e.target.value})} /></div>
            <div><label className="text-xs text-silver">Shipping Cost</label><input type="number" step="0.01" className="input-field text-xs" value={form.shippingCost || ''} onChange={e => setForm({...form, shippingCost: e.target.value})} /></div>
            <div><label className="text-xs text-silver">Insurance</label><input type="number" step="0.01" className="input-field text-xs" value={form.insuranceCost || ''} onChange={e => setForm({...form, insuranceCost: e.target.value})} /></div>
            <div><label className="text-xs text-silver">Supplies</label><input type="number" step="0.01" className="input-field text-xs" value={form.suppliesCost || ''} onChange={e => setForm({...form, suppliesCost: e.target.value})} /></div>
            <div><label className="text-xs text-silver">Other Costs</label><input type="number" step="0.01" className="input-field text-xs" value={form.otherCosts || ''} onChange={e => setForm({...form, otherCosts: e.target.value})} /></div>
            <div><label className="text-xs text-silver">Cost Basis</label><input type="number" step="0.01" className="input-field text-xs" value={form.costBasis || ''} onChange={e => setForm({...form, costBasis: e.target.value})} /></div>
            <div><label className="text-xs text-silver">Tax Collected</label><input type="number" step="0.01" className="input-field text-xs" value={form.taxCollected || ''} onChange={e => setForm({...form, taxCollected: e.target.value})} /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-xs">{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex justify-between"><span className="text-silver">Sale Price</span><span>${fin.salePrice.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-silver">Shipping Charged</span><span>${fin.shippingCharged.toFixed(2)}</span></div>
            {fin.taxCollected > 0 && <div className="flex justify-between"><span className="text-silver">Tax Collected</span><span>${fin.taxCollected.toFixed(2)}</span></div>}
            <div className="flex justify-between font-medium"><span className="text-silver">Gross Amount</span><span>${fin.grossAmount.toFixed(2)}</span></div>
          </div>
          <div className="border-t border-silver/10 pt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {fin.platformFees > 0 && <div className="flex justify-between"><span className="text-silver">Platform Fees</span><span className="text-red-400">-${fin.platformFees.toFixed(2)}</span></div>}
            {fin.paymentProcessingFee > 0 && <div className="flex justify-between"><span className="text-silver">Processing Fee</span><span className="text-red-400">-${fin.paymentProcessingFee.toFixed(2)}</span></div>}
            {fin.shippingCost > 0 && <div className="flex justify-between"><span className="text-silver">Shipping Cost</span><span className="text-red-400">-${fin.shippingCost.toFixed(2)}</span></div>}
            {fin.insuranceCost > 0 && <div className="flex justify-between"><span className="text-silver">Insurance</span><span className="text-red-400">-${fin.insuranceCost.toFixed(2)}</span></div>}
            {fin.suppliesCost > 0 && <div className="flex justify-between"><span className="text-silver">Supplies</span><span className="text-red-400">-${fin.suppliesCost.toFixed(2)}</span></div>}
            {fin.otherCosts > 0 && <div className="flex justify-between"><span className="text-silver">Other Costs</span><span className="text-red-400">-${fin.otherCosts.toFixed(2)}</span></div>}
          </div>
          <div className="border-t border-silver/10 pt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex justify-between font-bold"><span className="text-silver">Net Proceeds</span><span className="text-electric">${fin.netProceeds.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-silver">Cost Basis</span><span>${fin.costBasis.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold"><span className="text-silver">Gain/Loss</span><span className={fin.realizedGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}>{fin.realizedGainLoss >= 0 ? '+' : ''}${fin.realizedGainLoss.toFixed(2)}</span></div>
            {fin.roiPercent !== null && <div className="flex justify-between"><span className="text-silver">ROI</span><span className={fin.roiPercent >= 0 ? 'text-green-400' : 'text-red-400'}>{fin.roiPercent}%</span></div>}
          </div>
        </div>
      )}

      {/* Expenses */}
      {isSeller && (
        <div className="border-t border-silver/10 pt-3 mt-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-silver">Itemized Expenses</p>
            <button onClick={() => setShowExpForm(!showExpForm)} className="text-electric text-xs hover:underline">{showExpForm ? 'Cancel' : '+ Add'}</button>
          </div>
          {showExpForm && (
            <form onSubmit={handleAddExpense} className="flex gap-2 mb-2 flex-wrap">
              <select className="input-field text-xs w-36" value={expForm.expenseType} onChange={e => setExpForm({...expForm, expenseType: e.target.value})}>
                {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              <input type="number" step="0.01" className="input-field text-xs w-20" placeholder="$" value={expForm.amount} onChange={e => setExpForm({...expForm, amount: e.target.value})} required />
              <input className="input-field text-xs w-32" placeholder="Description" value={expForm.description} onChange={e => setExpForm({...expForm, description: e.target.value})} />
              <button type="submit" className="btn-primary text-xs">Add</button>
            </form>
          )}
          {fin.expenses.length > 0 && (
            <div className="space-y-1">
              {fin.expenses.map((exp: any) => (
                <div key={exp.id} className="flex justify-between items-center text-xs py-1 border-b border-silver/5 last:border-0">
                  <div>
                    <span className="text-silver">{exp.expenseType.replace(/_/g, ' ')}</span>
                    {exp.description && <span className="text-silver/60 ml-1">— {exp.description}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">${exp.amount.toFixed(2)}</span>
                    <button onClick={() => handleDeleteExpense(exp.id)} className="text-red-400 hover:underline">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
