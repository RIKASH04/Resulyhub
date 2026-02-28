'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { calculateSummary, MARKS_MAX, PASS_MARK } from '@/lib/constants'
import { Search, Printer, AlertCircle, GraduationCap, User, Hash, School, Calendar } from 'lucide-react'

interface Subject { id: string; name: string; max_marks: number }
interface Mark { subject_id: string; marks_obtained: number; subjects: Subject }
interface ResultSummary { total: number; max_total: number; percentage: number; grade: string; status: string }
interface Student {
    id: string; name: string; register_number: string; father_name?: string; photo_url?: string;
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

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!registerNumber.trim()) {
            setError('Please enter an Admission Number.')
            return
        }
        setLoading(true)
        setError('')
        setStudent(null)
        setSearched(true)

        const regNum = registerNumber.trim().toUpperCase()

        try {
            // 1. Fetch basic student information (maybeSingle returns null if not found, no error)
            // Try with new columns; if not present, fallback
            let studentData: any | null = null
            let studentError: any | null = null
            const try1 = await supabase.from('students')
                .select(`id, name, register_number, father_name, photo_url, classes(name)`)
                .eq('register_number', regNum)
                .maybeSingle()
            if (try1.error) {
                studentError = try1.error
                const try2 = await supabase.from('students')
                    .select(`id, name, register_number, classes(name)`)
                    .eq('register_number', regNum)
                    .maybeSingle()
                studentData = try2.data
                studentError = try2.error
            } else {
                studentData = try1.data
            }

            if (studentError) {
                console.error('Error fetching student:', studentError.message)
                setError('Something went wrong. Please try again.')
                setLoading(false)
                return
            }
            if (!studentData) {
                setError('No result found for this Admission Number. Please check and try again.')
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
                    const arr = (marksData as Mark[]).map(m => m.marks_obtained)
                    const maxArr = (marksData as Mark[]).map(() => MARKS_MAX)
                    const c = calculateSummary(arr, maxArr)
                    finalSummary = { total: c.total, max_total: c.maxTotal, percentage: c.percentage, grade: c.grade, status: c.status }
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

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            console.error('An unexpected error occurred during search:', msg)
            setError('An unexpected error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => window.print()

    const summary = student?.result_summary?.[0]

    const getGradeColor = (grade: string) => {
        if (grade === 'A+' || grade === 'A') return 'var(--success)'
        if (grade === 'B+' || grade === 'B' || grade === 'C+') return 'var(--warning)'
        if (grade === 'C') return 'var(--warning)'
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
                                Enter your Admission Number to view your marksheet
                            </p>
                        </div>

                        <div className="card" style={{ maxWidth: '480px', margin: '0 auto 2.5rem' }}>
                            <form onSubmit={handleSearch}>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Admission Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={16} style={{
                                            position: 'absolute', left: '0.9rem', top: '50%',
                                            transform: 'translateY(-50%)', color: 'var(--text-muted)'
                                        }} />
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. ADM2024001"
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
                                <div className="card" style={{ padding: 'clamp(1rem, 4vw, 2.5rem)', border: '2px solid var(--border)' }}>
                                    {/* Institution Header */}
                                    <div style={{ textAlign: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                                            <div style={{
                                                width: 56, height: 56, background: 'linear-gradient(135deg, var(--primary), var(--primary-mid))',
                                                borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: 800, fontSize: '1.5rem'
                                            }}>R</div>
                                        </div>
                                        <h2 style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>Himayathul Islam Madrasa Purusharakatte - 9798</h2>
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
                                        gap: '1rem', marginBottom: '1.75rem',
                                        background: 'var(--bg)', padding: '1.25rem',
                                        borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)'
                                    }}>
                                        {student.photo_url && (
                                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                                <img src={student.photo_url} alt="Student" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }} />
                                            </div>
                                        )}
                                        {[
                                            { icon: User, label: 'Student Name', value: student.name },
                                            { icon: User, label: 'Father Name', value: student.father_name || '—' },
                                            { icon: Hash, label: 'Admission Number', value: student.register_number },
                                            { icon: School, label: 'Class', value: student.classes?.name || '—' },
                                            { icon: Calendar, label: 'Academic Year', value: '2025–2026' },
                                        ].map(({ icon: Icon, label, value }) => (
                                            <div key={label} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                                                <Icon size={15} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                                                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
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
                                                    const m = mark.marks_obtained
                                                    const subPass = m >= PASS_MARK
                                                    const subGrade = m >= 45 ? 'A+' : m >= 40 ? 'A' : m >= 35 ? 'B+' : m >= 30 ? 'B' : m >= 25 ? 'C+' : m >= PASS_MARK ? 'C' : 'D'
                                                    return (
                                                        <motion.tr key={mark.subject_id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.05 }}>
                                                            <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                                                            <td style={{ fontWeight: 600 }}>{mark.subjects.name}</td>
                                                            <td style={{ textAlign: 'center' }}>{MARKS_MAX}</td>
                                                            <td style={{ textAlign: 'center', fontWeight: 700, color: subPass ? 'var(--text-primary)' : '#991B1B' }}>{m}</td>
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
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '1rem',
                                        background: summary.status === 'Pass' ? 'var(--success-light)' : 'var(--danger-light)',
                                        border: `1.5px solid ${summary.status === 'Pass' ? '#A7F3D0' : '#FECACA'}`,
                                        borderRadius: 'var(--radius-md)', padding: '1rem'
                                    }}>
                                        {[
                                            { label: 'Total Marks', value: `${summary.total} / ${summary.max_total}` },
                                            { label: 'Average', value: `${(summary.total / (student.marks.length || 1)).toFixed(1)}` },
                                            { label: 'Grade', value: summary.grade },
                                            { label: 'Result', value: summary.status.toUpperCase() },
                                        ].map(item => (
                                            <div key={item.label} style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                                                <div style={{
                                                    fontSize: 'clamp(1rem, 3vw, 1.3rem)', fontWeight: 800,
                                                    color: summary.status === 'Pass' ? '#065F46' : '#991B1B',
                                                    marginTop: '0.2rem', wordBreak: 'break-word'
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
