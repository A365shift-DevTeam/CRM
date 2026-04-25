import React, { useState, useEffect } from 'react';
import { Button, Form, Badge, Card, Row, Col, InputGroup, Modal } from 'react-bootstrap';
import {
    Building2, Search, Star, Filter, MessageSquare,
    MapPin, CheckCircle2, Circle, ChevronDown, Check, X,
    Briefcase, Percent, Award, Shield, Cpu, Cloud, Globe, Phone, Mail, Send, Reply
} from 'lucide-react';
import { contactService } from '../../services/contactService';
import PageToolbar from '../../components/PageToolbar/PageToolbar';
import PageHeader from '../../components/PageHeader/PageHeader';
import './Vendor.css';

// Helper function to extract category from contact (handles dynamic field names)
const extractCategory = (contact) => {
    // First check standard field names
    if (contact.category && String(contact.category).trim() && String(contact.category).trim() !== '-') {
        return String(contact.category).trim();
    }
    if (contact.Category && String(contact.Category).trim() && String(contact.Category).trim() !== '-') {
        return String(contact.Category).trim();
    }
    if (contact.serviceCategory && String(contact.serviceCategory).trim() && String(contact.serviceCategory).trim() !== '-') {
        return String(contact.serviceCategory).trim();
    }

    // Check for dynamic field names that start with "category" (case-insensitive)
    // e.g., category_1772441570745, Category_1234567890, etc.
    for (const key in contact) {
        if (contact.hasOwnProperty(key)) {
            const lowerKey = key.toLowerCase();
            // Check if key starts with "category" and has a value
            if (lowerKey.startsWith('category') && lowerKey !== 'category') {
                const value = contact[key];
                if (value && String(value).trim() && String(value).trim() !== '-') {
                    return String(value).trim();
                }
            }
        }
    }

    return null;
};

