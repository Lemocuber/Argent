# Record day swipe — 2026/08/17

Added left and right swipe navigation between adjacent days on the record page. The channel list follows the finger to reveal the neighboring day while the date header remains fixed, then completes the transition or returns to place based on the swipe distance. Kept vertical list scrolling intact, required a clearly horizontal gesture, and prevented a completed swipe from accidentally opening the channel row beneath it.
