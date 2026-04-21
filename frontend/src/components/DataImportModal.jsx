import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Table } from 'react-bootstrap';
import * as XLSX from 'xlsx';

const fieldMaps = {
    contacts: ['name', 'email', 'phone', 'company', 'status', 'entityType', 'location', 'jobTitle'],
    expenses: ['date', 'category', 'amount', 'description', 'employeeName', 'projectDepartment'],
};

export default function DataImportModal({ show, onHide, entityType = 'contacts', onImport }) {
    const [step, setStep] = useState(1);
    const [fileData, setFileData] = useState([]);
    const [fileColumns, setFileColumns] = useState([]);
    const [mapping, setMapping] = useState({});
    const [importing, setImporting] = useState(false);
    const fileRef = useRef(null);

    const fields = fieldMaps[entityType] || fieldMaps.contacts;

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const wb = XLSX.read(evt.target.result, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(ws);
            if (json.length > 0) {
                setFileData(json);
                setFileColumns(Object.keys(json[0]));
                const autoMap = {};
                Object.keys(json[0]).forEach(col => {
                    const match = fields.find(f => f.toLowerCase() === col.toLowerCase());
                    if (match) autoMap[match] = col;
                });
                setMapping(autoMap);
                setStep(2);
            }
        };
        reader.readAsBinaryString(file);
    };

    const getMappedData = () => {
        return fileData.map(row => {
            const mapped = {};
            fields.forEach(f => { if (mapping[f]) mapped[f] = row[mapping[f]]; });
            return mapped;
        });
    };

    const handleImport = async () => {
        setImporting(true);
        try { await onImport(getMappedData()); onHide(); } catch (e) { alert(e.message); }
        setImporting(false);
    };

    const reset = () => { setStep(1); setFileData([]); setFileColumns([]); setMapping({}); };

    return (
        <Modal show={show} onHide={() => { reset(); onHide(); }} centered size="lg">
            <Modal.Header closeButton><Modal.Title style={{ fontSize: '1rem' }}>Import {entityType}</Modal.Title></Modal.Header>
            <Modal.Body>
                <div className="d-flex gap-2 mb-3">
                    {[1, 2, 3].map(s => (
                        <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: step >= s ? '#3b82f6' : '#e2e8f0' }} />
                    ))}
                </div>
                {step === 1 && (
                    <div className="text-center py-4">
                        <p style={{ color: '#64748b' }}>Upload a CSV or Excel file</p>
                        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
                        <Button onClick={() => fileRef.current?.click()} style={{ background: 'var(--button-brand, #5286A5)', border: 'none' }}>Choose File</Button>
                    </div>
                )}
                {step === 2 && (
                    <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Map columns</p>
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Found {fileData.length} rows and {fileColumns.length} columns</p>
                        {fields.map(field => (
                            <div key={field} className="d-flex align-items-center gap-2 mb-2">
                                <span style={{ width: '140px', fontSize: '0.85rem', fontWeight: 500 }}>{field}</span>
                                <Form.Select size="sm" value={mapping[field] || ''} onChange={e => setMapping({ ...mapping, [field]: e.target.value })} style={{ maxWidth: '200px' }}>
                                    <option value="">-- Skip --</option>
                                    {fileColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                </Form.Select>
                            </div>
                        ))}
                        <div className="d-flex gap-2 mt-3">
                            <Button variant="secondary" size="sm" onClick={() => setStep(1)}>Back</Button>
                            <Button size="sm" onClick={() => setStep(3)} style={{ background: 'var(--button-brand, #5286A5)', border: 'none' }}>Preview</Button>
                        </div>
                    </div>
                )}
                {step === 3 && (
                    <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Preview (first 5 rows)</p>
                        <div style={{ overflowX: 'auto' }}>
                            <Table size="sm" style={{ fontSize: '0.8rem' }}>
                                <thead><tr>{fields.filter(f => mapping[f]).map(f => <th key={f}>{f}</th>)}</tr></thead>
                                <tbody>{getMappedData().slice(0, 5).map((row, i) => (
                                    <tr key={i}>{fields.filter(f => mapping[f]).map(f => <td key={f}>{String(row[f] ?? '')}</td>)}</tr>
                                ))}</tbody>
                            </Table>
                        </div>
                        <div className="d-flex gap-2 mt-3">
                            <Button variant="secondary" size="sm" onClick={() => setStep(2)}>Back</Button>
                            <Button size="sm" onClick={handleImport} disabled={importing} style={{ background: 'var(--button-brand, #5286A5)', border: 'none' }}>{importing ? 'Importing...' : `Import ${fileData.length} rows`}</Button>
                        </div>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}
