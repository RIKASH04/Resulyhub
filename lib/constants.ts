export const ADMIN_EMAIL = 'resulthub001@gmail.com'

export const MARKS_MAX = 50
export const PASS_MARK = 18

export function calculateGradeFromAverage(avg: number): string {
    if (avg >= 45) return 'A+'
    if (avg >= 40) return 'A'
    if (avg >= 35) return 'B+'
    if (avg >= 30) return 'B'
    if (avg >= 25) return 'C+'
    if (avg >= PASS_MARK) return 'C'
    return 'D'
}

export function calculateSummary(marks: number[], _maxMarks: number[]) {
    const failSubject = marks.some(m => m < PASS_MARK)
    const total = marks.reduce((acc, m) => acc + m, 0)
    const count = marks.length || 1
    const avg = total / count
    const maxTotal = count * MARKS_MAX
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0
    const grade = failSubject ? 'D' : calculateGradeFromAverage(avg)
    const status = failSubject ? 'Fail' : 'Pass'
    return { total, maxTotal, percentage: Math.round(percentage * 100) / 100, grade, status }
}
