import { apiClient } from './apiClient';

export const calendarService = {
    getEvents: (month, year) => apiClient.get(`/calendar?month=${month}&year=${year}`),
};
