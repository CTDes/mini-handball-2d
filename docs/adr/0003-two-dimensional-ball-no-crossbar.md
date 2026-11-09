# The ball has no height: posts only, no crossbar

The game design document mentions shots "below the crossbar" and rebounds off the "crossbar",
which assume a vertical dimension. The game is top-down and the MVP keeps the ball strictly
two-dimensional: a goal is a ball that fully crosses the goal line between the posts, and the
only rebounds are off the two posts. A height coordinate would add a third axis to every
collision and to the goalkeeper's AI for little visible gain in a top-down view. If spin or lobs
ever need height (phase 2 or later), it is a new decision, not a bug in this one.
