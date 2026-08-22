const request = async (url, options) => {
  const response = await fetch(url, {
    ...options,
    headers: options?.body ? { 'Content-Type': 'application/json', ...options.headers } : options?.headers
  })
  if (!response.ok) throw new Error(String(response.status))
  return response.status === 204 ? null : response.json()
}

export const api = {
  enter: id => request(`/api/accounts/${id}`, { method: 'PUT' }),
  createChannel: (id, channel) => request(`/api/accounts/${id}/channels`, { method: 'POST', body: JSON.stringify(channel) }),
  updateChannel: (id, channelId, channel) => request(`/api/accounts/${id}/channels/${channelId}`, { method: 'PATCH', body: JSON.stringify(channel) }),
  deleteChannel: (id, channelId) => request(`/api/accounts/${id}/channels/${channelId}`, { method: 'DELETE' }),
  closeChannel: (id, channelId, date) => request(`/api/accounts/${id}/channels/${channelId}/close`, { method: 'PUT', body: JSON.stringify({ date }) }),
  saveEntry: (id, entry) => request(`/api/accounts/${id}/entries`, { method: 'PUT', body: JSON.stringify(entry) }),
  deleteEntry: (id, entryId) => request(`/api/accounts/${id}/entries/${entryId}`, { method: 'DELETE' })
}
