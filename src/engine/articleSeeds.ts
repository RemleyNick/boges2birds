import type { Article } from '@/types'

export const ARTICLE_SEEDS: Article[] = [
  // ─── Course Management ──────────────────────────────────────────────────────
  {
    id: 'article-cm-01',
    title: 'Aim for the Center of the Green',
    body: 'Most amateurs short-side themselves by chasing tucked pins. Aiming for the middle of the green gives you the largest margin for error and almost always leaves a manageable two-putt. Over 18 holes, this one habit can save 3-5 strokes.',
    category: 'courseManagement',
  },
  {
    id: 'article-cm-02',
    title: 'Penalty Avoidance Wins Rounds',
    body: 'A single penalty stroke costs you more than a slightly shorter drive. When water or OB is in play, take the club that keeps the ball in the fairway — even if it means laying back 20 yards. Eliminating penalties is the fastest path to lower scores.',
    category: 'courseManagement',
  },
  {
    id: 'article-cm-03',
    title: 'The Smart Layup',
    body: 'Laying up is not giving up — it is choosing your next shot. Pick a yardage you are comfortable with (your favorite wedge distance) and play to it deliberately. A confident 80-yard approach beats a heroic 220-yard gamble almost every time.',
    category: 'courseManagement',
  },
  {
    id: 'article-cm-04',
    title: 'Par-3 Strategy: Pick the Safe Side',
    body: 'On par 3s, identify where the trouble is — bunkers, water, slopes — and aim away from it. If the pin is left and a bunker guards left, aim center-right. Making bogey from the middle of the green is rare; making double from a bunker is not.',
    category: 'courseManagement',
  },

  // ─── Mindset ────────────────────────────────────────────────────────────────
  {
    id: 'article-mind-01',
    title: 'Why a Pre-Shot Routine Matters',
    body: 'A consistent pre-shot routine quiets your mind and gives your body a familiar trigger. It does not need to be complicated — one practice swing, a deep breath, and a target pick is enough. The key is doing the same thing every single time.',
    category: 'mindset',
  },
  {
    id: 'article-mind-02',
    title: 'Bouncing Back from a Bad Hole',
    body: 'Every golfer makes a double or worse. The difference between good rounds and bad rounds is what happens on the next hole. Take a deep breath on the next tee, commit to a conservative target, and focus on making a solid swing. One bad hole does not define a round.',
    category: 'mindset',
  },
  {
    id: 'article-mind-03',
    title: 'Process Over Outcome',
    body: 'You cannot control where the ball lands, but you can control your setup, your tempo, and your commitment. Focus on executing your process for each shot rather than fixating on the result. Good processes produce good outcomes over time.',
    category: 'mindset',
  },
  {
    id: 'article-mind-04',
    title: 'Play Your Game, Not Theirs',
    body: 'Watching your playing partner bomb a drive 280 yards can tempt you to swing harder. Resist the urge. Play the game your skills support — the scorecard does not care how far you hit it, only how many strokes it took.',
    category: 'mindset',
  },

  // ─── Statistics ─────────────────────────────────────────────────────────────
  {
    id: 'article-stat-01',
    title: 'Strokes Gained: The Basics',
    body: 'Strokes gained measures how each shot compares to the average golfer at your level. Instead of counting fairways or GIR in isolation, it shows which parts of your game actually cost you the most strokes. It is the most honest way to find where to practice.',
    category: 'statistics',
  },
  {
    id: 'article-stat-02',
    title: 'Why GIR Matters Most',
    body: 'Greens in regulation is the single stat most correlated with lower scores. Hitting more greens means more birdie putts and fewer scrambles. If you only track one number after a round, make it GIR percentage.',
    category: 'statistics',
  },
  {
    id: 'article-stat-03',
    title: 'Track What Moves the Needle',
    body: 'Logging fairways, greens, and putts after each round takes two minutes and reveals patterns you cannot see in the moment. After five rounds, you will know exactly which skill area deserves your practice time — no guesswork needed.',
    category: 'statistics',
  },

  // ─── Strategy ───────────────────────────────────────────────────────────────
  {
    id: 'article-strat-01',
    title: 'Play to Your Miss',
    body: 'If your typical miss is a fade, aim down the left side and let the ball work back. Fighting your natural shot shape under pressure leads to bigger misses. Accepting your tendency and planning for it keeps the ball in play.',
    category: 'strategy',
  },
  {
    id: 'article-strat-02',
    title: 'The Scoring Zone: 100 Yards and In',
    body: 'Most of your strokes happen inside 100 yards. Spending half your practice time on wedges, chips, and putts will lower your scores faster than chasing 10 extra yards off the tee. The short game is where scores are made.',
    category: 'strategy',
  },
  {
    id: 'article-strat-03',
    title: 'Tee Shot Club Selection',
    body: 'Driver is not always the right play. On tight holes, a 3-wood or hybrid off the tee can put you in the fairway with a longer but straighter approach. Calculate backwards from the green: what club leaves you in the best position for your second shot?',
    category: 'strategy',
  },
]
