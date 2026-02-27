'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { Search, Printer, AlertCircle, GraduationCap, User, Hash, School, Calendar } from 'lucide-react'

interface Subject { id: string; name: string; max_marks: number }
interface Mark { subject_id: string; marks_obtained: number; subjects: Subject }
interface ResultSummary { total: number; max_total: number; percentage: number; grade: string; status: string }
interface Student {
    id: string; name: string; register_number: string;
    classes: { name: string }
    result_summary: ResultSummary[]
    marks: Mark[]
}

export default function ResultPage() {
    const [registerNumber, setRegisterNumber] = useState('')
    const [student, setStudent] = useState<Student | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [searched, setSearched] = useState(false)
    const printRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    const calculateSummary = (marks: Mark[]): ResultSummary => {
        let totalMarks = 0
        let maxTotalMarks = 0
        let passedSubjects = 0
        const totalSubjects = marks.length

        marks.forEach(mark => {
            totalMarks += mark.marks_obtained
            maxTotalMarks += mark.subjects.max_marks
            const percentage = (mark.marks_obtained / mark.subjects.max_marks) * 100
            if (percentage >= 60) { // Assuming 60% is passing
                passedSubjects++
            }
        })

        const overallPercentage = maxTotalMarks > 0 ? (totalMarks / maxTotalMarks) * 100 : 0
        let grade = 'F'
        if (overallPercentage >= 90) grade = 'A+'
        else if (overallPercentage >= 80) grade = 'A'
        else if (overallPercentage >= 70) grade = 'B'
        else if (overallPercentage >= 60) grade = 'C'

        const status = passedSubjects === totalSubjects ? 'Pass' : 'Fail'

        return {
            total: totalMarks,
            max_total: maxTotalMarks,
            percentage: overallPercentage,
            grade: grade,
            status: status,
        }
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!registerNumber.trim()) {
            setError('Please enter a Register Number.')
            return
        }
        setLoading(true)
        setError('')
        setStudent(null)
        setSearched(true)

        const regNum = registerNumber.trim().toUpperCase()

        try {
            // 1. Fetch basic student information (maybeSingle returns null if not found, no error)
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select(`id, name, register_number, classes(name)`)
                .eq('register_number', regNum)
                .maybeSingle()

            if (studentError) {
                console.error('Error fetching student:', studentError.message)
                setError('Something went wrong. Please try again.')
                setLoading(false)
                return
            }
            if (!studentData) {
                setError('No result found for this Register Number. Please check and try again.')
                setLoading(false)
                return
            }

            // 2. Fetch marks for the student
            const { data: marksData, error: marksError } = await supabase
                .from('marks')
                .select(`marks_obtained, subject_id, subjects(id, name, max_marks)`)
                .eq('student_id', studentData.id)

            if (marksError) {
                console.error('Error fetching marks:', marksError.message)
                setError('Failed to retrieve marks. Please try again later.')
                setLoading(false)
                return
            }

            // 3. Fetch result summary (maybeSingle: null if no row exists, no PGRST116 needed)
            const { data: summaryData, error: summaryError } = await supabase
                .from('result_summary')
                .select(`total, max_total, percentage, grade, status`)
                .eq('student_id', studentData.id)
                .maybeSingle()

            let finalSummary: ResultSummary | null = null
            if (summaryError) {
                console.error('Error fetching result summary:', summaryError.message)
                // Non-fatal: will compute from marks below
            }

            // 4. Compute summary on-the-fly if missing from DB
            if (!summaryData) {
                console.warn('Result summary not found in DB, computing on-the-fly.')
                if (marksData && marksData.length > 0) {
                    finalSummary = calculateSummary(marksData as Mark[])
                } else {
                    setError('No marks found for this student. Please contact the administrator.')
                    setLoading(false)
                    return
                }
            } else {
                finalSummary = summaryData as ResultSummary
            }

            if (!finalSummary) {
                setError('Could not determine result summary.')
                setLoading(false)
                return
            }

            // Assemble the complete student object
            const completeStudent: Student = {
                ...studentData,
                marks: marksData || [],
                result_summary: [finalSummary], // Ensure it's an array as per interface
            }
            setStudent(completeStudent)

        } catch (err: any) {
            console.error('An unexpected error occurred during search:', err.message)
            setError('An unexpected error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => window.print()

    const summary = student?.result_summary?.[0]

    const getGradeColor = (grade: string) => {
        if (grade === 'A+' || grade === 'A') return 'var(--success)'
        if (grade === 'B' || grade === 'C') return 'var(--warning)'
        return 'var(--danger)'
    }

    return (
        <div className="page-wrapper">
            <Navbar />
            <main className="page-content" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    {/* Search Section */}
                    <div className="no-print">
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <div style={{
                                width: 64, height: 64, background: 'var(--primary-light)',
                                borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.25rem'
                            }}>
                                <GraduationCap size={30} color="var(--primary)" />
                            </div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
                                Check Your Result
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                Enter your Register Number to view your marksheet
                            </p>
                        </div>

                        <div className="card" style={{ maxWidth: '480px', margin: '0 auto 2.5rem' }}>
                            <form onSubmit={handleSearch}>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Register Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={16} style={{
                                            position: 'absolute', left: '0.9rem', top: '50%',
                                            transform: 'translateY(-50%)', color: 'var(--text-muted)'
                                        }} />
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. REG2024001"
                                            style={{ paddingLeft: '2.5rem', textTransform: 'uppercase' }}
                                            value={registerNumber}
                                            onChange={e => setRegisterNumber(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <motion.button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '0.8rem' }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={loading}
                                >
                                    {loading ? <span className="spinner spinner-sm" /> : <Search size={16} />}
                                    {loading ? 'Searching...' : 'Search Result'}
                                </motion.button>
                            </form>
                        </div>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {searched && error && (
                            <motion.div
                                className="alert alert-error"
                                style={{ maxWidth: '480px', margin: '0 auto 2rem', justifyContent: 'center' }}
                                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                            >
                                <AlertCircle size={18} />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Marksheet */}
                    <AnimatePresence>
                        {student && summary && (
                            <motion.div
                                ref={printRef}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {/* Print Header */}
                                <div className="card" style={{ padding: '2.5rem', border: '2px solid var(--border)' }}>
                                    {/* Institution Header */}
                                    <div style={{ textAlign: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                                            <div style={{
                                                width: 56, height: 56, background: 'linear-gradient(135deg, var(--primary), var(--primary-mid))',
                                                borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: 800, fontSize: '1.5rem'
                                            }}>R</div>
                                        </div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.01em' }}>Hidayathul Islam Madrasa Purusharakatte - 9798</h2>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.2rem' }}>Official Academic Result Portal</p>
                                        <div style={{
                                            display: 'inline-block', marginTop: '0.75rem',
                                            background: 'var(--primary-light)', color: 'var(--primary)',
                                            padding: '0.3rem 1.25rem', borderRadius: '99px',
                                            fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase'
                                        }}>
                                            Statement of Marks
                                        </div>
                                    </div>

                                    {/* Student Info Grid */}
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                                        gap: '0.85rem', marginBottom: '1.75rem',
                                        background: 'var(--bg)', padding: '1.25rem',
                                        borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)'
                                    }}>
                                        {[
                                            { icon: User, label: 'Student Name', value: student.name },
                                            { icon: Hash, label: 'Register Number', value: student.register_number },
                                            { icon: School, label: 'Class', value: student.classes?.name || '—' },
                                            { icon: Calendar, label: 'Academic Year', value: '2025–2026' },
                                        ].map(({ icon: Icon, label, value }) => (
                                            <div key={label} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                                                <Icon size={15} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                                                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Marks Table */}
                                    <div className="table-wrapper" style={{ marginBottom: '1.75rem' }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Subject</th>
                                                    <th style={{ textAlign: 'center' }}>Max Marks</th>
                                                    <th style={{ textAlign: 'center' }}>Marks Obtained</th>
                                                    <th style={{ textAlign: 'center' }}>Grade</th>
                                                    <th style={{ textAlign: 'center' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {student.marks?.map((mark, idx) => {
                                                    const pct = (mark.marks_obtained / mark.subjects.max_marks) * 100
                                                    const subGrade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : 'F'
                                                    const subPass = pct >= 60
                                                    return (
                                                        <motion.tr key={mark.subject_id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.05 }}>
                                                            <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                                                            <td style={{ fontWeight: 600 }}>{mark.subjects.name}</td>
                                                            <td style={{ textAlign: 'center' }}>{mark.subjects.max_marks}</td>
                                                            <td style={{ textAlign: 'center', fontWeight: 700 }}>{mark.marks_obtained}</td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <span className="badge badge-grade" style={{ color: getGradeColor(subGrade), background: `${getGradeColor(subGrade)}15` }}>{subGrade}</span>
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <span className={`badge ${subPass ? 'badge-pass' : 'badge-fail'}`}>{subPass ? 'Pass' : 'Fail'}</span>
                                                            </td>
                                                        </motion.tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Summary */}
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: '1rem',
                                        background: summary.status === 'Pass' ? 'var(--success-light)' : 'var(--danger-light)',
                                        border: `1.5px solid ${summary.status === 'Pass' ? '#A7F3D0' : '#FECACA'}`,
                                        borderRadius: 'var(--radius-md)', padding: '1.25rem'
                                    }}>
                                        {[
                                            { label: 'Total Marks', value: `${summary.total} / ${summary.max_total}` },
                                            { label: 'Percentage', value: `${summary.percentage.toFixed(1)}%` },
                                            { label: 'Grade', value: summary.grade },
                                            { label: 'Result', value: summary.status },
                                        ].map(item => (
                                            <div key={item.label} style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                                                <div style={{
                                                    fontSize: '1.3rem', fontWeight: 800,
                                                    color: summary.status === 'Pass' ? '#065F46' : '#991B1B',
                                                    marginTop: '0.2rem'
                                                }}>{item.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Print Button */}
                                    <div className="no-print" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                                        <motion.button
                                            onClick={handlePrint}
                                            className="btn btn-secondary"
                                            whileHover={{ scale: 1.04 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <Printer size={16} />
                                            Print Marksheet
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>
            <Footer />
        </div>
    )
}
