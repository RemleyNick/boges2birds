import {
  FAIRWAY_THRESHOLDS,
  GIR_THRESHOLDS,
  MIN_SESSION_DURATION,
  PENALTY_THRESHOLDS_DESC,
  PROGRAM_MULTIPLIERS,
  PUTTS_THRESHOLDS_DESC,
  WEEKLY_TIME_BUDGET,
  WEEK_VOLUME,
} from '../thresholds'

describe('FAIRWAY_THRESHOLDS', () => {
  it('scores 4 when fairway % < 30%', () => {
    const t = FAIRWAY_THRESHOLDS.find((x) => 0.20 < x.max)!
    expect(t.score).toBe(4)
  })

  it('scores 3 when fairway % is 35%', () => {
    const t = FAIRWAY_THRESHOLDS.find((x) => 0.35 < x.max)!
    expect(t.score).toBe(3)
  })

  it('scores 2 when fairway % is 50%', () => {
    const t = FAIRWAY_THRESHOLDS.find((x) => 0.50 < x.max)!
    expect(t.score).toBe(2)
  })

  it('scores 1 when fairway % > 60%', () => {
    const last = FAIRWAY_THRESHOLDS[FAIRWAY_THRESHOLDS.length - 1]
    expect(last.score).toBe(1)
    expect(last.max).toBe(Infinity)
  })
})

describe('GIR_THRESHOLDS', () => {
  it('scores 4 for < 15% GIR', () => {
    const t = GIR_THRESHOLDS.find((x) => 0.10 < x.max)!
    expect(t.score).toBe(4)
  })

  it('scores 1 for > 44% GIR (last threshold)', () => {
    const last = GIR_THRESHOLDS[GIR_THRESHOLDS.length - 1]
    expect(last.score).toBe(1)
  })
})

describe('PUTTS_THRESHOLDS_DESC', () => {
  it('scores 4 for putts >= 2.2', () => {
    const t = PUTTS_THRESHOLDS_DESC.find((x) => 2.3 >= x.min)!
    expect(t.score).toBe(4)
  })

  it('scores 1 for putts < 1.8', () => {
    const t = PUTTS_THRESHOLDS_DESC.find((x) => 1.5 >= x.min)!
    expect(t.score).toBe(1)
  })
})

describe('PENALTY_THRESHOLDS_DESC', () => {
  it('scores 4 for 5+ penalties', () => {
    const t = PENALTY_THRESHOLDS_DESC.find((x) => 5 >= x.min)!
    expect(t.score).toBe(4)
  })

  it('scores 1 for 0 penalties', () => {
    const t = PENALTY_THRESHOLDS_DESC.find((x) => 0 >= x.min)!
    expect(t.score).toBe(1)
  })
})

describe('PROGRAM_MULTIPLIERS', () => {
  it('break100 putting multiplier is 1.3', () => {
    expect(PROGRAM_MULTIPLIERS.break100.putting).toBe(1.3)
  })

  it('break80 courseMgmt multiplier is 1.4', () => {
    expect(PROGRAM_MULTIPLIERS.break80.courseMgmt).toBe(1.4)
  })

  it('all programs have all 5 skills', () => {
    const skills = ['teeShot', 'irons', 'shortGame', 'putting', 'courseMgmt'] as const
    for (const program of ['break100', 'break90', 'break80'] as const) {
      for (const skill of skills) {
        expect(PROGRAM_MULTIPLIERS[program][skill]).toBeGreaterThan(0)
      }
    }
  })
})

describe('WEEKLY_TIME_BUDGET', () => {
  it('all time buckets have a positive budget', () => {
    for (const v of Object.values(WEEKLY_TIME_BUDGET)) {
      expect(v).toBeGreaterThan(0)
    }
  })
  it('<60 is 45 min', () => expect(WEEKLY_TIME_BUDGET['<60']).toBe(45))
  it('240+ is 300 min', () => expect(WEEKLY_TIME_BUDGET['240+']).toBe(300))
})

describe('WEEK_VOLUME', () => {
  it('week 1 is 0.6', () => expect(WEEK_VOLUME[1]).toBe(0.6))
  it('week 3 is 1.0', () => expect(WEEK_VOLUME[3]).toBe(1.0))
  it('week 4 is 0.7', () => expect(WEEK_VOLUME[4]).toBe(0.7))
})

describe('MIN_SESSION_DURATION', () => {
  it('is 10 minutes', () => expect(MIN_SESSION_DURATION).toBe(10))
})
