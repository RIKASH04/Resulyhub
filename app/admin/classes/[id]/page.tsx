'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, BookOpen, Users, PlusCircle, Trash2, Edit3,
    Save, X, UserPlus, ChevronDown, ChevronUp, AlertCircle, CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import Modal from '@/components/Modal'
import PageTransition from '@/components/PageTransition'
import { calculateSummary } from '@/lib/constants'

interface Subject { id: string; name: string; max_marks: number }
interface Mark { subject_id: string; marks_obtained: number }
interface Student {
    id: string; name: string; register_number: string;
    result_summary?: { total: number; max_total: number; percentage: number; grade: string; status: string }[]
}

type Tab = 'subjects' | 'students'

export default function ClassDetailPage() {
    const params = useParams()
    const router = useRouter()
    const classId = params.id as string
    const supabase = createClient()

    const [className, setClassName] = useState('')
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<Tab>('subjects')

    // Subject form
    const [showSubjectForm, setShowSubjectForm] = useState(false)
    const [subjectName, setSubjectName] = useState('')
    const [subjectMax, setSubjectMax] = useState(100)
    const [subjectSaving, setSubjectSaving] = useState(false)

    // Student form
    const [showAddStudent, setShowAddStudent] = useState(false)
    const [studentName, setStudentName] = useState('')
    const [studentReg, setStudentReg] = useState('')
    const [marksInput, setMarksInput] = useState<Record<string, number>>({})
    const [studentSaving, setStudentSaving] = useState(false)

    // Edit student
    const [editStudent, setEditStudent] = useState<Student | null>(null)
    const [editMarks, setEditMarks] = useState<Record<string, number>>({})
    const [editSaving, setEditSaving] = useState(false)

    // Expand student row
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null)
    const [expandedMarks, setExpandedMarks] = useState<Mark[]>([])

    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const showMsg = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 3500)
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        const [{ data: cls }, { data: subs }, { data: rawStuds }] = await Promise.all([
            supabase.from('classes').select('name').eq('id', classId).single(),
            supabase.from('subjects').select('id,name,max_marks').eq('class_id', classId).order('name'),
            supabase.from('students').select('id,name,register_number').eq('class_id', classId).order('name'),
        ])
        if (cls) setClassName(cls.name)
        setSubjects(subs || [])

        // Fetch result_summary separately to avoid join issues
        if (rawStuds && rawStuds.length > 0) {
            const studIds = rawStuds.map((s: { id: string }) => s.id)
            const { data: summaries } = await supabase
                .from('result_summary')
                .select('student_id,total,max_total,percentage,grade,status')
                .in('student_id', studIds)

            type SummaryRow = { student_id: string; total: number; max_total: number; percentage: number; grade: string; status: string }
            const summaryMap: Record<string, SummaryRow> = {}
            summaries?.forEach((s: SummaryRow) => { summaryMap[s.student_id] = s })

            const enriched = rawStuds.map((st: { id: string; name: string; register_number: string }) => ({
                ...st,
                result_summary: summaryMap[st.id] ? [summaryMap[st.id]] : []
            }))
            setStudents(enriched)
        } else {
            setStudents([])
        }

        setLoading(false)
    }, [classId])

    useEffect(() => { fetchData() }, [fetchData])

    // Reset marks input when subjects load
    useEffect(() => {
        const defaults: Record<string, number> = {}
        subjects.forEach(s => { defaults[s.id] = 0 })
        setMarksInput(defaults)
    }, [subjects])

    // ── Subject Operations ──
    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!subjectName.trim()) return
        setSubjectSaving(true)
        const { error } = await supabase.from('subjects').insert({ class_id: classId, name: subjectName.trim(), max_marks: subjectMax })
        if (error) showMsg('error', error.message)
        else { showMsg('success', 'Subject added!'); setSubjectName(''); setSubjectMax(100); setShowSubjectForm(false); await fetchData() }
        setSubjectSaving(false)
    }

    const handleDeleteSubject = async (id: string) => {
        if (!confirm('Delete this subject? This will also delete all marks for this subject.')) return
        await supabase.from('marks').delete().eq('subject_id', id)
        await supabase.from('subjects').delete().eq('id', id)
        showMsg('success', 'Subject deleted')
        await fetchData()
    }

    // ── Student Operations ──
    const upsertResultSummary = async (studentId: string, subs: Subject[], marksMap: Record<string, number>) => {
        const markValues = subs.map(s => marksMap[s.id] ?? 0)
        const maxValues = subs.map(s => s.max_marks)
        const { total, maxTotal, percentage, grade, status } = calculateSummary(markValues, maxValues)
        await supabase.from('result_summary').upsert({
            student_id: studentId, total, max_total: maxTotal, percentage, grade, status
        }, { onConflict: 'student_id' })
    }

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!studentName.trim() || !studentReg.trim()) return
        if (subjects.length === 0) { showMsg('error', 'Add at least one subject before adding students.'); return }
        setStudentSaving(true)
        const { data: existing } = await supabase.from('students').select('id').eq('register_number', studentReg.trim().toUpperCase()).maybeSingle()
        if (existing) { showMsg('error', 'Register number already exists!'); setStudentSaving(false); return }

        const { data: newStudent, error } = await supabase
            .from('students')
            .insert({ class_id: classId, name: studentName.trim(), register_number: studentReg.trim().toUpperCase() })
            .select('id').single()

        if (error || !newStudent) { showMsg('error', error?.message || 'Failed to add student'); setStudentSaving(false); return }

        // Insert marks
        const markRows = subjects.map(s => ({ student_id: newStudent.id, subject_id: s.id, marks_obtained: marksInput[s.id] ?? 0 }))
        await supabase.from('marks').insert(markRows)
        await upsertResultSummary(newStudent.id, subjects, marksInput)

        showMsg('success', 'Student added successfully!')
        setStudentName(''); setStudentReg('')
        const reset: Record<string, number> = {}
        subjects.forEach(s => { reset[s.id] = 0 })
        setMarksInput(reset)
        setShowAddStudent(false)
        await fetchData()
        setStudentSaving(false)
    }

    const handleExpandStudent = async (studentId: string) => {
        if (expandedStudentId === studentId) { setExpandedStudentId(null); return }
        const { data } = await supabase.from('marks').select('subject_id, marks_obtained').eq('student_id', studentId)
        setExpandedMarks(data || [])
        setExpandedStudentId(studentId)
    }

    const openEditStudent = async (student: Student) => {
        const { data: mks } = await supabase.from('marks').select('subject_id,marks_obtained').eq('student_id', student.id)
        const map: Record<string, number> = {}
        mks?.forEach((m: { subject_id: string; marks_obtained: number }) => { map[m.subject_id] = m.marks_obtained })
        subjects.forEach(s => { if (map[s.id] === undefined) map[s.id] = 0 })
        setEditMarks(map)
        setEditStudent(student)
    }

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editStudent) return
        setEditSaving(true)
        // Upsert marks
        for (const s of subjects) {
            await supabase.from('marks').upsert({
                student_id: editStudent.id, subject_id: s.id, marks_obtained: (editMarks as Record<string, number>)[s.id] ?? 0
            }, { onConflict: 'student_id,subject_id' })
        }
        await upsertResultSummary(editStudent.id, subjects, editMarks)
        showMsg('success', 'Marks updated!')
        setEditStudent(null)
        await fetchData()
        setEditSaving(false)
    }

    const handleDeleteStudent = async (id: string) => {
        if (!confirm('Delete this student and all their marks?')) return
        await supabase.from('marks').delete().eq('student_id', id)
        await supabase.from('result_summary').delete().eq('student_id', id)
        await supabase.from('students').delete().eq('id', id)
        showMsg('success', 'Student deleted')
        await fetchData()
    }

    return (
        <PageTransition>
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                    <Link href="/admin" className="btn btn-ghost btn-sm">
                        <ArrowLeft size={16} /> Back
                    </Link>
                    <div>
                        <h1 className="section-title" style={{ fontSize: 'clamp(1.1rem, 5vw, 1.5rem)' }}>{loading ? '...' : className}</h1>
                        <p className="section-subtitle">Manage subjects and students</p>
                    </div>
                </div>

                {/* Toast */}
                <AnimatePresence>
                    {message && (
                        <motion.div
                            className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        >
                            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabs */}
                <div className="tab-pill no-print" style={{ marginBottom: '1.5rem' }}>
                    {(['subjects', 'students'] as Tab[]).map(tab => (
                        <button key={tab} className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}>
                            {tab === 'subjects' ? <><BookOpen size={14} /> Subjects ({subjects.length})</> : <><Users size={14} /> Students ({students.length})</>}
                        </button>
                    ))}
                </div>

                {/* ── Subjects Tab ── */}
                <AnimatePresence mode="wait">
                    {activeTab === 'subjects' && (
                        <motion.div key="subjects"
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                <motion.button className="btn btn-primary btn-sm" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => setShowSubjectForm(v => !v)}>
                                    <PlusCircle size={15} /> Add Subject
                                </motion.button>
                            </div>

                            {/* Add subject form */}
                            <AnimatePresence>
                                {showSubjectForm && (
                                    <motion.div className="card" style={{ marginBottom: '1.25rem' }}
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <form onSubmit={handleAddSubject}>
                                            <div className="grid-responsive-2" style={{ marginBottom: '1rem' }}>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label">Subject Name</label>
                                                    <input className="form-input" placeholder="e.g. Mathematics" value={subjectName}
                                                        onChange={e => setSubjectName(e.target.value)} required />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label">Max Marks</label>
                                                    <input type="number" className="form-input" min={1} max={200} value={subjectMax}
                                                        onChange={e => setSubjectMax(Number(e.target.value))} required />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <motion.button type="submit" className="btn btn-success btn-sm" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} disabled={subjectSaving}>
                                                    {subjectSaving ? <span className="spinner spinner-sm" /> : <Save size={14} />} Save
                                                </motion.button>
                                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSubjectForm(false)}>
                                                    <X size={14} /> Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {subjects.length === 0 ? (
                                <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                                    <BookOpen size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                                    <p>No subjects yet. Add subjects using the button above.</p>
                                </div>
                            ) : (
                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Subject Name</th>
                                                <th>Max Marks</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subjects.map((s, i) => (
                                                <motion.tr key={s.id}
                                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                                                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                                                    <td>{s.max_marks}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <motion.button className="btn btn-danger btn-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleDeleteSubject(s.id)}>
                                                            <Trash2 size={13} /> Delete
                                                        </motion.button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── Students Tab ── */}
                    {activeTab === 'students' && (
                        <motion.div key="students"
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                <motion.button className="btn btn-primary btn-sm" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => setShowAddStudent(true)} disabled={subjects.length === 0}>
                                    <UserPlus size={15} /> Add Student
                                </motion.button>
                            </div>

                            {subjects.length === 0 && (
                                <div className="alert alert-info">
                                    <AlertCircle size={16} />
                                    Please add subjects first before adding students.
                                </div>
                            )}

                            {students.length === 0 ? (
                                <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                                    <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                                    <p>No students yet. Add students using the button above.</p>
                                </div>
                            ) : (
                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Student Name</th>
                                                <th>Register No.</th>
                                                <th style={{ textAlign: 'center' }}>Total</th>
                                                <th style={{ textAlign: 'center' }}>%</th>
                                                <th style={{ textAlign: 'center' }}>Grade</th>
                                                <th style={{ textAlign: 'center' }}>Status</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map((st, i) => {
                                                const sum = st.result_summary?.[0]
                                                const isExpanded = expandedStudentId === st.id
                                                return (
                                                    <Fragment key={st.id}>
                                                        <motion.tr
                                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                                            style={{ cursor: 'pointer' }}>
                                                            <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                                                            <td style={{ fontWeight: 600 }}>{st.name}</td>
                                                            <td style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}>{st.register_number}</td>
                                                            <td style={{ textAlign: 'center' }}>{sum ? `${sum.total}/${sum.max_total}` : '—'}</td>
                                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{sum ? `${sum.percentage.toFixed(1)}%` : '—'}</td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                {sum ? <span className="badge badge-grade">{sum.grade}</span> : '—'}
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                {sum ? <span className={`badge badge-${sum.status === 'Pass' ? 'pass' : 'fail'}`}>{sum.status}</span> : '—'}
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                                    <motion.button className="btn btn-ghost btn-sm" whileHover={{ scale: 1.05 }}
                                                                        onClick={() => handleExpandStudent(st.id)}>
                                                                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                                    </motion.button>
                                                                    <motion.button className="btn btn-secondary btn-sm" whileHover={{ scale: 1.05 }}
                                                                        onClick={() => openEditStudent(st)}>
                                                                        <Edit3 size={13} /> Edit
                                                                    </motion.button>
                                                                    <motion.button className="btn btn-danger btn-sm" whileHover={{ scale: 1.05 }}
                                                                        onClick={() => handleDeleteStudent(st.id)}>
                                                                        <Trash2 size={13} />
                                                                    </motion.button>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                        {/* Expanded row */}
                                                        {isExpanded && (
                                                            <tr>
                                                                <td colSpan={8} style={{ background: 'var(--bg)', padding: '1rem 1.5rem' }}>
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                                        {subjects.map(sub => {
                                                                            const m = expandedMarks.find(mk => mk.subject_id === sub.id)
                                                                            return (
                                                                                <div key={sub.id} style={{
                                                                                    background: 'white', border: '1px solid var(--border)',
                                                                                    borderRadius: 8, padding: '0.6rem 1rem', minWidth: 120
                                                                                }}>
                                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{sub.name}</div>
                                                                                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{m?.marks_obtained ?? 0}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/{sub.max_marks}</span></div>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Fragment>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Add Student Modal ── */}
                <Modal isOpen={showAddStudent} onClose={() => setShowAddStudent(false)} title="Add New Student" maxWidth="640px">
                    <form onSubmit={handleAddStudent}>
                        <div className="grid-responsive-2">
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input className="form-input" placeholder="Student's full name" value={studentName}
                                    onChange={e => setStudentName(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Register Number</label>
                                <input className="form-input" placeholder="e.g. REG2024001" value={studentReg}
                                    onChange={e => setStudentReg(e.target.value)} required style={{ textTransform: 'uppercase' }} />
                            </div>
                        </div>

                        <hr className="divider" />
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Enter Marks
                        </p>

                        <div className="grid-responsive-2">
                            {subjects.map(s => (
                                <div key={s.id} className="form-group">
                                    <label className="form-label">{s.name} (Max: {s.max_marks})</label>
                                    <input type="number" className="form-input" min={0} max={s.max_marks}
                                        value={marksInput[s.id] ?? 0}
                                        onChange={e => setMarksInput(prev => ({ ...prev, [s.id]: Number(e.target.value) }))} />
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowAddStudent(false)}>Cancel</button>
                            <motion.button type="submit" className="btn btn-primary" disabled={studentSaving}
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                {studentSaving ? <span className="spinner spinner-sm" /> : <UserPlus size={15} />}
                                Add Student
                            </motion.button>
                        </div>
                    </form>
                </Modal>

                {/* ── Edit Student Modal ── */}
                <Modal isOpen={!!editStudent} onClose={() => setEditStudent(null)} title={`Edit Marks — ${editStudent?.name}`} maxWidth="560px">
                    {editStudent && (
                        <form onSubmit={handleSaveEdit}>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                                Register: <strong style={{ color: 'var(--text-primary)' }}>{editStudent.register_number}</strong>
                            </p>
                            <div className="grid-responsive-2">
                                {subjects.map(s => (
                                    <div key={s.id} className="form-group">
                                        <label className="form-label">{s.name} (Max: {s.max_marks})</label>
                                        <input type="number" className="form-input" min={0} max={s.max_marks}
                                            value={editMarks[s.id] ?? 0}
                                            onChange={e => setEditMarks(prev => ({ ...prev, [s.id]: Number(e.target.value) }))} />
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setEditStudent(null)}>Cancel</button>
                                <motion.button type="submit" className="btn btn-success" disabled={editSaving}
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                    {editSaving ? <span className="spinner spinner-sm" /> : <Save size={15} />}
                                    Save Changes
                                </motion.button>
                            </div>
                        </form>
                    )}
                </Modal>
            </div>
        </PageTransition>
    )
}
