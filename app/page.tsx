'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Search, ShieldCheck, GraduationCap, ArrowRight, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

const FU = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay }
})

const INSTITUTION_NAME = 'Himayathul Islam Madrasa Purusharakatte - 9798'

const features = [
  { icon: Search, title: 'Instant Results', desc: 'Search by Register Number and get your marksheet instantly.', color: '#4F46E5' },
  { icon: ShieldCheck, title: 'Secure & Verified', desc: 'All results are directly fetched from the official database.', color: '#10B981' },
  { icon: GraduationCap, title: 'Detailed Marksheet', desc: 'Subject-wise marks, grade, percentage and pass/fail status.', color: '#0EA5E9' },
]

export default function HomePage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => setUser(data.user))
  }, [])

  const handleAdminLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 50%, #F8FAFC 100%)',
          padding: '5rem 1.5rem 4rem',
          borderBottom: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute', top: '-80px', right: '-80px',
            width: '360px', height: '360px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-60px', left: '-60px',
            width: '280px', height: '280px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
            <motion.div {...FU(0)}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'var(--primary-light)', color: 'var(--primary)',
                padding: '0.35rem 1rem', borderRadius: '99px', fontSize: '0.8rem',
                fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                marginBottom: '1.5rem', border: '1px solid rgba(79,70,229,0.2)'
              }}>
                <Star size={12} fill="currentColor" /> Official Result Portal
              </span>
            </motion.div>

            <motion.h1 {...FU(0.1)}
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                color: 'var(--text-primary)',
                marginBottom: '1.25rem',
              }}>
              ResultHub
              <span style={{
                display: 'block',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Academic Results Portal
              </span>
            </motion.h1>

            <motion.p {...FU(0.2)}
              style={{
                fontSize: '1.1rem', color: 'var(--text-secondary)',
                maxWidth: '540px', margin: '0 auto 1.25rem', lineHeight: 1.7
              }}>
              Access your official academic marksheet instantly. Enter your Register Number to view subject-wise marks, grades, and result status.
            </motion.p>

            <motion.div {...FU(0.25)} style={{ marginBottom: '2rem' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                fontSize: '0.78rem', color: 'var(--text-muted)',
                fontWeight: 600, letterSpacing: '0.03em',
                background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border)',
                padding: '0.3rem 0.9rem', borderRadius: '99px',
              }}>
                🏫 {INSTITUTION_NAME}
              </span>
            </motion.div>

            <motion.div {...FU(0.3)}
              style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link href="/result" className="btn btn-primary" style={{ padding: '0.85rem 2.25rem', fontSize: '1rem', gap: '0.5rem' }}>
                  <Search size={18} />
                  Check My Result
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
              {!user && (
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <button onClick={handleAdminLogin} className="btn btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
                    <ShieldCheck size={18} />
                    Admin Login
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Features removed as requested */}

        {/* ── School / Institution Image ── */}
        <section style={{ padding: '3rem 1.5rem 4rem', background: 'var(--bg-white)' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            {/* Class Toppers 2026 Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ marginBottom: '4rem' }}
            >
              <h2 style={{ 
                fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', 
                fontWeight: 800, 
                marginBottom: '1.5rem',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #2563EB, #3B82F6, #60A5FA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Class Toppers — 2026
              </h2>
              <div style={{
                display: 'inline-block',
                width: '100%',
                maxWidth: '640px', // Reduced size for laptop screens
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 12px 50px rgba(79,70,229,0.15)',
                border: '1px solid var(--border)',
                background: '#F8FAFC',
              }}>
                <img
                  src="/toppers-2026.png"
                  alt="Himayathul Islam Madrasa – Class Toppers 2026"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    minHeight: '200px',
                    background: 'linear-gradient(135deg, #EEF2FF 0%, #E0F2FE 100%)',
                  }}
                />
              </div>
            </motion.div>

            {/* Admission Open Title */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              style={{ marginBottom: '2.5rem' }}
            >
              <h2 style={{ 
                fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
                fontWeight: 900, 
                letterSpacing: '-0.02em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'linear-gradient(135deg, #1E40AF, #3B82F6, #60A5FA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                padding: '0.5rem 0',
              }}>
                Admissions Open for 2026
              </h2>
            </motion.div>

            <div style={{ 
              display: 'flex', 
              gap: '2.5rem', 
              justifyContent: 'center', 
              flexWrap: 'wrap',
              alignItems: 'flex-start'
            }}>
              {/* Poster 1 */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                style={{
                  display: 'inline-block',
                  width: '100%',
                  maxWidth: '520px',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 40px rgba(79,70,229,0.10)',
                  border: '1px solid var(--border)',
                  background: '#F1F5F9',
                }}
              >
                <img
                  src="/addmission-2025.jpeg"
                  alt="Himayathul Islam Madrasa – Poster 1"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    minHeight: '180px',
                    background: 'linear-gradient(135deg, #EEF2FF 0%, #E0F2FE 100%)',
                  }}
                />
              </motion.div>

              {/* Poster 2 */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                  display: 'inline-block',
                  width: '100%',
                  maxWidth: '520px',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 40px rgba(14,165,233,0.10)',
                  border: '1px solid var(--border)',
                  background: '#F1F5F9',
                }}
              >
                <img
                  src="/poster-2.png"
                  alt="Himayathul Islam Madrasa – Poster 2"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    minHeight: '180px',
                    background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                  }}
                />
              </motion.div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
