# Local channel ordering

Added a long-press sorting mode to the record tab's add-channel row. In this mode channel rows become draggable, reorder around the active item, and return to the normal record interaction through the icon-only completion control.

Kept the add-channel row inside the record page's day-swipe gesture area without letting the parent take its pointer capture. Normal finger drift is tolerated, deliberate movement cancels the pending long-press while continuing the swipe, and the plus icon remains visually still during a hold. Click suppression now expires with the originating release so the sorting completion control responds on its first tap.

Saved intentional order changes in browser storage, scoped to the current account. Saved channel identifiers reconcile with channels added or removed on other clients; malformed or unrelated settings are cleared and server order is restored. The hidden navigation reset now clears the channel order as well as the saved login.

Anchored active sort-drag pointer capture to the stationary channel list instead of the row being moved. Reordering the row no longer interrupts the pointer stream, allowing one drag to cross any number of items in either direction.
