import api from './axios'

export const callApi = {
  getResults:         ()           => api.get('/api/calls/results'),
  createCallLog:      data         => api.post('/api/calls', data),
  getCallsByLead:     leadId       => api.get(`/api/calls/lead/${leadId}`),
  getMyCalls:         params       => api.get('/api/calls/my', { params }),
  createFollowUp:     data         => api.post('/api/follow-ups', data),
  getMyFollowUps:     ()           => api.get('/api/follow-ups/my'),
  getFollowUpsByLead: leadId       => api.get(`/api/follow-ups/lead/${leadId}`),
  updateFollowUp:     (id, status) => api.patch(`/api/follow-ups/${id}/status`, null, { params: { status } }),
}
