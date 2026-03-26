import { apiClient } from './apiClient';

export const contactService = {
    getContacts: async () => {
        return await apiClient.get('/contacts');
    },

    createContact: async (contactData) => {
        return await apiClient.post('/contacts', contactData);
    },

    updateContact: async (id, updates) => {
        return await apiClient.put(`/contacts/${id}`, updates);
    },

    deleteContact: async (id) => {
        await apiClient.delete(`/contacts/${id}`);
        return id;
    },

    getColumns: async () => {
        return await apiClient.get('/contacts/columns');
    },

    saveColumns: async (columns) => {
        return await apiClient.post('/contacts/columns', { columns });
    },

    getVendors: async () => {
        return await apiClient.get('/contacts/vendors');
    },

    getVendorResponses: async (vendorId) => {
        return await apiClient.get(`/contacts/${vendorId}/responses`);
    },

    createVendorResponse: async (responseData) => {
        return await apiClient.post('/contacts/responses', responseData);
    },

    saveEmailSent: async (emailData) => {
        return await apiClient.post('/contacts/emails', emailData);
    }
};
