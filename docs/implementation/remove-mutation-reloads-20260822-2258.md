# Remove mutation reloads

Account entry now creates or opens the account and returns its initial state in one request. Reporting, channel changes, deletion, and dated closure dismiss their sheets immediately, continue over the network, and merge the response into the affected local state instead of downloading the complete account again. Dated closure now returns its resulting channel and zero entry so the client can apply both precisely. Background mutation failures use the existing icon-only reload state.
