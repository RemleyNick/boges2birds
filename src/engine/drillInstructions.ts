/**
 * Minimal drill shape needed by resolveInstructions.
 * Looser than the full Drill type so it works with DB-returned objects
 * where skillArea/sessionType are plain strings.
 */
interface DrillLike {
  id: string
  shotCount: number | null
  instructions: string
}

// Each template takes a shot count and returns instruction text with correct numbers.
// Drill complexity classes:
//   Simple     — interpolate n directly
//   Ratio      — compute target = Math.round(n * ratio)
//   Sub-group  — compute perGroup = Math.max(1, Math.floor(n / groups))
//   Special    — custom split logic

const DRILL_TEMPLATES: Record<string, (n: number) => string> = {
  // ─── Driving (Simple) ───────────────────────────────────────────────────
  'drive-01': (n) =>
    `Place two alignment sticks on the ground: one pointing at the target, one across your toes. Hit ${n} drives focusing on staying aligned with your hips and shoulders.`,

  // ─── Driving (Ratio: 70%) ──────────────────────────────────────────────
  'drive-02': (n) => {
    const target = Math.round(n * 0.7)
    return `Tee ball lower than normal. Swing at 75% speed. Goal: hit ${target} of ${n} into a fairway-width zone. Focus on balance through impact, not distance.`
  },

  // ─── Driving (Ratio: 67%) ──────────────────────────────────────────────
  'drive-03': (n) => {
    const target = Math.round(n * 0.67)
    return `Pick a 30-yard wide landing zone. Hit ${n} drives. Track how many land in zone. Aim for ${target}/${n} (67%). Reset mental target each shot.`
  },

  // ─── Driving (Sub-group: 3 tee heights) ────────────────────────────────
  'drive-04': (n) => {
    const perGroup = Math.max(1, Math.floor(n / 3))
    return `Hit ${n} balls with low, medium, and high tee heights. Notice ball flight changes. Identify which height produces your most consistent contact.`
  },

  // ─── Driving (Simple) ──────────────────────────────────────────────────
  'drive-05': (n) =>
    `Build a consistent pre-shot routine: practice swing, visualize shot, step in, look at target, go. Hit ${n} drives using the exact same routine for each.`,

  // ─── Irons (Simple) ────────────────────────────────────────────────────
  'iron-01': (n) =>
    `Place towel just behind ball position. Hit ${n} iron shots ensuring no contact with towel. Promotes ball-first contact. Move down one club if struggling.`,

  'iron-02': (n) =>
    `Pick a target at your 7-iron distance. Hit ${n} shots. Track how many land within 20 yards of target. Focus on solid contact before worrying about distance control.`,

  'iron-03': (n) =>
    `Choose your most comfortable mid-iron (6 or 7). Hit ${n} balls at the same target. Build a repeatable stock swing: same grip, stance, tempo every time. This becomes your bread-and-butter.`,

  // ─── Irons (Sub-group: 4 distances) ────────────────────────────────────
  'iron-04': (n) => {
    const perGroup = Math.max(1, Math.floor(n / 4))
    return `Set targets at 80, 100, 120, and 140 yards. Hit ${perGroup} balls at each distance, working up then back down the "ladder." Focus on distance control, not trajectory. ${n} total shots.`
  },

  // ─── Irons (Simple) ────────────────────────────────────────────────────
  'iron-05': (n) =>
    `Swing to hip height only (half backswing, half follow-through). Hit ${n} balls. Goal is pure contact and center of the face. Full swings after: carry the same feeling.`,

  // ─── Short Game (Sub-group: n/2 spots) ─────────────────────────────────
  'short-01': (n) => {
    const spots = Math.max(1, Math.floor(n / 2))
    return `From ${spots} different spots around the green, chip and putt. Count how many times you get up-and-down in 2. Target: 4/10 for break100, 6/10 for break90, 7/10 for break80.`
  },

  // ─── Short Game (Simple) ───────────────────────────────────────────────
  'short-02': (n) =>
    `Use an 8-iron or 9-iron to bump the ball along the ground from just off the green. Hit ${n} shots from 5–15 yards. Keep the ball low and rolling. Simpler than a chip — default to this when in doubt.`,

  // ─── Short Game (Sub-group: 4 targets) ─────────────────────────────────
  'short-03': (n) => {
    const perTarget = Math.max(1, Math.floor(n / 4))
    return `Set targets at 20, 30, 40, and 50 yards. Hit ${perTarget} shots to each. Focus on landing zone, not total distance. Use a consistent swing size for each distance — length controls distance, not effort.`
  },

  // ─── Short Game (Simple) ───────────────────────────────────────────────
  'short-04': (n) =>
    `In a bunker, draw a line in the sand 2 inches behind the ball. Hit ${n} bunker shots, focusing on entering the sand at that line. Open clubface, open stance, accelerate through.`,

  'short-05': (n) =>
    `Place a hula hoop (or mark a 4-foot circle) as your landing zone. Chip ${n} balls from just off the green, aiming to land in the zone. Builds consistent landing spot control.`,

  // ─── Putting (Simple) ──────────────────────────────────────────────────
  'putt-01': (n) =>
    `Place two tees just wider than your putter head at the ball, creating a gate. Putt through the gate from 6 feet. ${n} putts. If putter hits a tee, restart count. Build face awareness and path.`,

  'putt-02': (n) =>
    `Place 8 balls in a circle 3 feet from the hole. Make all 8 without missing. If you miss, restart. Attempt ${n} putts total (including restarts). Once you clear 3 feet, move to 4 feet. Track your longest streak.`,

  // ─── Putting (Sub-group: 4 distances) ──────────────────────────────────
  'putt-03': (n) => {
    const perDist = Math.max(1, Math.floor(n / 4))
    return `From 20, 30, 40, and 50 feet, hit ${perDist} putts each. Goal: stop the ball within 3 feet of the cup (a circle of tees). ${n} putts total. Track percentage. Focus on pace and end result, not aiming for the hole.`
  },

  // ─── Putting (Special: n/2 reads × 2 attempts) ────────────────────────
  'putt-04': (n) => {
    const reads = Math.max(1, Math.floor(n / 2))
    return `Choose ${reads} putts with visible break (10–20 feet). For each: read the break, pick an aim point, then execute. ${n} putts total (${reads} reads × 2 attempts each). After each pair, assess whether your aim point was right. Builds green reading and pre-shot routine.`
  },

  // ─── Putting (Special: thirds split) ──────────────────────────────────
  'putt-05': (n) => {
    const third = Math.max(1, Math.floor(n / 3))
    const remainder = n - third * 2
    return `Putt ${third} balls from 5 feet using your lead hand only. Then ${third} with trail hand only. Then ${remainder} normal. ${n} putts total. Isolates stroke mechanics and face control. Compare feel across all three.`
  },

  // ─── Course Management (Simple) ────────────────────────────────────────
  'mgmt-01': (n) =>
    `On the range, simulate ${n} tee shots. For each, pick a realistic target (not maximum distance). Give yourself a 1-stroke penalty any time your simulated shot goes out of bounds. Focus on keeping ball in play over hitting it far.`,

  'mgmt-02': (n) =>
    `For ${n} range shots, set a scenario: "150 yards, tight lie, wind into." Pick the club that guarantees the ball gets to the green — even if it's more club than you think you need. Practice conservative selection.`,

  // ─── Course Management (Ratio: 70%) ────────────────────────────────────
  'mgmt-03': (n) => {
    const target = Math.round(n * 0.7)
    return `For each of ${n} range targets, identify where a miss is "safe" vs "dead." Aim toward the safe miss side. Track whether you can intentionally miss the right way ${target}/${n} times. Teaches strategic shot-shaping mindset.`
  },

  // ─── Course Management (Simple) ────────────────────────────────────────
  'mgmt-04': (n) =>
    `Spend 30 minutes hitting ${n} shots only from 100 yards and in. These are your "scoring opportunities." Practice different lies, angles, and trajectories. Track attempts vs. results within 10 feet.`,

  'mgmt-05': (n) =>
    `For ${n} shots, ask: "What is the worst outcome if I miss this shot?" If the answer is a lost ball or OB, take a safer club. Practice tee shots with 3-wood or hybrid.`,
}

/**
 * Returns instruction text with shot counts adjusted for any override.
 * Falls back to the drill's original instructions if no template exists
 * or the count hasn't changed.
 */
export function resolveInstructions(
  drill: DrillLike,
  shotCountOverride: number | null,
): string {
  const effectiveShots = shotCountOverride ?? drill.shotCount
  if (effectiveShots == null || effectiveShots === drill.shotCount) return drill.instructions
  const template = DRILL_TEMPLATES[drill.id]
  if (!template) return drill.instructions
  return template(effectiveShots)
}
