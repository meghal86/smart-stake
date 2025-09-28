export type Plan = 'LITE'|'PRO'|'ENTERPRISE'

export const gate = {
  digestFull:   (p: Plan) => p !== 'LITE',
  indexDrill:   (p: Plan) => p !== 'LITE',
  fullCalendar: (p: Plan) => p !== 'LITE',
  webhooks:     (p: Plan) => p === 'ENTERPRISE',
}
