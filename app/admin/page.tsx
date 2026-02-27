'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
    LayoutDashboard, BookOpen, Users, PlusCircle, ChevronRight,
    GraduationCap, BarChart3, RefreshCw, School, Trash2
} from 'lucide-react'
import PageTransition from '@/components/PageTransition'

interface ClassItem {
    id: string
    name: string
    student_count?: number
    subject_count?: number
}

export default function AdminDashboard() {
    const supabase = createClient()
    const [classes, setClasses] = useState<ClassItem[]>([])
    const [loading, setLoading] = useState(true)
    const [createCount, setCreateCount] = useState(1)
    const [creating, setCreating] = useState(false)
    const [stats, setStats] = useState({ students: 0, subjects: 0, classes: 0 })
    const [createMsg, setCreateMsg] = useState('')

    const fetchClasses = useCallback(async () => {
        setLoading(true)
        const { data: cls } = await supabase.from('classes').select('id, name').order('name')
        if (!cls) { setLoading(false); return }

        const enriched = await Promise.all(cls.map(async (c: { id: string; name: string }) => {
            const [{ count: sc }, { count: stc }] = await Promise.all([
                supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('class_id', c.id),
                supabase.from('students').select('id', { count: 'exact', head: true }).eq('class_id', c.id),
            ])
            return { ...c, subject_count: sc ?? 0, student_count: stc ?? 0 }
        }))
        setClasses(enriched)

        const { count: totalStudents } = await supabase.from('students').select('id', { count: 'exact', head: true })
        const { count: totalSubjects } = await supabase.from('subjects').select('id', { count: 'exact', head: true })
        setStats({ students: totalStudents ?? 0, subjects: totalSubjects ?? 0, classes: cls.length })
        setLoading(false)
    }, [])

    useEffect(() => { fetchClasses() }, [fetchClasses])

    const handleCreateClasses = async () => {
        setCreating(true)
        setCreateMsg('')
        try {
            const payload = Array.from({ length: createCount }, (_, i) => ({
                name: `Class ${i + 1}`
            }))
            const { error } = await supabase
                .from('classes')
                .upsert(payload, { onConflict: 'name', ignoreDuplicates: true })
            if (error) throw error
            setCreateMsg(`✓ Classes created successfully!`)
            await fetchClasses()
        } catch (e: any) {
            setCreateMsg(`Error: ${e.message}`)
        }
        setCreating(false)
    }

    const handleDeleteClass = async (cls: ClassItem, e: React.MouseEvent) => {
        e.preventDefault()  // prevent navigating into the class
        e.stopPropagation()
        if (!confirm(`Delete "${cls.name}" and ALL its subjects, students & marks? This cannot be undone.`)) return
        const { error } = await supabase.from('classes').delete().eq('id', cls.id)
        if (error) {
            alert(`Error: ${error.message}`)
        } else {
            await fetchClasses()
        }
    }

    return (
        <PageTransition>
            <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', overflowX: 'hidden' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: 'clamp(1.1rem, 5vw, 1.5rem)' }}>
                                <LayoutDashboard size={22} color="var(--primary)" />
                                Admin Dashboard
                            </h1>
                            <p className="section-subtitle">Manage classes, subjects, and student results</p>
                        </div>
                        <button onClick={fetchClasses} className="btn btn-ghost btn-sm">
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid-responsive-2" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    {[
                        { icon: School, label: 'Total Classes', value: stats.classes, color: 'var(--primary)' },
                        { icon: Users, label: 'Total Students', value: stats.students, color: 'var(--success)' },
                        { icon: BookOpen, label: 'Total Subjects', value: stats.subjects, color: 'var(--accent)' },
                    ].map((s, i) => (
                        <motion.div key={s.label} className="stat-card"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div style={{
                                    width: 44, height: 44, background: `${s.color}15`,
                                    borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <s.icon size={20} color={s.color} />
                                </div>
                                <div>
                                    <div className="stat-value">{loading ? '—' : s.value}</div>
                                    <div className="stat-label">{s.label}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Create Classes Card */}
                <motion.div className="card" style={{ marginBottom: '2rem' }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PlusCircle size={18} color="var(--primary)" />
                        Setup Classes
                    </h2>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
                            <label className="form-label">Number of Classes (1–12)</label>
                            <select
                                className="form-select"
                                value={createCount}
                                onChange={e => setCreateCount(Number(e.target.value))}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>Class 1 to Class {i + 1}</option>
                                ))}
                            </select>
                        </div>
                        <motion.button
                            className="btn btn-primary"
                            onClick={handleCreateClasses}
                            disabled={creating}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {creating ? <span className="spinner spinner-sm" /> : <PlusCircle size={16} />}
                            Create Classes
                        </motion.button>
                        {createMsg && (
                            <motion.span
                                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                style={{
                                    fontSize: '0.85rem', fontWeight: 600,
                                    color: createMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)'
                                }}
                            >{createMsg}</motion.span>
                        )}
                    </div>
                </motion.div>

                {/* Classes Grid */}
                <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <GraduationCap size={18} color="var(--primary)" />
                        All Classes
                    </h2>

                    {loading ? (
                        <div className="grid-responsive-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                            {Array(8).fill(0).map((_, i) => (
                                <div key={i} className="skeleton" style={{ height: 130, borderRadius: 'var(--radius-lg)' }} />
                            ))}
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <GraduationCap size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                            <p>No classes yet. Create classes using the setup panel above.</p>
                        </div>
                    ) : (
                        <div className="grid-responsive-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                            <AnimatePresence>
                                {classes.map((cls, i) => (
                                    <motion.div key={cls.id}
                                        initial={{ opacity: 0, scale: 0.92 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                                        style={{ position: 'relative' }}
                                    >
                                        <Link href={`/admin/classes/${cls.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                                            <div className="card" style={{ cursor: 'pointer', position: 'relative', padding: '1.5rem', paddingBottom: '3rem' }}>
                                                <div style={{
                                                    width: 44, height: 44,
                                                    background: 'linear-gradient(135deg, var(--primary-light), var(--accent-light))',
                                                    borderRadius: 12,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    marginBottom: '1rem'
                                                }}>
                                                    <GraduationCap size={22} color="var(--primary)" />
                                                </div>
                                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                                    {cls.name}
                                                </h3>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                                                    <div>{cls.student_count} students</div>
                                                    <div>{cls.subject_count} subjects</div>
                                                </div>
                                                <ChevronRight size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '1.2rem', right: '1.2rem' }} />
                                                {/* Delete button inside card so it stays within the card boundary */}
                                                <motion.button
                                                    onClick={(e) => handleDeleteClass(cls, e)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    title="Delete this class"
                                                    style={{
                                                        position: 'absolute', bottom: '0.85rem', right: '0.85rem',
                                                        background: '#FEE2E2', border: '1px solid #FECACA',
                                                        borderRadius: 7, padding: '0.28rem 0.6rem',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                        gap: '0.28rem', fontSize: '0.72rem', fontWeight: 700,
                                                        color: '#DC2626', zIndex: 10,
                                                    }}
                                                >
                                                    <Trash2 size={11} /> Delete
                                                </motion.button>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    )
}
