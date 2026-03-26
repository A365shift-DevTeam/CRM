import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';
import { Send, Bot, User, Sparkles, X, Filter, BarChart2, UserPlus } from 'lucide-react';

export const AIAssistModal = ({ show, onHide, contacts, onApplyFilters, onCreateContact }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! I can help you filter contacts, find insights, or add new people. Try "Show me active leads in New York".' }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (textOverride) => {
        const textToSend = typeof textOverride === 'string' ? textOverride : input;
        if (!textToSend.trim()) return;

        const userMsg = { role: 'user', text: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Simulate AI processing
        setTimeout(() => {
            processCommand(userMsg.text);
        }, 600);
    };

    const processCommand = (text) => {
        const lowerText = text.toLowerCase();
        let responseText = "I'm not sure I understood that. Try asking to 'Show active leads' or 'Count customers'.";

        // --- 1. Filter Commands ---
        if (lowerText.includes('show') || lowerText.includes('filter') || lowerText.includes('list') || lowerText.includes('find')) {
            const filters = {
                status: 'all',
                type: 'all',
                location: 'all',
                company: 'all'
            };
            let applied = [];

            // Status Parsing
            if (lowerText.includes('active')) { filters.status = 'Active'; applied.push('Status: Active'); }
            if (lowerText.includes('lead')) { filters.status = 'Lead'; applied.push('Status: Lead'); }
            if (lowerText.includes('customer')) { filters.status = 'Customer'; applied.push('Status: Customer'); }
            if (lowerText.includes('inactive')) { filters.status = 'Inactive'; applied.push('Status: Inactive'); }

            // Type Parsing
            if (lowerText.includes('company') || lowerText.includes('companies')) { filters.type = 'Company'; applied.push('Type: Company'); }
            if (lowerText.includes('person') || lowerText.includes('people') || lowerText.includes('individual')) { filters.type = 'Individual'; applied.push('Type: Individual'); }

            // Location Parsing (Simple keyword match)
            const locations = ['New York', 'San Francisco', 'London', 'Austin', 'Remote', 'Toronto', 'Berlin', 'Tokyo'];
            locations.forEach(loc => {
                if (lowerText.includes(loc.toLowerCase())) {
                    filters.location = loc; // In real app, might need more fuzzy matching or full match
                    applied.push(`Location: ${loc}`);
                }
            });

            // Apply
            if (applied.length > 0) {
                onApplyFilters(filters);
                responseText = `Sure! I've filtered the list for **${applied.join(', ')}**.`;
            } else {
                responseText = "I couldn't detect specific filters. Try mentioning a status (e.g., 'Active'), type, or location.";
            }
        }

        // --- 2. Count/Insight Commands ---
        else if (lowerText.includes('how many') || lowerText.includes('count') || lowerText.includes('stats')) {
            let count = contacts.length;
            let context = "total contacts";

            if (lowerText.includes('lead')) {
                count = contacts.filter(c => c.status === 'Lead').length;
                context = "leads";
            } else if (lowerText.includes('customer')) {
                count = contacts.filter(c => c.status === 'Customer').length;
                context = "customers";
            } else if (lowerText.includes('active')) {
                count = contacts.filter(c => c.status === 'Active').length;
                context = "active contacts";
            }

            responseText = `I found **${count}** ${context} in your database. 📊`;
        }

        // --- 3. Creation Commands ---
        else if (lowerText.includes('add') || lowerText.includes('create') || lowerText.includes('new contact')) {
            onCreateContact(); // Trigger the modal
            responseText = "Opening the 'Add Contact' form for you now. ✅";
        }

        setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered dialogClassName="ai-assist-modal">
            <Modal.Header closeButton style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}>
                <Modal.Title style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', color: '#0f172a' }}>
                    <div style={{ background: '#f0f9ff', padding: '8px', borderRadius: '10px', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={20} />
                    </div>
                    AI Assistant
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: 0 }}>
                {/* Chat Area */}
                <div className="ai-chat-history">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`ai-message ${msg.role}`}>
                            <div className="ai-avatar">
                                {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
                            </div>
                            <div className="ai-bubble">
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {messages.length === 1 && (
                        <div className="ai-suggestions">
                            <button className="ai-chip" onClick={() => handleSend("Show only active contacts")}>
                                <Filter size={14} /> Active Contacts
                            </button>
                            <button className="ai-chip" onClick={() => handleSend("Count my leads")}>
                                <BarChart2 size={14} /> Count Leads
                            </button>
                            <button className="ai-chip" onClick={() => { onCreateContact(); onHide(); }}>
                                <UserPlus size={14} /> Add New Contact
                            </button>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="ai-input-area">
                    <div className="ai-input-wrapper">
                        <input
                            type="text"
                            className="ai-input"
                            placeholder="Ask AI to filter or find contacts..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                        <button
                            className="ai-send-btn"
                            onClick={handleSend}
                            disabled={!input.trim()}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ display: 'block', minWidth: '18px' }}
                            >
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};
