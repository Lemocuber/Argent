# Chart mode animation

Separated the graph into an immediate line-and-area layer and an animated point layer. Switching scope replaces only the points so they draw in as they do when entering the chart tab, while the connecting line appears without a drawing animation. Timeline range updates do not restart the point animation.
