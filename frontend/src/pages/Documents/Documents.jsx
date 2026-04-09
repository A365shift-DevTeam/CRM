import React, { useState, useEffect } from 'react';
import { documentService } from '../../services/api';
import { useToast } from '../../components/Toast/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FaFilePdf, FaFileWord, FaFileExcel, FaFileImage,
  FaFileLines, FaDownload, FaTrash, FaCloudArrowUp
} from 'react-icons/fa6';
import { Modal, Form, Button } from 'react-bootstrap';
import PageToolbar from '../../components/PageToolbar/PageToolbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, File, Grid3x3, List } from 'lucide-react';

const FILE_TYPES = {
  pdf:  { icon: FaFilePdf,   color: '#F43F5E', bg: 'rgba(244,63,94,0.09)',  label: 'PDF' },
  doc:  { icon: FaFileWord,  color: '#4361EE', bg: 'rgba(67,97,238,0.09)', label: 'DOC' },
  docx: { icon: FaFileWord,  color: '#4361EE', bg: 'rgba(67,97,238,0.09)', label: 'DOCX' },
  xls:  { icon: FaFileExcel, color: '#10B981', bg: 'rgba(16,185,129,0.09)', label: 'XLS' },
  xlsx: { icon: FaFileExcel, color: '#10B981', bg: 'rgba(16,185,129,0.09)', label: 'XLSX' },
  png:  { icon: FaFileImage, color: '#F59E0B', bg: 'rgba(245,158,11,0.09)', label: 'IMG' },
  jpg:  { icon: FaFileImage, color: '#F59E0B', bg: 'rgba(245,158,11,0.09)', label: 'IMG' },
  jpeg: { icon: FaFileImage, color: '#F59E0B', bg: 'rgba(245,158,11,0.09)', label: 'IMG' },
};

const ENTITY_COLORS = {
  General: { color: '#64748B', bg: 'rgba(100,116,139,0.09)' },
  Project: { color: '#4361EE', bg: 'rgba(67,97,238,0.09)' },
  Client:  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.09)' },
  Invoice: { color: '#10B981', bg: 'rgba(16,185,129,0.09)' },
};

function getFileType(fileName) {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  return FILE_TYPES[ext] || { icon: FaFileLines, color: '#64748B', bg: 'rgba(100,116,139,0.09)', label: ext.toUpperCase() || 'FILE' };
}

function formatBytes(bytes) {
  if (!+bytes) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function FileIconBox({ fileName }) {
  const ft = getFileType(fileName);
  const Icon = ft.icon;
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: ft.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={18} style={{ color: ft.color }} />
    </div>
  );
}