// Helper function to convert contact to vendor format
const mapContactToVendor = (contact) => {
    // Parse services from notes or use empty array
    const services = contact.services ? (Array.isArray(contact.services) ? contact.services : [contact.services]) :
        (contact.notes ? contact.notes.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5) : []);

    // Get location from various possible fields
    const location = contact.Billinglocation || contact.clientAddress || contact.location || 'Not specified';

    // Default values for optional fields
    const rating = contact.rating || 4.0;
    const reviews = contact.reviews || 0;
    const years = contact.years || 0;
    const margin = contact.margin || 0;

    // Generate avatar URL from name (using a placeholder service)
    const avatar = contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'Vendor')}&background=3b82f6&color=fff&size=150`;

    // Extract category using the helper function
    const category = extractCategory(contact) || contact.company || 'General';

    return {
        id: contact.id,
        name: contact.name || contact.company || 'Unnamed Vendor',
        category: category,
        rating: rating,
        reviews: reviews,
        years: years,
        margin: margin,
        services: services.length > 0 ? services : ['General Services'],
        about: contact.notes || contact.about || 'No description available.',
        location: location,
        contact: {
            email: contact.email || '',
            phone: contact.phone || ''
        },
        avatar: avatar,
        // Optional fields with defaults
        matchScore: contact.matchScore || 75,
        matchLabel: contact.matchLabel || 'Inquiry',
        matchPercentage: contact.matchPercentage || 50
    };
};

// Categories will be dynamically generated from vendor data

export default function Vendor() {
    const [vendors, setVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [minRating, setMinRating] = useState(0);
    const [requiredServices, setRequiredServices] = useState([]);
    const [allCategories, setAllCategories] = useState(['All Categories']);
    const [baseCategories, setBaseCategories] = useState([]);
    const [draftMessage, setDraftMessage] = useState('');
    const [showMailModal, setShowMailModal] = useState(false);
    const [mailSubject, setMailSubject] = useState('');
    const [mailBody, setMailBody] = useState('');
    const [excludedVendors, setExcludedVendors] = useState([]);
    const [vendorResponses, setVendorResponses] = useState({});
    const [loadingResponses, setLoadingResponses] = useState(false);
    const [showResponseModal, setShowResponseModal] = useState(false);

    // Load base categories from global column settings
    useEffect(() => {
        const fetchBaseCategories = async () => {
            try {
                const cols = await contactService.getColumns();
                if (cols && cols.length > 0) {
                    const categoryCol = cols.find(c => c.id === 'category' || c.name.toLowerCase() === 'category');
                    if (categoryCol && categoryCol.config && categoryCol.config.options) {
                        const loaded = categoryCol.config.options.map(opt => typeof opt === 'string' ? opt : opt.label);
                        setBaseCategories(loaded.filter(c => c && c.trim()));
                    }
                }
            } catch (error) {
                console.error("Error loading categories from columns:", error);
            }
        };

        fetchBaseCategories();
    }, []);

    // Load vendors and extract dynamic categories from contacts
    useEffect(() => {
        setIsLoading(true);

        const fetchContacts = async () => {
            try {
                const contactData = await contactService.getContacts(1, 1000);
                const allContacts = contactData?.items ?? contactData ?? [];

                // 1. Filter vendors
                const vendorContacts = allContacts.filter(contact =>
                    contact.type === 'Vendor' ||
                    contact.entityType === 'Vendor' ||
                    contact.status === 'Vendor'
                );

                // Map contacts to vendor format
                const mappedVendors = vendorContacts.map(mapContactToVendor);
                setVendors(mappedVendors);

                // 2. Combine base categories and dynamic categories
                const dynamicCategories = new Set(baseCategories);

                allContacts.forEach(contact => {
                    // Use the extractCategory helper to handle dynamic field names
                    const categoryValue = extractCategory(contact);
                    if (categoryValue) {
                        dynamicCategories.add(categoryValue);
                        // Debug: Log category extraction for vendors
                        if (contact.type === 'Vendor' || contact.entityType === 'Vendor' || contact.status === 'Vendor') {
                            console.log('Vendor category extracted:', {
                                vendorId: contact.id,
                                vendorName: contact.name,
                                categoryValue: categoryValue,
                                allKeys: Object.keys(contact).filter(k => k.toLowerCase().includes('category'))
                            });
                        }
                    }
                });

                const uniqueCategories = new Set(['All Categories', ...dynamicCategories]);

                // Sort alphabetically but keep "All Categories" first
                const sortedCategories = Array.from(uniqueCategories).sort((a, b) => {
                    if (a === 'All Categories') return -1;
                    if (b === 'All Categories') return 1;
                    return a.localeCompare(b);
                });

                setAllCategories(sortedCategories);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching contacts:', error);
                loadVendors();
            }
        };

        fetchContacts();
    }, [baseCategories]);

    // Fallback function for one-time load
    const loadVendors = async () => {
        try {
            setIsLoading(true);
            // Use the optimized getVendors method
            const vendorContacts = await contactService.getVendors();

            // Map contacts to vendor format
            const mappedVendors = vendorContacts.map(mapContactToVendor);
            setVendors(mappedVendors);
        } catch (error) {
            console.error('Error loading vendors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handlers
    const handleRemoveService = (service) => {
        setRequiredServices(prev => prev.filter(s => s !== service));
    };

    const handleVendorSelect = async (vendor) => {
        setSelectedVendor(vendor);
        // Load responses for this vendor
        if (vendor && vendor.id) {
            setLoadingResponses(true);
            try {
                const responses = await contactService.getVendorResponses(vendor.id);
                setVendorResponses(prev => ({
                    ...prev,
                    [vendor.id]: responses
                }));
            } catch (error) {
                console.error('Error loading vendor responses:', error);
            } finally {
                setLoadingResponses(false);
            }
        }
    };

    // Filter logic (simplified for UI demonstration)
    const filteredVendors = vendors.filter(v => {
        const matchesCategory = selectedCategory === 'All Categories' || v.category === selectedCategory;
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesRating = v.rating >= minRating;
        return matchesCategory && matchesSearch && matchesRating;
    });

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 100px)' }}>
            <PageHeader 
                title="Vendors" 
                description="Manage vendor relationships, service providers, and evaluations" 
                icon={Building2} 
                iconColor="#3b82f6"
            />
            <div className="vendor-container" style={{ padding: 0, height: '100%' }}>
                {/* ───── LEFT SIDEBAR: FILTERS ───── */}
                <div className="vendor-sidebar">
                <div className="sidebar-header">
                    <Building2 size={24} className="text-primary me-2" />
                    <h5 className="mb-0 fw-bold">Vendor Specifications</h5>
                </div>

                <div className="sidebar-content">
                    {/* Category */}
                    <div className="filter-group">
                        <label className="filter-label">Service Category</label>
                        <div className="custom-select-wrapper">
                            <select className="custom-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                                {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <ChevronDown size={16} className="select-icon" />
                        </div>
                    </div>

                    {/* Required Services */}
                    <div className="filter-group">
                        <label className="filter-label">Required Services</label>
                        <div className="tags-input-container">
                            {requiredServices.map(service => (
                                <Badge key={service} className="service-tag text-primary bg-primary bg-opacity-10 rounded-pill">
                                    {service}
                                    <span className="ms-1 remove-tag" onClick={() => handleRemoveService(service)}>
                                        <X size={12} />
                                    </span>
                                </Badge>
                            ))}
                            <input type="text" placeholder="Add service..." className="add-tag-input" />
                        </div>
                    </div>

                    {/* Vendor Rating */}
                    <div className="filter-group">
                        <label className="filter-label">Minimum Rating ({minRating.toFixed(1)}+)</label>
                        <div className="d-flex align-items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    className={`star-btn ${minRating >= star ? 'active' : ''}`}
                                    onClick={() => setMinRating(minRating === star ? 0 : star)}
                                >
                                    <Star size={20} fill={minRating >= star ? "#fbbf24" : "none"} color={minRating >= star ? "#fbbf24" : "#cbd5e1"} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Draft Message */}
                    <div className="filter-group">
                        <label className="filter-label d-flex align-items-center gap-2">
                            <MessageSquare size={16} /> Draft a Message
                        </label>
                        <textarea
                            className="vendor-textarea"
                            placeholder="Type your message to vendors here..."
                            rows={4}
                            value={draftMessage}
                            onChange={(e) => setDraftMessage(e.target.value)}
                        />
                    </div>

                    {/* Margin */}
                    <div className="filter-group d-flex align-items-center justify-content-between">
                        <label className="filter-label mb-0">Target Margin (%)</label>
                        <input type="number" defaultValue={30} className="margin-input" />
                    </div>

                    <Button className="btn-gradient-primary w-100 mt-3">
                        Apply Specifications
                    </Button>
                </div>
            </div>

            {/* ───── CENTER CONTENT: VENDOR LIST ───── */}
            <div className="vendor-main-content">

                {/* Search & Stats Header */}
                <div className="mb-4">
                    <PageToolbar
                        title="Vendors"
                        itemCount={filteredVendors.length}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        searchPlaceholder="Search vendors by name, service, or keywords..."
                        actions={[
                            { 
                                label: 'Send Mail', 
                                icon: <Send size={16} />, 
                                variant: 'primary', 
                                onClick: () => {
                                    setMailBody(draftMessage || '');
                                    setExcludedVendors([]);
                                    setShowMailModal(true);
                                }
                            }
                        ]}
                    />

                    {/* Quick Stats Pills */}
                    <div className="quick-stats-row mt-3">
                        <div className="stat-pill bg-white shadow-sm border">
                            <Building2 size={16} className="text-secondary" />
                            <span className="fw-semibold">{filteredVendors.length} Vendors</span>
                        </div>
                        <div className="stat-pill bg-primary bg-opacity-10 text-primary border-primary border border-opacity-25 shadow-sm">
                            <Award size={16} />
                            <span className="fw-semibold">AI Best Match</span>
                            <Badge bg="primary" pill className="ms-1">{filteredVendors.filter(v => v.matchScore > 80).length} found</Badge>
                        </div>
                        <div className="stat-pill bg-white shadow-sm border">
                            <Percent size={16} className="text-warning" />
                            <span className="text-muted small">Avg Margin:</span>
                            <span className="fw-bold text-success">30%</span>
                        </div>
                        <div className="stat-pill bg-white shadow-sm border">
                            <Star size={16} className="text-warning" fill="#fbbf24" />
                            <span className="text-muted small">Avg Rating:</span>
                            <span className="fw-bold text-dark">4.6</span>
                        </div>
                    </div>
                </div>

                {/* List of Vendors */}
                <div className="vendor-list">
                    <h6 className="mb-3 fw-bold text-dark">Top {filteredVendors.length} Vendors Found</h6>

                    {isLoading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="text-muted mt-2">Loading vendors...</p>
                        </div>
                    ) : filteredVendors.length === 0 ? (
                        <div className="text-center py-5">
                            <Building2 size={48} className="text-muted mb-3" />
                            <p className="text-muted">No vendors found. Create contacts with entity type 'Vendor' to see them here.</p>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3 pb-4">
                            {filteredVendors.map(vendor => {
                                const stagesList = ['Inquiry', 'Quote', 'Negotiate', 'Contract', 'Partner'];
                                const isSelected = selectedVendor?.id === vendor.id;

                                return (
                                    <div
                                        key={vendor.id}
                                        className={`vendor-list-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleVendorSelect(vendor)}
                                    >
                                        <div className="d-flex w-100 align-items-center justify-content-between">

                                            {/* Left: Avatar & Text */}
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="vendor-avatar-wrap">
                                                    {/* Fallback to initials avatar layout if no true image exists */}
                                                    {vendor.avatar && !vendor.avatar.includes('ui-avatars') ? (
                                                        <img src={vendor.avatar} alt={vendor.name} className="vendor-avatar" />
                                                    ) : (
                                                        <div className="initials-avatar">
                                                            {vendor.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="vendor-status-dot bg-success"></div>
                                                </div>

                                                <div>
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <h6 className="vendor-name fw-bold m-0">{vendor.name}</h6>
                                                        <div className="vendor-rating-box">
                                                            <Star size={10} fill="#fbbf24" color="#fbbf24" style={{ marginBottom: '1px' }} />
                                                            <span>{vendor.rating}</span>
                                                        </div>
                                                    </div>
                                                    <p className="vendor-category text-muted m-0 small mb-2">{vendor.category}</p>
                                                    <div className="vendor-tags">
                                                        {vendor.services.slice(0, 2).map(s => (
                                                            <span key={s} className="v-tag">{s}</span>
                                                        ))}
                                                        {vendor.services.length > 2 && <span className="v-tag">+{(vendor.services.length - 2)}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Action Button */}
                                            <Button variant="light" className="details-btn fw-bold text-primary px-4 py-2 bg-primary bg-opacity-10 border-0 rounded-3">
                                                Details
                                            </Button>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Send Mail Button - Floating at bottom right (Now handled in PageToolbar) */}

            {/* ───── MODAL: VENDOR DETAILS PREMIUM ───── */}
            <Modal
                show={selectedVendor !== null}
                onHide={() => setSelectedVendor(null)}
                size="xl"
                centered
                animation={true}
                className="vendor-details-modal standard-modal"
            >
                <Modal.Body className="vendor-modal-body">
                    <button className="btn-close-details" onClick={() => setSelectedVendor(null)}>
                        <X size={20} />
                    </button>

                    <div className="premium-modal-header-bg"></div>

                    {selectedVendor && (
                        <div className="vendor-modal-content-pad">

                            <div className="premium-avatar-container">
                                {selectedVendor.avatar && !selectedVendor.avatar.includes('ui-avatars') ? (
                                    <img src={selectedVendor.avatar} alt={selectedVendor.name} className="premium-details-avatar" />
                                ) : (
                                    <div className="premium-details-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3b82f6', color: 'white', fontSize: '2rem', fontWeight: 700 }}>
                                        {selectedVendor.name.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="text-center mb-4">
                                <h4 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>{selectedVendor.name}</h4>
                                <p className="text-muted fw-medium mb-3">{selectedVendor.category}</p>

                                <div className="d-flex justify-content-center gap-3">
                                    {selectedVendor.rating > 0 && (
                                        <div className="d-flex align-items-center gap-2 bg-light px-3 py-2 rounded-pill border">
                                            <div className="d-flex text-warning">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} fill={i < Math.floor(selectedVendor.rating) ? "currentColor" : "none"} style={{ marginRight: '2px' }} />
                                                ))}
                                            </div>
                                            <span className="fw-bold text-dark small">{selectedVendor.rating.toFixed(1)}</span>
                                        </div>
                                    )}
                                    {selectedVendor.years > 0 && (
                                        <div className="d-flex align-items-center gap-2 bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill border border-success border-opacity-25 fw-semibold small">
                                            <CheckCircle2 size={14} /> {selectedVendor.years} Years Active
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="d-flex gap-3 mb-4">
                                <button className="btn-gradient-primary flex-grow-1">Request Quote</button>
                                <Button 
                                    variant="light" 
                                    className="flex-grow-1 rounded-3 py-2 fw-bold text-secondary border d-flex align-items-center justify-content-center gap-2"
                                    onClick={async () => {
                                        if (selectedVendor && selectedVendor.id) {
                                            setLoadingResponses(true);
                                            try {
                                                const responses = await contactService.getVendorResponses(selectedVendor.id);
                                                setVendorResponses(prev => ({
                                                    ...prev,
                                                    [selectedVendor.id]: responses
                                                }));
                                                setShowResponseModal(true);
                                            } catch (error) {
                                                console.error('Error loading vendor responses:', error);
                                                alert('Error loading responses. Please try again.');
                                            } finally {
                                                setLoadingResponses(false);
                                            }
                                        }
                                    }}
                                >
                                    <Reply size={16} />
                                    Response
                                </Button>
                            </div>

                            <div className="details-section">
                                <div className="details-section-title">Services Offered</div>
                                <div className="d-flex flex-wrap gap-2">
                                    {selectedVendor.services.map(s => (
                                        <span key={s} className="v-tag bg-white border">{s}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="details-section">
                                <div className="details-section-title">About Company</div>
                                <p className="text-secondary lh-lg mb-0" style={{ fontSize: '0.9rem' }}>
                                    {selectedVendor.about}
                                </p>
                            </div>

                            <div className="details-section">
                                <div className="details-section-title">Contact Information</div>
                                <div className="d-flex flex-column gap-3 text-dark">
                                    {selectedVendor.location && (
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary"><MapPin size={18} /></div>
                                            <span className="fw-medium">{selectedVendor.location}</span>
                                        </div>
                                    )}
                                    {selectedVendor.contact.email && (
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary"><Mail size={18} /></div>
                                            <span className="fw-medium">{selectedVendor.contact.email}</span>
                                        </div>
                                    )}
                                    {selectedVendor.contact.phone && (
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary"><Phone size={18} /></div>
                                            <span className="fw-medium">{selectedVendor.contact.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Email Responses Section */}
                            <div className="details-section mb-0">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div className="details-section-title mb-0">Email Responses</div>
                                    {loadingResponses && (
                                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </div>
                                {vendorResponses[selectedVendor.id] && vendorResponses[selectedVendor.id].length > 0 ? (
                                    <div className="d-flex flex-column gap-3">
                                        {vendorResponses[selectedVendor.id].map((response, index) => (
                                            <div key={response.id || index} className="response-card" style={{
                                                background: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                borderLeft: '4px solid #6366f1'
                                            }}>
                                                <div className="d-flex align-items-start justify-content-between mb-2">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="bg-primary bg-opacity-10 p-1 rounded-circle">
                                                            <Mail size={14} className="text-primary" />
                                                        </div>
                                                        <div>
                                                            <div className="fw-semibold small text-dark">{response.subject || 'Email Response'}</div>
                                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                                {response.createdAt ? new Date(response.createdAt).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                }) : 'Recently'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {response.status && (
                                                        <Badge bg={response.status === 'replied' ? 'success' : response.status === 'read' ? 'info' : 'secondary'} className="small">
                                                            {response.status}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {response.message && (
                                                    <div className="text-secondary small mt-2" style={{ fontSize: '0.8125rem', lineHeight: '1.5' }}>
                                                        {response.message}
                                                    </div>
                                                )}
                                                {response.body && (
                                                    <div className="text-secondary small mt-2" style={{ fontSize: '0.8125rem', lineHeight: '1.5' }}>
                                                        {response.body}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <Mail size={32} className="text-muted mb-2" style={{ opacity: 0.5 }} />
                                        <p className="text-muted small mb-0">No email responses yet</p>
                                        <p className="text-muted" style={{ fontSize: '0.75rem' }}>Responses will appear here after vendors reply</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* ───── MODAL: QUICK MAIL PREMIUM ───── */}
            <Modal
                show={showMailModal}
                onHide={() => setShowMailModal(false)}
                size="lg"
                centered
                className="standard-modal"
            >
                <Modal.Header closeButton className="border-0 pb-0 pt-4 px-4">
                    <Modal.Title className="fw-bold fs-4">Send Mail to Selected Vendors</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-4">
                    {/* Recipients List */}
                    <div className="mb-4">
                        <label className="form-label fw-semibold text-muted small text-uppercase mb-2">
                            Recipients ({filteredVendors.filter(v => !excludedVendors.includes(v.id)).length} vendors)
                        </label>
                        <div className="recipients-list" style={{
                            maxHeight: '150px',
                            overflowY: 'auto',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '8px',
                            padding: '12px',
                            background: 'rgba(0, 0, 0, 0.02)'
                        }}>
                            {filteredVendors
                                .filter(v => !excludedVendors.includes(v.id))
                                .map((vendor, index, filteredList) => (
                                    <div key={vendor.id} className="d-flex align-items-center gap-2 mb-2 pb-2" style={{
                                        borderBottom: index < filteredList.length - 1 ? '1px solid rgba(0, 0, 0, 0.05)' : 'none'
                                    }}>
                                        <div className="vendor-avatar-wrap" style={{ width: '32px', height: '32px' }}>
                                            <img src={vendor.avatar} alt={vendor.name} className="vendor-avatar" style={{ width: '32px', height: '32px' }} />
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="fw-medium small">{vendor.name}</div>
                                            {vendor.contact.email && (
                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{vendor.contact.email}</div>
                                            )}
                                            {!vendor.contact.email && (
                                                <div className="text-danger" style={{ fontSize: '0.75rem' }}>No email address</div>
                                            )}
                                        </div>
                                        {vendor.contact.email && (
                                            <CheckCircle2 size={16} className="text-success" />
                                        )}
                                        <button
                                            type="button"
                                            className="btn-close-recipient"
                                            onClick={() => setExcludedVendors(prev => [...prev, vendor.id])}
                                            title="Remove recipient"
                                        >
                                            <X size={14} className="text-danger" />
                                        </button>
                                    </div>
                                ))}
                        </div>
                        {filteredVendors.filter(v => !v.contact.email && !excludedVendors.includes(v.id)).length > 0 && (
                            <div className="alert alert-warning mt-2 py-2 small mb-0">
                                <strong>{filteredVendors.filter(v => !v.contact.email && !excludedVendors.includes(v.id)).length}</strong> vendor(s) don't have email addresses and will be skipped.
                            </div>
                        )}
                    </div>

                    {/* Subject */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold text-muted small text-uppercase mb-2">
                            Subject
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter email subject..."
                            value={mailSubject}
                            onChange={(e) => setMailSubject(e.target.value)}
                            style={{
                                borderRadius: '8px',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                padding: '10px 14px'
                            }}
                        />
                    </div>

                    {/* Message Body */}
                    <div className="mb-4">
                        <label className="form-label fw-semibold text-muted small text-uppercase mb-2">
                            Message
                        </label>
                        <textarea
                            className="form-control"
                            placeholder="Type your message here..."
                            rows={8}
                            value={mailBody}
                            onChange={(e) => setMailBody(e.target.value)}
                            style={{
                                borderRadius: '8px',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                padding: '12px',
                                resize: 'vertical'
                            }}
                        />
                        <div className="text-muted small mt-2">
                            This message will be sent to all {filteredVendors.filter(v => v.contact.email && !excludedVendors.includes(v.id)).length} vendor(s) with email addresses.
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0 pb-4 px-4">
                    <Button variant="light" onClick={() => setShowMailModal(false)} className="rounded-pill px-4 fw-semibold text-muted bg-transparent border-0">
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        className="rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                        onClick={async () => {
                            const vendorsWithEmail = filteredVendors.filter(v => v.contact.email && !excludedVendors.includes(v.id));
                            if (vendorsWithEmail.length === 0) {
                                alert('No vendors have email addresses to send to.');
                                return;
                            }
                            if (!mailSubject.trim()) {
                                alert('Please enter a subject.');
                                return;
                            }
                            if (!mailBody.trim()) {
                                alert('Please enter a message.');
                                return;
                            }

                            // Save email record and simulate sending
                            try {
                                // Save email records for each vendor
                                for (const vendor of vendorsWithEmail) {
                                    await contactService.saveEmailSent({
                                        vendorId: vendor.id,
                                        vendorName: vendor.name,
                                        vendorEmail: vendor.contact.email,
                                        subject: mailSubject,
                                        body: mailBody,
                                        sentBy: 'User', // You can get this from auth context
                                        recipients: vendorsWithEmail.map(v => v.contact.email)
                                    });
                                }

                                const emailList = vendorsWithEmail.map(v => v.contact.email).join(', ');
                                console.log('Sending email to:', emailList);
                                console.log('Subject:', mailSubject);
                                console.log('Body:', mailBody);

                                alert(`Email sent successfully to ${vendorsWithEmail.length} vendor(s).\n\nRecipients: ${emailList}\n\nSubject: ${mailSubject}\n\nYou can view responses in the vendor details.`);

                                // Close modal after sending
                                setShowMailModal(false);
                                setMailSubject('');
                                setMailBody('');
                                setExcludedVendors([]);
                            } catch (error) {
                                console.error('Error sending email:', error);
                                alert('Error sending email. Please try again.');
                            }
                        }}
                    >
                        <Send size={18} />
                        Send Email
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ───── MODAL: VIEW RESPONSES ───── */}
            <Modal
                show={showResponseModal}
                onHide={() => setShowResponseModal(false)}
                centered
                size="lg"
                className="vendor-response-modal"
            >
                <Modal.Header className="border-0 pb-2">
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Reply size={20} className="text-primary" />
                        <span className="fw-bold">Vendor Responses</span>
                        {selectedVendor && (
                            <Badge bg="secondary" className="ms-2">{selectedVendor.name}</Badge>
                        )}
                    </Modal.Title>
                    <button className="btn-close" onClick={() => setShowResponseModal(false)}></button>
                </Modal.Header>
                <Modal.Body className="pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {selectedVendor && vendorResponses[selectedVendor.id] && vendorResponses[selectedVendor.id].length > 0 ? (
                        <div className="d-flex flex-column gap-3">
                            {vendorResponses[selectedVendor.id].map((response, index) => (
                                <div key={response.id || index} className="response-card" style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    borderLeft: '4px solid #6366f1',
                                    transition: 'all 0.2s'
                                }}>
                                    <div className="d-flex align-items-start justify-content-between mb-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                                                <Mail size={18} className="text-primary" />
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark mb-1">{response.subject || 'Email Response'}</div>
                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                    {response.createdAt ? new Date(response.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : 'Recently'}
                                                </div>
                                            </div>
                                        </div>
                                        {response.status && (
                                            <Badge bg={response.status === 'replied' ? 'success' : response.status === 'read' ? 'info' : 'secondary'}>
                                                {response.status}
                                            </Badge>
                                        )}
                                    </div>
                                    {response.message && (
                                        <div className="text-secondary mt-3" style={{ fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                            {response.message}
                                        </div>
                                    )}
                                    {response.body && !response.message && (
                                        <div className="text-secondary mt-3" style={{ fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                            {response.body}
                                        </div>
                                    )}
                                    {response.vendorEmail && (
                                        <div className="mt-3 pt-3 border-top">
                                            <div className="text-muted small">
                                                <Mail size={12} className="me-1" />
                                                From: {response.vendorEmail}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <Mail size={48} className="text-muted mb-3" style={{ opacity: 0.3 }} />
                            <p className="text-muted fw-semibold mb-1">No responses yet</p>
                            <p className="text-muted small">Responses from this vendor will appear here</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="secondary" onClick={() => setShowResponseModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
        </div>
    );
}
