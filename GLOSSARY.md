# Mini Handball 2D

The language of a top-down arcade handball game: one attacker shooting at a goal defended by a
goalkeeper and a defender. One context for the whole repository.

## Language

### Pitch

**Pitch**:
The half court the game is played on: a rectangle with one goal at the top edge.
_Avoid_: field, court, arena

**Goal**:
The target between the two posts on the goal line. Also the outcome of a shot that enters it.
_Avoid_: net, cage

**Goal line**:
The segment of the pitch's top edge between the two posts. A ball that fully crosses it is a goal.
_Avoid_: end line, baseline

**Post**:
One of the two solid obstacles at the ends of the goal line. The ball rebounds off them elastically.
_Avoid_: pole, bar, crossbar (there is no crossbar: the game has no height)

**Goal area**:
The elliptical zone in front of the goal, bounded by the 6-metre line, that the attacker may never enter.
_Avoid_: 6-metre zone, crease, box, exclusion zone

**Free-throw line**:
The 9-metre arc in front of the goal area along which the defender covers.
_Avoid_: 9-metre line, defensive line

**Danger zone**:
The region near the goal where the goalkeeper starts reacting to the ball's trajectory instead of just shadowing it.
_Avoid_: reaction zone, hot zone

### Actors

**Attacker**:
The player-controlled character. It always holds the ball while no shot is in flight.
_Avoid_: player (ambiguous with the human), striker, shooter

**Goalkeeper**:
The AI character that moves laterally along the goal line and tries to touch the ball.
_Avoid_: keeper, goalie, GK

**Defender**:
The AI character that covers horizontally around the free-throw line and tries to touch the ball.
_Avoid_: blocker, guard

**Ball**:
The single projectile. It is held by the attacker or in flight after a shot.

### Shooting

**Aim line**:
The dashed guide from the attacker to the cursor that shows the shot's direction, ending in a reticle.
_Avoid_: laser, guide line, trajectory

**Power bar**:
The 0–100 % gauge that oscillates while the shoot control is held. Its value at release is the shot's power.
_Avoid_: charge bar, meter

**Shot**:
The release of the ball from the attacker along the aim line at a speed proportional to the power.
_Avoid_: throw, launch, kick

**Play**:
One cycle from the attacker holding the ball to the outcome of the shot and the ball's return.
_Avoid_: round, turn, rally, attempt

### Outcomes

**Outcome**:
How a play ends: goal, save, block or out. A post rebound is an event within a play, not an outcome.
_Avoid_: result, resolution

**Save**:
The outcome when the goalkeeper touches the ball.
_Avoid_: stop, parry

**Block**:
The outcome when the defender touches the ball.
_Avoid_: interception, deflection

**Out**:
The outcome when the ball leaves the pitch without crossing the goal line.
_Avoid_: miss, wide

**Post hit**:
The ball colliding with a post and rebounding. The ball stays live.
_Avoid_: woodwork

### Scoring and feedback

**Scoreboard**:
The panel showing goals, shots and effectiveness for the current session.
_Avoid_: HUD, stats panel

**Effectiveness**:
Goals divided by shots, as a percentage. Zero when there are no shots.
_Avoid_: accuracy, conversion rate, success rate

**Overlay**:
A short animated message shown over the pitch when a play ends or the ball hits a post.
_Avoid_: toast, banner, popup

### Engine

**Simulation**:
The pure, deterministic model of the game: pitch, actors, ball, rules and AI. It knows nothing about screens, input devices or sound.
_Avoid_: engine, core, model, physics (physics is one part of it)

**Tick**:
One fixed step of the simulation, 1/60 s of game time.
_Avoid_: frame (a frame is a render, not a step), update

**Intent**:
What the human asks for in a tick: movement direction, aim point, whether the shoot control is held.
_Avoid_: input, command, action

**Adapter**:
Code that connects the simulation to the outside: input devices, canvas rendering, audio, the DOM.
_Avoid_: view, controller, driver

**Tuning**:
The named numeric constants that shape the game's feel: speeds, sizes, reaction times, oscillation rate.
_Avoid_: config, settings, balance