export default function Documents() {
  const { themeColor } = useTheme();
  const toast = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [filterEntity, setFilterEntity] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    entityType: 'General', entityId: 0, fileName: '', fileUrl: '', fileSize: 0
  });

  useEffect(() => { loadDocuments(); }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setDocuments((await documentService.getAll()) || []);
    } catch (e) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await documentService.delete(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast.success('Document deleted');
    } catch (e) {
      toast.error('Failed to delete document');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      const ext = formData.fileName.split('.').pop() || 'pdf';
      await documentService.create({
        ...formData,
        fileUrl: formData.fileUrl || `https://example.com/files/${formData.fileName}`,
        fileType: ext,
      });
      toast.success('Document uploaded');
      setShowModal(false);
      loadDocuments();
    } catch (e) {
      toast.error('Failed to upload document');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData({ ...formData, fileName: file.name, fileSize: file.size });
  };

  const entityTypes = ['All', ...new Set(documents.map(d => d.entityType || 'General'))];

  const filtered = documents.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !search || d.fileName?.toLowerCase().includes(q) || d.entityType?.toLowerCase().includes(q);
    const matchEntity = filterEntity === 'All' || d.entityType === filterEntity;
    return matchSearch && matchEntity;
  });

  return (
    <div className="docs-page">
      {/* Header */}
      <div className="docs-header">
        <div>
          <h2 className="docs-title">Documents</h2>
          <p className="docs-subtitle">{filtered.length} files · Secure storage</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', border: '1px solid #E1E8F4', borderRadius: 9, overflow: 'hidden', background: '#fff' }}>
            <button className={`docs-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')} style={viewMode === 'list' ? { background: themeColor, color: '#fff' } : {}}>
              <List size={14} />
            </button>
            <button className={`docs-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')} style={viewMode === 'grid' ? { background: themeColor, color: '#fff' } : {}}>
              <Grid3x3 size={14} />
            </button>
          </div>
          <button className="docs-upload-btn" style={{ background: themeColor }} onClick={() => setShowModal(true)}>
            <FaCloudArrowUp size={14} />
            Upload File
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="docs-toolbar">
        <div className="docs-search-wrap">
          <Search size={14} className="docs-search-icon" />
          <input className="docs-search" placeholder="Search documents…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="docs-search-clear" onClick={() => setSearch('')}><X size={13} /></button>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {entityTypes.map(t => (
            <button key={t}
              className={`docs-filter-btn ${filterEntity === t ? 'active' : ''}`}
              onClick={() => setFilterEntity(t)}
              style={filterEntity === t ? { color: themeColor, borderColor: themeColor, background: `${themeColor}10` } : {}}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="docs-loading">
          <div className="docs-spinner" style={{ borderTopColor: themeColor }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="docs-empty">
          <FaCloudArrowUp size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
          <p style={{ color: '#94A3B8', fontWeight: 500, fontSize: 14 }}>No documents found</p>
          <button className="docs-upload-btn" style={{ background: themeColor, marginTop: 8 }} onClick={() => setShowModal(true)}>
            <FaCloudArrowUp size={13} /> Upload File
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="docs-table-card">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Related To</th>
                <th>Size</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => {
                const ft = getFileType(doc.fileName);
                const ec = ENTITY_COLORS[doc.entityType] || ENTITY_COLORS.General;
                return (
                  <motion.tr
                    key={doc.id}
                    className="docs-row"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FileIconBox fileName={doc.fileName} />
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5, lineHeight: 1.3 }}>
                            {doc.fileName || 'Untitled'}
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{ft.label}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 9px',
                        borderRadius: 999, background: ft.bg, color: ft.color,
                        letterSpacing: '0.04em',
                      }}>{ft.label}</span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11.5, fontWeight: 700, padding: '3px 10px',
                        borderRadius: 999, background: ec.bg, color: ec.color,
                        border: `1px solid ${ec.color}20`,
                      }}>
                        {doc.entityType} {doc.entityId ? `#${doc.entityId}` : ''}
                      </span>
                    </td>
                    <td style={{ color: '#64748B', fontSize: 13 }}>{formatBytes(doc.fileSize)}</td>
                    <td style={{ color: '#94A3B8', fontSize: 12.5 }}>
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button className="docs-action-btn download"
                          onClick={() => window.open(doc.fileUrl || '#', '_blank')} title="Download">
                          <FaDownload size={13} />
                        </button>
                        <button className="docs-action-btn danger"
                          onClick={() => handleDelete(doc.id)} title="Delete">
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="docs-grid">
          {filtered.map((doc, i) => {
            const ft = getFileType(doc.fileName);
            const Icon = ft.icon;
            return (
              <motion.div
                key={doc.id}
                className="docs-grid-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="docs-grid-icon" style={{ background: ft.bg }}>
                  <Icon size={28} style={{ color: ft.color }} />
                </div>
                <div className="docs-grid-name">{doc.fileName || 'Untitled'}</div>
                <div className="docs-grid-meta">{formatBytes(doc.fileSize)} · {ft.label}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'center' }}>
                  <button className="docs-action-btn download"
                    onClick={() => window.open(doc.fileUrl || '#', '_blank')}>
                    <FaDownload size={12} />
                  </button>
                  <button className="docs-action-btn danger" onClick={() => handleDelete(doc.id)}>
                    <FaTrash size={11} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Upload Document</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpload}>
          <Modal.Body className="px-4 py-3">
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 600, fontSize: 13 }}>Select File</Form.Label>
              <Form.Control required type="file" onChange={handleFileChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 600, fontSize: 13 }}>Category</Form.Label>
              <Form.Select value={formData.entityType}
                onChange={e => setFormData({ ...formData, entityType: e.target.value })}>
                <option value="General">General</option>
                <option value="Project">Project</option>
                <option value="Client">Client</option>
                <option value="Invoice">Invoice</option>
              </Form.Select>
            </Form.Group>
            {formData.entityType !== 'General' && (
              <Form.Group className="mb-2">
                <Form.Label style={{ fontWeight: 600, fontSize: 13 }}>Entity ID</Form.Label>
                <Form.Control type="number" value={formData.entityId}
                  onChange={e => setFormData({ ...formData, entityId: parseInt(e.target.value) || 0 })}
                  placeholder={`Enter ${formData.entityType} ID`} />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" style={{ background: themeColor, borderColor: themeColor }}>
              <FaCloudArrowUp size={13} /> Upload
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style>{`
        .docs-page {
          padding: 24px 28px 40px;
          max-width: 1400px; margin: 0 auto;
          font-family: var(--font-family, 'DM Sans', sans-serif);
        }
        .docs-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; flex-wrap: wrap;
          gap: 16px; margin-bottom: 20px;
        }
        .docs-title {
          font-family: var(--font-display, 'Outfit', sans-serif);
          font-size: 22px; font-weight: 800;
          color: #0F172A; margin: 0; letter-spacing: -0.03em;
        }
        .docs-subtitle { font-size: 12px; color: #94A3B8; margin: 3px 0 0; }
        .docs-view-btn {
          padding: 7px 10px; border: none; background: transparent;
          cursor: pointer; color: #94A3B8; display: flex; align-items: center;
          transition: all 0.15s;
        }
        .docs-view-btn:hover { color: #475569; }
        .docs-upload-btn {
          display: flex; align-items: center; gap: 7px;
          color: #fff; border: none; padding: 9px 18px;
          border-radius: 10px; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: filter 0.15s, transform 0.15s;
          font-family: var(--font-family, 'DM Sans', sans-serif);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .docs-upload-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .docs-toolbar {
          display: flex; align-items: center; gap: 14px;
          flex-wrap: wrap; margin-bottom: 20px;
        }
        .docs-search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 340px; }
        .docs-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
        .docs-search {
          width: 100%; padding: 9px 32px 9px 34px;
          border: 1px solid #E1E8F4; border-radius: 10px;
          font-size: 13px; background: #fff; outline: none;
          font-family: var(--font-family, 'DM Sans', sans-serif);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .docs-search:focus { border-color: var(--accent-primary, #4361EE); box-shadow: 0 0 0 3px rgba(67,97,238,0.1); }
        .docs-search-clear {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%); background: none;
          border: none; cursor: pointer; color: #94A3B8;
        }
        .docs-filter-btn {
          padding: 7px 13px; border-radius: 9px;
          border: 1px solid #E1E8F4; background: #fff;
          font-size: 12px; font-weight: 600; cursor: pointer;
          color: #64748B; transition: all 0.15s;
          font-family: var(--font-family, 'DM Sans', sans-serif);
        }
        .docs-filter-btn:hover { background: #F4F7FD; }
        .docs-loading, .docs-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 260px; gap: 8px;
        }
        .docs-spinner {
          width: 32px; height: 32px; border: 3px solid #E1E8F4;
          border-radius: 50%; animation: dsspin 0.7s linear infinite;
        }
        @keyframes dsspin { to { transform: rotate(360deg); } }

        /* Table */
        .docs-table-card {
          background: #fff; border: 1px solid #E1E8F4;
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 2px 12px rgba(15,23,42,0.06);
        }
        .docs-table { width: 100%; border-collapse: collapse; }
        .docs-table thead tr { background: #F4F7FD; }
        .docs-table th {
          padding: 12px 16px; font-size: 10.5px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #64748B; border-bottom: 1px solid #E1E8F4;
          font-family: var(--font-family, 'DM Sans', sans-serif);
        }
        .docs-table th:first-child { padding-left: 20px; }
        .docs-table th:last-child { padding-right: 20px; }
        .docs-row td {
          padding: 13px 16px; vertical-align: middle;
          border-bottom: 1px solid rgba(225,232,244,0.6);
          transition: background 0.12s;
          font-family: var(--font-family, 'DM Sans', sans-serif);
        }
        .docs-row:last-child td { border-bottom: none; }
        .docs-row:nth-child(even) td { background: #FAFBFE; }
        .docs-row:hover td { background: #F0F5FF !important; }
        .docs-row:hover td:first-child { box-shadow: inset 3px 0 0 var(--accent-primary, #4361EE); }
        .docs-row td:first-child { padding-left: 20px; }
        .docs-row td:last-child { padding-right: 20px; }

        .docs-action-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 8px;
          border: 1px solid #E1E8F4; background: #fff;
          cursor: pointer; transition: all 0.15s;
        }
        .docs-action-btn.download { color: #4361EE; }
        .docs-action-btn.download:hover { background: rgba(67,97,238,0.1); border-color: rgba(67,97,238,0.2); }
        .docs-action-btn.danger { color: #F43F5E; }
        .docs-action-btn.danger:hover { background: rgba(244,63,94,0.1); border-color: rgba(244,63,94,0.2); }

        /* Grid */
        .docs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 14px;
        }
        .docs-grid-card {
          background: #fff; border: 1px solid #E1E8F4;
          border-radius: 14px; padding: 20px 16px 16px;
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 6px;
          box-shadow: 0 2px 10px rgba(15,23,42,0.05);
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: default;
        }
        .docs-grid-card:hover { box-shadow: 0 6px 20px rgba(67,97,238,0.1); transform: translateY(-2px); }
        .docs-grid-icon {
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 6px;
        }
        .docs-grid-name {
          font-size: 12.5px; font-weight: 700; color: #0F172A;
          line-height: 1.3; word-break: break-word;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .docs-grid-meta { font-size: 11px; color: #94A3B8; font-weight: 500; }
      `}</style>
    </div>
  );
}
