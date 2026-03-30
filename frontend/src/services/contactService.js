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

    addColumn: async (columnData) => {
        return await apiClient.post('/contacts/columns/add', columnData);
    },

    updateColumn: async (colId, updates) => {
        return await apiClient.put(`/contacts/columns/${colId}`, updates);
    },

    deleteColumn: async (colId) => {
        await apiClient.delete(`/contacts/columns/${colId}`);
        return colId;
    },

    reorderColumns: async (orderedColIds) => {
        return await apiClient.post('/contacts/columns/reorder', { orderedColIds });
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
