import type { Drill } from '@/types'

export const DRILL_SEEDS: Drill[] = [
  // ─── Tee Shot / Driving ───────────────────────────────────────────────────
  {
    id: 'drive-01',
    name: 'Alignment Stick Driver',
    skillArea: 'teeShot',
    sessionType: 'driving',
    durationMinutes: 15,
    shotCount: 10,
    programSlugs: ['break100', 'break90', 'break80'],
    instructions:
      'Place two alignment sticks on the ground: one pointing at the target, one across your toes. Hit 10 drives focusing on staying aligned with your hips and shoulders.',
  },
  {
    id: 'drive-02',
    name: 'Fairway Finder Tempo Drill',
    skillArea: 'teeShot',
    sessionType: 'driving',
    durationMinutes: 15,
    shotCount: 10,
    programSlugs: ['break100', 'break90'],
    instructions:
      'Tee ball lower than normal. Swing at 75% speed. Goal: hit 7 of 10 into a fairway-width zone. Focus on balance through impact, not distance.',
  },
  {
    id: 'drive-03',
    name: 'Target Zone Challenge',
    skillArea: 'teeShot',
    sessionType: 'driving',
    durationMinutes: 18,
    shotCount: 12,
    programSlugs: ['break90', 'break80'],
    instructions:
      'Pick a 30-yard wide landing zone. Hit 12 drives. Track how many land in zone. Aim for 8/12 (67%). Reset mental target each shot.',
  },
  {
    id: 'drive-04',
    name: 'Tee Height Awareness',
    skillArea: 'teeShot',
    sessionType: 'driving',
    durationMinutes: 18,
    shotCount: 12,
    programSlugs: ['break100'],
    instructions:
      'Hit balls with low, medium, and high tee heights. Notice ball flight changes. Identify which height produces your most consistent contact.',
  },
  {
    id: 'drive-05',
    name: 'Pre-Shot Routine Builder',
    skillArea: 'teeShot',
    sessionType: 'driving',
    durationMinutes: 18,
    shotCount: 12,
    programSlugs: ['break80'],
    instructions:
      'Build a consistent pre-shot routine: practice swing, visualize shot, step in, look at target, go. Hit 12 drives using the exact same routine for each.',
  },

  // ─── Irons ────────────────────────────────────────────────────────────────
  {
    id: 'iron-01',
    name: 'Divot Board Drill',
    skillArea: 'irons',
    sessionType: 'irons',
    durationMinutes: 20,
    shotCount: 16,
    programSlugs: ['break100', 'break90', 'break80'],
    instructions:
      'Place towel just behind ball position. Hit 16 iron shots ensuring no contact with towel. Promotes ball-first contact. Move down one club if struggling.',
  },
  {
    id: 'iron-02',
    name: '7-Iron to Green Game',
    skillArea: 'irons',
    sessionType: 'irons',
    durationMinutes: 15,
    shotCount: 12,
    programSlugs: ['break100', 'break90'],
    instructions:
      'Pick a target at your 7-iron distance. Hit 12 shots. Track how many land within 20 yards of target. Focus on solid contact before worrying about distance control.',
  },
  {
    id: 'iron-03',
    name: 'Stock Shot Groover',
    skillArea: 'irons',
    sessionType: 'irons',
    durationMinutes: 25,
    shotCount: 20,
    programSlugs: ['break90', 'break80'],
    instructions:
      'Choose your most comfortable mid-iron (6 or 7). Hit 20 balls at the same target. Build a repeatable stock swing: same grip, stance, tempo every time. This becomes your bread-and-butter.',
  },
  {
    id: 'iron-04',
    name: 'Ladder Distance Control',
    skillArea: 'irons',
    sessionType: 'irons',
    durationMinutes: 15,
    shotCount: 12,
    programSlugs: ['break80'],
    instructions:
      'Set targets at 80, 100, 120, and 140 yards. Hit 3 balls at each distance, working up then back down the "ladder." Focus on distance control, not trajectory. 12 total shots.',
  },
  {
    id: 'iron-05',
    name: 'Half Swing Contact Drill',
    skillArea: 'irons',
    sessionType: 'irons',
    durationMinutes: 15,
    shotCount: 12,
    programSlugs: ['break100'],
    instructions:
      'Swing to hip height only (half backswing, half follow-through). Hit 12 balls. Goal is pure contact and center of the face. Full swings after: carry the same feeling.',
  },

  // ─── Short Game ───────────────────────────────────────────────────────────
  {
    id: 'short-01',
    name: 'Up-and-Down Challenge',
    skillArea: 'shortGame',
    sessionType: 'short_game',
    durationMinutes: 20,
    shotCount: 20,
    programSlugs: ['break100', 'break90', 'break80'],
    instructions:
      'From 10 different spots around the green, chip and putt. Count how many times you get up-and-down in 2. Target: 4/10 for break100, 6/10 for break90, 7/10 for break80.',
  },
  {
    id: 'short-02',
    name: 'Bump-and-Run Basics',
    skillArea: 'shortGame',
    sessionType: 'short_game',
    durationMinutes: 15,
    shotCount: 15,
    programSlugs: ['break100', 'break90'],
    instructions:
      'Use an 8-iron or 9-iron to bump the ball along the ground from just off the green. Hit 15 shots from 5–15 yards. Keep the ball low and rolling. Simpler than a chip — default to this when in doubt.',
  },
  {
    id: 'short-03',
    name: 'Pitch Shot Ladder',
    skillArea: 'shortGame',
    sessionType: 'short_game',
    durationMinutes: 12,
    shotCount: 12,
    programSlugs: ['break90', 'break80'],
    instructions:
      'Set targets at 20, 30, 40, and 50 yards. Hit 3 shots to each. Focus on landing zone, not total distance. Use a consistent swing size for each distance — length controls distance, not effort.',
  },
  {
    id: 'short-04',
    name: 'Sand Splash Drill',
    skillArea: 'shortGame',
    sessionType: 'short_game',
    durationMinutes: 10,
    shotCount: 10,
    programSlugs: ['break90', 'break80'],
    instructions:
      'In a bunker, draw a line in the sand 2 inches behind the ball. Hit 10 bunker shots, focusing on entering the sand at that line. Open clubface, open stance, accelerate through.',
  },
  {
    id: 'short-05',
    name: 'Chip to Hula Hoop',
    skillArea: 'shortGame',
    sessionType: 'short_game',
    durationMinutes: 20,
    shotCount: 20,
    programSlugs: ['break100'],
    instructions:
      'Place a hula hoop (or mark a 4-foot circle) as your landing zone. Chip 20 balls from just off the green, aiming to land in the zone. Builds consistent landing spot control.',
  },

  // ─── Putting ─────────────────────────────────────────────────────────────
  {
    id: 'putt-01',
    name: 'Gate Putting Drill',
    skillArea: 'putting',
    sessionType: 'putting',
    durationMinutes: 15,
    shotCount: 20,
    programSlugs: ['break100', 'break90', 'break80'],
    instructions:
      'Place two tees just wider than your putter head at the ball, creating a gate. Putt through the gate from 6 feet. 20 putts. If putter hits a tee, restart count. Build face awareness and path.',
  },
  {
    id: 'putt-02',
    name: 'Clock Drill',
    skillArea: 'putting',
    sessionType: 'putting',
    durationMinutes: 15,
    shotCount: 20,
    programSlugs: ['break100', 'break90', 'break80'],
    instructions:
      'Place 8 balls in a circle 3 feet from the hole. Make all 8 without missing. If you miss, restart. Attempt 20 putts total (including restarts). Once you clear 3 feet, move to 4 feet. Track your longest streak.',
  },
  {
    id: 'putt-03',
    name: 'Lag Putting — 3-Zone Challenge',
    skillArea: 'putting',
    sessionType: 'putting',
    durationMinutes: 15,
    shotCount: 20,
    programSlugs: ['break100', 'break90'],
    instructions:
      'From 20, 30, 40, and 50 feet, hit 5 putts each. Goal: stop the ball within 3 feet of the cup (a circle of tees). 20 putts total. Track percentage. Focus on pace and end result, not aiming for the hole.',
  },
  {
    id: 'putt-04',
    name: 'Break Reading Routine',
    skillArea: 'putting',
    sessionType: 'putting',
    durationMinutes: 15,
    shotCount: 20,
    programSlugs: ['break90', 'break80'],
    instructions:
      'Choose 10 putts with visible break (10–20 feet). For each: read the break, pick an aim point, then execute. 20 putts total (10 reads × 2 attempts each). After each pair, assess whether your aim point was right. Builds green reading and pre-shot routine.',
  },
  {
    id: 'putt-05',
    name: 'One-Hand Stroke Builder',
    skillArea: 'putting',
    sessionType: 'putting',
    durationMinutes: 15,
    shotCount: 20,
    programSlugs: ['break80'],
    instructions:
      'Putt 7 balls from 5 feet using your lead hand only. Then 7 with trail hand only. Then 6 normal. 20 putts total. Isolates stroke mechanics and face control. Compare feel across all three.',
  },

  // ─── Course Management ─────────────────────────────────────────────────────
  {
    id: 'mgmt-01',
    name: 'Penalty-Free Round Simulation',
    skillArea: 'courseMgmt',
    sessionType: 'mixed',
    durationMinutes: 15,
    shotCount: 10,
    programSlugs: ['break100', 'break90', 'break80'],
    instructions:
      'On the range, simulate 10 tee shots. For each, pick a realistic target (not maximum distance). Give yourself a 1-stroke penalty any time your simulated shot goes out of bounds. Focus on keeping ball in play over hitting it far.',
  },
  {
    id: 'mgmt-02',
    name: 'Club Selection Decision Drill',
    skillArea: 'courseMgmt',
    sessionType: 'mixed',
    durationMinutes: 15,
    shotCount: 10,
    programSlugs: ['break100', 'break90'],
    instructions:
      'For 10 range shots, set a scenario: "150 yards, tight lie, wind into." Pick the club that guarantees the ball gets to the green — even if it\'s more club than you think you need. Practice conservative selection.',
  },
  {
    id: 'mgmt-03',
    name: 'Miss Direction Planning',
    skillArea: 'courseMgmt',
    sessionType: 'mixed',
    durationMinutes: 15,
    shotCount: 10,
    programSlugs: ['break90', 'break80'],
    instructions:
      'For each of 10 range targets, identify where a miss is "safe" vs "dead." Aim toward the safe miss side. Track whether you can intentionally miss the right way 7/10 times. Teaches strategic shot-shaping mindset.',
  },
  {
    id: 'mgmt-04',
    name: 'Scoring Zone Focus',
    skillArea: 'courseMgmt',
    sessionType: 'mixed',
    durationMinutes: 30,
    shotCount: 20,
    programSlugs: ['break80'],
    instructions:
      'Spend 30 minutes hitting 20 shots only from 100 yards and in. These are your "scoring opportunities." Practice different lies, angles, and trajectories. Track attempts vs. results within 10 feet.',
  },
  {
    id: 'mgmt-05',
    name: 'Risk/Reward Card',
    skillArea: 'courseMgmt',
    sessionType: 'mixed',
    durationMinutes: 15,
    shotCount: 10,
    programSlugs: ['break100'],
    instructions:
      '"What is the worst outcome if I miss this shot?" If the answer is a lost ball or OB, take a safer club. Practice tee shots with 3-wood or hybrid.',
  },
]
