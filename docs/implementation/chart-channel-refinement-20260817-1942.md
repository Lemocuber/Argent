# Chart and channel refinement — 2026/08/17

Refined Argent for landscape use by centering the full interface in a responsive mobile-sized frame. The frame occupies 90% of the viewport height, derives its width from that height while retaining a practical minimum on short devices, and has a subtle rounded outer edge. Its entire interface is rendered at 1.5× scale so typography, icons, controls, spacing, and chart details grow consistently. Rebuilt bordered controls so their lines follow the chamfered corners instead of being visibly clipped.

Changed the balance graph to straight segments and introduced a dedicated date rail for pinch zoom, wheel zoom, and drag navigation without competing with vertical pointer inspection. Enlarged node details and separated dates, balances, changes, channel names, and notes onto readable lines.

Removed emoji from money channels and their storage schema, increased channel-name prominence, made blank and amount areas open balance entry, and made the type-and-name region open channel editing. Added permanent channel deletion with two icon-only confirmation stages and verified cascading snapshot removal. Established that Argent will not preserve backward or forward compatibility.

Corrected the segmented controls by nesting their active areas inside independently chamfered border shells, preventing active fills from clipping the diagonal stroke.

Removed the chart pointer's horizontal line and stabilized channel rows by reserving the same delta-line height for unreported and confirmed balances.

Expanded chart data into one carried-forward point per calendar day from the first relevant balance through today, preserving future-dated records when present. Unchanged days now retain their own visible and inspectable dots instead of collapsing into a single line segment.

Expanded graph details to list every channel whose balance changed on the selected day, as well as unchanged channels carrying a note. Each channel title now includes its signed balance change inline, with any user note shown beneath it.

Moved the selected day's aggregate signed change inline with its large balance total.

Vertically centered aggregate and per-channel changes against their adjacent values, and corrected the detail hierarchy so channel titles are larger than note text.

Raised the detail date to the same size as note text so it no longer sits at the bottom of the card's primary type hierarchy.

Kept graph dots at their normal size while focused, without changing pointer inspection or the selected-day details.

Inset the main balance slightly from its right edge so tightly spaced digits no longer clip.

Moved channel creation out of the record-page header and into a permanent final row in the channel list, including when the list is empty.
