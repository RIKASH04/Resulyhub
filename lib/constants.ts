export const ADMIN_EMAIL = 'resulthub001@gmail.com'

export const GRADE_THRESHOLDS = {
    A_PLUS: 90,
    A: 80,
    B: 70,
    C: 60,
} as const

export function calculateGrade(percentage: number): string {
    if (percentage >= GRADE_THRESHOLDS.A_PLUS) return 'A+'
    if (percentage >= GRADE_THRESHOLDS.A) return 'A'
    if (percentage >= GRADE_THRESHOLDS.B) return 'B'
    if (percentage >= GRADE_THRESHOLDS.C) return 'C'
    return 'F'
}

export function calculatePassFail(percentage: number): 'Pass' | 'Fail' {
    return percentage >= GRADE_THRESHOLDS.C ? 'Pass' : 'Fail'
}

export function calculateSummary(marks: number[], maxMarks: number[]) {
    const total = marks.reduce((acc, m) => acc + m, 0)
    const maxTotal = maxMarks.reduce((acc, m) => acc + m, 0)
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0
    const grade = calculateGrade(percentage)
    const status = calculatePassFail(percentage)
    return { total, maxTotal, percentage: Math.round(percentage * 100) / 100, grade, status }
}
