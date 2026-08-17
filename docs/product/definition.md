# Argent product definition

Argent is a lightweight balance journal for mobile. It opens to history and visualization because reviewing money is expected to be more common than reporting it.

## Identity

An account is identified by a 12-emoji sequence selected from a fixed 8-by-12 board. The sequence is encoded to a stable identifier and stored locally after first use so the returning device enters automatically. An unknown identifier creates an account.

## Money

Amounts support negatives and at most two decimal places. Storage uses integer hundredths. Display uses three-digit commas and hides decimals when both decimal digits are zero.

Channel types and chart scopes are:

- Cash: cash channels.
- Total money: cash and savings channels.
- Net worth: cash, savings, and accrued channels.

Accrued values may be positive receivables or negative liabilities. Negative values are permitted for every channel type.

## Reporting

An entry is a dated balance snapshot for one channel. Dates are displayed as `YYYY/MM/DD`. Missing entries carry the most recent balance forward without creating synthetic records. Users may create, edit, or remove historical snapshots. Change is calculated against the prior explicit snapshot.

## Interface

The interface is mobile-first, monochrome, monoline, divider-based, and uses chamfered geometry instead of rounded cards. Authored interface text is avoided. Material icons and emojis express controls and state. Visible text is limited to user-entered channel names and notes, dates, and numbers unless explicitly approved later.

The browser page disables global zoom, selection, context menus, and tap highlighting. The chart supports tap inspection, dragging, and pinch zoom. The frontend is prepared as a PWA for later webview packaging.

## Technical shape

React and Vite provide the frontend. Express provides the API. SQLite is the single-file store in WAL mode. Accounts, channels, and entries form the core data model. Production makes at most one dated SQLite backup per day.
