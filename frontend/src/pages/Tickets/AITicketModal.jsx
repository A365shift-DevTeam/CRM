import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Sparkles, ChevronRight, Check } from 'lucide-react';
import { ticketService } from '../../services/ticketService';

const STEPS = ['Input', 'Preview', 'Confirm'];

export default function AITicketModal({ show, onHide, onConfirm }) {
  const [step, setStep] = useState(0);
  const [rawText, setRawText] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setStep(0); setRawText(''); setPreview(null); setError(''); };
  const handleHide = () => { reset(); onHide(); };

  const handleAnalyze = async () => {
    if (!rawText.trim()) { setError('Paste some text first'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await ticketService.aiGenerate(rawText);
      setPreview(result);
      setStep(1);
    } catch (e) {
      setError('AI generation failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      title: preview.title,
      description: preview.description,
      type: preview.type,
      priority: preview.priority,
      category: preview.category,
      isAiGenerated: true,
      aiSource: 'Manual Input',
      aiConfidence: preview.confidence,
      aiRawInput: rawText,
    });
    handleHide();
  };

  const confidencePct = preview ? Math.round(preview.confidence * 100) : 0;
  const confidenceColor = confidencePct >= 80 ? '#10B981' : confidencePct >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} style={{ color: '#7C3AED' }} />
          AI Ticket Generator
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Step indicator */}
        <div className="ai-modal-step">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`ai-step-dot ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`ai-step-line ${i < step ? 'done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 0: Input */}
        {step === 0 && (
          <div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
              Paste an email, log snippet, or conversation. Claude will extract a structured ticket.
            </p>
            <Form.Control
              as="textarea"
              className="glass-input ai-textarea-raw"
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Paste email, Slack message, support log, or any text here…"
            />
            {error && <div className="text-danger mt-2" style={{ fontSize: 12 }}>{error}</div>}
          </div>
        )}

        {/* Step 1: Preview */}
        {step === 1 && preview && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>AI Confidence</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: confidenceColor }}>{confidencePct}%</span>
            </div>
            <div className="ai-confidence-bar">
              <div className="ai-confidence-fill" style={{ width: `${confidencePct}%`, background: confidenceColor }} />
            </div>

            <div style={{ marginTop: 16 }}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Title</Form.Label>
                <Form.Control className="glass-input" value={preview.title} onChange={e => setPreview({ ...preview, title: e.target.value })} />
              </Form.Group>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <Form.Label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Type</Form.Label>
                  <Form.Select className="glass-input" value={preview.type} onChange={e => setPreview({ ...preview, type: e.target.value })}>
                    {['Client Support', 'Bug', 'Internal Task'].map(t => <option key={t}>{t}</option>)}
                  </Form.Select>
                </div>
                <div className="col-6">
                  <Form.Label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Priority</Form.Label>
                  <Form.Select className="glass-input" value={preview.priority} onChange={e => setPreview({ ...preview, priority: e.target.value })}>
                    {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                  </Form.Select>
                </div>
              </div>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Description</Form.Label>
                <Form.Control as="textarea" rows={4} className="glass-input" value={preview.description ?? ''} onChange={e => setPreview({ ...preview, description: e.target.value })} />
              </Form.Group>
              {preview.suggestedContactName && (
                <div style={{ fontSize: 12, color: '#64748B', background: '#F8FAFC', padding: '8px 12px', borderRadius: 8, border: '1px solid #E1E8F4' }}>
                  Suggested contact: <strong>{preview.suggestedContactName}</strong>
                  {preview.suggestedCompanyName && <> · <strong>{preview.suggestedCompanyName}</strong></>}
                  <span style={{ color: '#94A3B8', marginLeft: 4 }}>(link manually in ticket details)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Check size={24} style={{ color: '#10B981' }} />
            </div>
            <h6 style={{ fontWeight: 700, color: '#0F172A' }}>Ready to create</h6>
            <p style={{ fontSize: 13, color: '#64748B' }}>
              Ticket "<strong>{preview?.title}</strong>" will be created with an AI badge.
            </p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleHide}>Cancel</Button>
        {step === 0 && (
          <Button onClick={handleAnalyze} disabled={loading} style={{ background: '#7C3AED', border: 'none' }}>
            {loading ? 'Analyzing…' : <><Sparkles size={14} style={{ marginRight: 6 }} />Analyze with AI</>}
          </Button>
        )}
        {step === 1 && (
          <>
            <Button variant="outline-secondary" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={() => setStep(2)} style={{ background: 'var(--button-brand, #5286A5)', border: 'none' }}>
              <ChevronRight size={14} style={{ marginRight: 4 }} />Looks Good
            </Button>
          </>
        )}
        {step === 2 && (
          <Button onClick={handleConfirm} style={{ background: '#10B981', border: 'none' }}>
            <Check size={14} style={{ marginRight: 6 }} />Create Ticket
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
