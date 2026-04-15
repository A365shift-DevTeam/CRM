import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Trash2, X } from 'lucide-react';
import { contactService } from '../../../services/contactService';

const STAKEHOLDERS_CONSTANTS = {
    COUNTRIES: ['India', 'Other'],
    INDIAN_STATES: [
        'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
        'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
        'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
        'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands',
        'Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh',
        'Lakshadweep','Puducherry'
    ]
};

export default function BusinessDetails({ details, updateDetails, charges, addCharge, removeCharge, updateCharge }) {
    const currency = details.currency || 'AED';
    const dealValue = parseFloat(details.dealValue) || 0;
    const totalChargePct = charges ? charges.reduce((s, c) => s + (parseFloat(c.percentage)||0), 0) : 0;
    const totalChargeAmt = charges ? charges.reduce((s, c) => s + ((dealValue * (parseFloat(c.percentage)||0))/100), 0) : 0;

    // ── Contact Picker ──
    const [contacts, setContacts] = useState([]);
    const [contactSearch, setContactSearch] = useState('');
    const [showDrop, setShowDrop] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const dropRef = useRef(null);

    useEffect(() => {
        contactService.getContacts()
            .then(data => setContacts(Array.isArray(data) ? data : []))
            .catch(() => setContacts([]));
    }, []);

    useEffect(() => {
        const handleClick = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filteredContacts = contacts.filter(c => {
        const q = contactSearch.toLowerCase();
        return !q || (c.name||'').toLowerCase().includes(q) || (c.company||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q);
    }).slice(0, 8);

    const handleContactSelect = (contact) => {
        setSelectedContact(contact);
        setContactSearch('');
        setShowDrop(false);
        updateDetails('clientName', contact.name || contact.company || '');
        updateDetails('clientAddress', contact.clientAddress || contact.address || '');
        updateDetails('clientGstin', contact.gstin || '');
        updateDetails('location', contact.location || contact.clientCountry || '');
    };

    const handleTaxChange = (id, field, value, currentCharge) => {
        let updates = { [field]: value };
        let currentCountry = field === 'country' ? value : (currentCharge.country || 'India');
        let currentState   = field === 'state'   ? value : (currentCharge.state   || '');

        if (field === 'country') {
            if (value === 'Other') {
                updates.country = '';
                updates.state = '';
                if (currency !== 'INR') { updates.taxType = 'Export (Nil Rate)'; updates.percentage = 0; updates.name = 'Export (Nil)'; }
                else { updates.taxType = 'Inter-State (IGST)'; updates.percentage = 18; updates.name = 'IGST'; }
            } else if (value === 'India') {
                updates.country = 'India';
            } else {
                updates.state = '';
                if (currency !== 'INR') { updates.taxType = 'Export (Nil Rate)'; updates.percentage = 0; updates.name = 'Export (Nil)'; }
                else { updates.taxType = 'Inter-State (IGST)'; updates.percentage = 18; updates.name = 'IGST'; }
            }
        }

        if (field === 'state' && (currentCountry === 'India' || !currentCountry)) {
            if (value === 'Tamil Nadu') { updates.taxType = 'Intra-State (CGST + SGST)'; updates.percentage = 18; updates.name = 'GST (Intra)'; }
            else if (value) { updates.taxType = 'Inter-State (IGST)'; updates.percentage = 18; updates.name = 'IGST'; }
        }

        if (field === 'taxType') {
            if (value === '') {
                if (currentCountry === 'Other' || (currentCountry && currentCountry !== 'India')) {
                    if (currency !== 'INR') { updates.taxType = 'Export (Nil Rate)'; updates.percentage = 0; updates.name = 'Export (Nil)'; }
                    else { updates.taxType = 'Inter-State (IGST)'; updates.percentage = 18; updates.name = 'IGST'; }
                } else if (currentCountry === 'India') {
                    if (currentState === 'Tamil Nadu') { updates.taxType = 'Intra-State (CGST + SGST)'; updates.percentage = 18; updates.name = 'GST (Intra)'; }
                    else if (currentState) { updates.taxType = 'Inter-State (IGST)'; updates.percentage = 18; updates.name = 'IGST'; }
                    else { updates.taxType = ''; updates.percentage = 0; updates.name = 'Tax'; }
                }
            } else if (value === 'Export (Nil Rate)') { updates.percentage = 0; updates.country = 'International'; updates.state = ''; updates.name = 'Export (Nil)'; }
            else if (value === 'Intra-State (CGST + SGST)') { updates.percentage = 18; updates.country = 'India'; updates.state = 'Tamil Nadu'; updates.name = 'GST (Intra)'; }
            else if (value === 'Inter-State (IGST)') { updates.percentage = 18; updates.country = 'India'; updates.name = 'IGST'; }
            else if (value === 'Other') { updates.name = 'Tax'; }
        }

        updateCharge(id, updates);
    };

    return (
        <div className="inv-stage-card" style={{ '--stage-accent': 'linear-gradient(180deg,#4361EE 0%,#06B6D4 100%)' }}>
            <div className="inv-stage-header">
                <div className="inv-stage-header-left">
                    <div className="inv-stage-num">1</div>
                    <div>
                        <div className="inv-stage-title">Business Details & Finance Charges</div>
                        <div className="inv-stage-sub">Project info, deal value, and tax configuration</div>
                    </div>
                </div>
            </div>
            <div className="inv-stage-body">

                {/* ── Contact Auto-fill Picker ── */}
                <div className="inv-contact-picker" ref={dropRef}>
                    <div className="inv-contact-picker-label">
                        <Users size={13} style={{ color: '#4361EE' }} />
                        Import from Contact
                    </div>
                    <div className="inv-contact-search-wrap">
                        <input
                            className="inv-contact-search-input"
                            placeholder={selectedContact ? `${selectedContact.name || selectedContact.company}` : 'Search by name, company or email…'}
                            value={contactSearch}
                            onFocus={() => setShowDrop(true)}
                            onChange={e => { setContactSearch(e.target.value); setShowDrop(true); }}
                        />
                        {selectedContact && (
                            <button
                                className="inv-contact-clear"
                                title="Clear selection"
                                onClick={() => { setSelectedContact(null); setContactSearch(''); }}
                            ><X size={12} /></button>
                        )}
                        {showDrop && (
                            <div className="inv-contact-drop">
                                {filteredContacts.length === 0 ? (
                                    <div className="inv-contact-empty">No contacts found</div>
                                ) : filteredContacts.map(c => (
                                    <div
                                        key={c._id || c.id}
                                        className="inv-contact-item"
                                        onMouseDown={() => handleContactSelect(c)}
                                    >
                                        <div className="inv-contact-avatar">
                                            {(c.name || c.company || '?').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="inv-contact-info">
                                            <div className="inv-contact-name">{c.name || c.company || '—'}</div>
                                            <div className="inv-contact-meta">{[c.company, c.email].filter(Boolean).join(' · ')}</div>
                                        </div>
                                        {(c.gstin || c.clientAddress) && (
                                            <div className="inv-contact-tags">
                                                {c.gstin && <span className="inv-contact-tag">GSTIN</span>}
                                                {c.clientAddress && <span className="inv-contact-tag">Address</span>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {selectedContact && (
                        <div className="inv-contact-selected-info">
                            {selectedContact.phone && <span><strong>Phone:</strong> {selectedContact.phone}</span>}
                            {selectedContact.gstin && <span><strong>GSTIN:</strong> {selectedContact.gstin}</span>}
                            {selectedContact.clientAddress && <span><strong>Address:</strong> {selectedContact.clientAddress}</span>}
                        </div>
                    )}
                </div>

                <div className="inv-form-grid">
                    <label className="inv-form-label">Project ID</label>
                    <input className="inv-input" value={details.projectId} onChange={e => updateDetails('projectId', e.target.value)} />
                    <label className="inv-form-label">Client Name</label>
                    <input className="inv-input" value={details.clientName} onChange={e => updateDetails('clientName', e.target.value)} />

                    <label className="inv-form-label">Client Address</label>
                    <input className="inv-input" value={details.clientAddress||''} onChange={e => updateDetails('clientAddress', e.target.value)} placeholder="Client billing address" />
                    <label className="inv-form-label">Client GSTIN</label>
                    <input className="inv-input" value={details.clientGstin||''} onChange={e => updateDetails('clientGstin', e.target.value)} placeholder="e.g. 29ABCDE1234F1Z5" />

                    <label className="inv-form-label">Delivery</label>
                    <input className="inv-input" value={details.delivery||''} onChange={e => updateDetails('delivery', e.target.value)} placeholder="Ambot365" />
                    <label className="inv-form-label">Billing Location</label>
                    <input className="inv-input" value={details.location} onChange={e => updateDetails('location', e.target.value)} />

                    <label className="inv-form-label">Deal Value</label>
                    <input type="number" className="inv-input" value={details.dealValue} onChange={e => updateDetails('dealValue', e.target.value)} />
                    <label className="inv-form-label">Currency</label>
                    <select className="inv-select" value={details.currency} onChange={e => updateDetails('currency', e.target.value)}>
                        <option value="AED">AED</option><option value="USD">USD</option><option value="INR">INR</option>
                    </select>

                    <label className="inv-form-label">Lead GST (%)</label>
                    <input type="number" className="inv-input" value={details.leadGst||''} onChange={e => updateDetails('leadGst', e.target.value)} placeholder="e.g. 18" />
                    <label className="inv-form-label">Currency Value</label>
                    <input type="number" className="inv-input" value={details.currencyValue||''} onChange={e => updateDetails('currencyValue', e.target.value)} placeholder="e.g. 83.50" />
                </div>

                <div className="inv-section-divider">
                    <span className="inv-section-label">Finance Charges (GST / Tax)</span>
                    <button className="inv-btn-outline" style={{ height: 30, fontSize: 12 }} onClick={addCharge}>
                        <Plus size={13} /> Add Tax
                    </button>
                </div>

                <div className="inv-table-wrap">
                    <table className="inv-stage-table">
                        <thead>
                            <tr>
                                <th style={{ width: 200 }}>Tax Type</th>
                                <th>Country</th>
                                <th>State</th>
                                <th style={{ width: 90 }}>%</th>
                                <th>Amount ({currency})</th>
                                <th style={{ width: 44 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {charges && charges.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        {c.taxType === 'Other' ? (
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <input className="inv-table-input" value={c.name} onChange={e => updateCharge(c.id, 'name', e.target.value)} placeholder="Tax Name" autoFocus />
                                                <button className="inv-btn-icon" onClick={() => handleTaxChange(c.id, 'taxType', '', c)} title="Reset" style={{ flexShrink: 0 }}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <select className="inv-table-select" value={c.taxType||''} onChange={e => handleTaxChange(c.id, 'taxType', e.target.value, c)}>
                                                <option value="">Select Type</option>
                                                <option value="Intra-State (CGST + SGST)">Intra-State (CGST + SGST)</option>
                                                <option value="Inter-State (IGST)">Inter-State (IGST)</option>
                                                <option value="Export (Nil Rate)">Export (Nil Rate)</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        )}
                                    </td>
                                    <td>
                                        {c.country !== 'India' && c.country !== undefined ? (
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <input className="inv-table-input" value={c.country} onChange={e => handleTaxChange(c.id, 'country', e.target.value, c)} placeholder="Country Name" autoFocus />
                                                <button className="inv-btn-icon" onClick={() => handleTaxChange(c.id, 'country', 'India', c)} title="Reset to India" style={{ flexShrink: 0 }}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <select
                                                className="inv-table-select"
                                                value={c.country || 'India'}
                                                disabled={c.taxType === 'Other'}
                                                onChange={e => handleTaxChange(c.id, 'country', e.target.value, c)}
                                            >
                                                {STAKEHOLDERS_CONSTANTS.COUNTRIES.map(country => (
                                                    <option key={country} value={country}>{country}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    <td>
                                        <select
                                            className="inv-table-select"
                                            value={c.state||''}
                                            disabled={(c.country||'India') !== 'India' || c.taxType === 'Other'}
                                            onChange={e => handleTaxChange(c.id, 'state', e.target.value, c)}
                                        >
                                            <option value="">Select State</option>
                                            {STAKEHOLDERS_CONSTANTS.INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            className="inv-table-input"
                                            value={c.percentage}
                                            disabled={c.taxType !== 'Other'}
                                            onChange={e => handleTaxChange(c.id, 'percentage', e.target.value, c)}
                                            style={{ textAlign: 'center' }}
                                        />
                                    </td>
                                    <td>
                                        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', fontFamily: 'Consolas, monospace' }}>
                                            {currency} {(dealValue * c.percentage / 100).toLocaleString()}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="inv-btn-icon" onClick={() => removeCharge(c.id)}>
                                            <Trash2 size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="3">Total Tax Liability</td>
                                <td>{totalChargePct.toFixed(2)}%</td>
                                <td>{currency} {totalChargeAmt.toLocaleString()}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
