import React, { useState, useEffect } from 'react';
import { documentService } from '../../services/api';
import { useToast } from '../../components/Toast/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileLines, FaDownload, FaTrash, FaCloudArrowUp } from 'react-icons/fa6';
import { Modal, Form, Button } from 'react-bootstrap';
import PageToolbar from '../../components/PageToolbar/PageToolbar';

export default function Documents() {
    const { themeColor } = useTheme();
    const toast = useToast();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ entityType: 'General', entityId: 0, fileName: '', fileUrl: '', fileSize: 0 });

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const data = await documentService.getAll();
            setDocuments(data || []);
        } catch (error) {
            console.error('Failed to load documents', error);
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            await documentService.delete(id);
            setDocuments(documents.filter(d => d.id !== id));
            toast.success('Document deleted');
        } catch (error) {
            console.error('Failed to delete document', error);
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
                fileType: ext 
            });
            toast.success('Document uploaded successfully');
            setShowModal(false);
            loadDocuments();
        } catch (error) {
            console.error('Failed to upload document', error);
            toast.error('Failed to upload document');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, fileName: file.name, fileSize: file.size });
        }
    };

    const getFileIcon = (fileName) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return <FaFilePdf className="text-danger" size={24} />;
        if (['doc', 'docx'].includes(ext)) return <FaFileWord className="text-primary" size={24} />;
        if (['xls', 'xlsx'].includes(ext)) return <FaFileExcel className="text-success" size={24} />;
        if (['png', 'jpg', 'jpeg'].includes(ext)) return <FaFileImage className="text-warning" size={24} />;
        return <FaFileLines className="text-secondary" size={24} />;
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const filteredDocs = documents.filter(d => 
        d.fileName?.toLowerCase().includes(search.toLowerCase()) || 
        d.entityType?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <PageToolbar
                title="Documents"
                itemCount={filteredDocs.length}
                searchQuery={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search files..."
                actions={[
                    { label: 'Upload File', icon: <FaCloudArrowUp />, variant: 'primary', onClick: () => setShowModal(true) }
                ]}
            />

            {loading ? (
                <div className="d-flex justify-content-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <div className="card border-0 overflow-hidden">
                    {filteredDocs.length === 0 ? (
                        <div className="text-center p-5 text-slate-500">
                            <FaCloudArrowUp size={48} className="text-slate-300 mb-3" />
                            <h5>No Documents Found</h5>
                            <p>Upload a file to get started.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="px-4 py-3 text-slate-500 fw-semibold border-0">Name</th>
                                        <th className="py-3 text-slate-500 fw-semibold border-0">Related To</th>
                                        <th className="py-3 text-slate-500 fw-semibold border-0">Size</th>
                                        <th className="py-3 text-slate-500 fw-semibold border-0">Date Added</th>
                                        <th className="px-4 py-3 text-end text-slate-500 fw-semibold border-0">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDocs.map((doc) => (
                                        <tr key={doc.id} style={{ cursor: 'pointer' }}>
                                            <td className="px-4 py-3">
                                                <div className="d-flex align-items-center gap-3">
                                                    {getFileIcon(doc.fileName)}
                                                    <span className="fw-medium text-slate-800">{doc.fileName}</span>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className="badge bg-slate-100 text-slate-700 border border-slate-200">
                                                    {doc.entityType} #{doc.entityId}
                                                </span>
                                            </td>
                                            <td className="py-3 text-slate-600">{formatBytes(doc.fileSize)}</td>
                                            <td className="py-3 text-slate-600">{new Date(doc.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-end">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <button onClick={() => window.open(doc.fileUrl || `https://example.com/files/${doc.fileName}`, '_blank')} className="btn btn-sm btn-light border-slate-200 text-slate-600 rounded" title="Download">
                                                        <FaDownload />
                                                    </button>
                                                    <button onClick={() => handleDelete(doc.id)} className="btn btn-sm text-danger border-0 bg-transparent rounded hover-bg-light" title="Delete">
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Upload Document</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpload}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Select File</Form.Label>
                            <Form.Control required type="file" onChange={handleFileChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Related Entity (Optional)</Form.Label>
                            <Form.Select value={formData.entityType} onChange={e => setFormData({...formData, entityType: e.target.value})}>
                                <option value="General">General</option>
                                <option value="Project">Project</option>
                                <option value="Client">Client</option>
                                <option value="Invoice">Invoice</option>
                            </Form.Select>
                        </Form.Group>
                        {formData.entityType !== 'General' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Entity ID</Form.Label>
                                <Form.Control type="number" required value={formData.entityId} onChange={e => setFormData({...formData, entityId: parseInt(e.target.value) || 0})} placeholder={`Enter ${formData.entityType} ID`} />
                            </Form.Group>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" style={{ backgroundColor: themeColor, borderColor: themeColor }}>Upload Document</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
