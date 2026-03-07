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

        {/* Features */}
        <section style={{ padding: '4rem 1.5rem', background: 'var(--bg-white)' }}>
          <div className="container">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Why ResultHub?
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.97rem' }}>
                Everything you need to access your academic records.
              </p>
            </motion.div>

            <div className="grid-3">
              {features.map((f, i) => (
                <motion.div key={f.title}
                  className="card"
                  style={{ textAlign: 'center', padding: '2rem' }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  whileHover={{ y: -4 }}
                >
                  <div style={{
                    width: 56, height: 56,
                    background: `${f.color}15`,
                    borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                  }}>
                    <f.icon size={26} color={f.color} />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── School / Institution Image ── */}
        <section style={{ padding: '3rem 1.5rem 4rem', background: 'var(--bg-white)' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{
                display: 'inline-block',
                width: '100%',
                maxWidth: '560px',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 8px 40px rgba(79,70,229,0.10)',
                border: '1px solid var(--border)',
                background: '#F1F5F9',
              }}
            >
              {/* ─────────────────────────────────────────────────────────────
                  Replace the src below with your actual image path.
                  Example: src="/school.jpg"  (put the file in /public folder)
              ──────────────────────────────────────────────────────────────── */}
              <img
                src="/addmission-2025.jpeg"
                alt="Himayathul Islam Madrasa – Institution"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  /* Placeholder background shown when image is missing */
                  minHeight: '180px',
                  background: 'linear-gradient(135deg, #EEF2FF 0%, #E0F2FE 100%)',
                }}
                onError={(e) => {
                  /* If image fails to load, show a styled placeholder */
                  const el = e.currentTarget as HTMLImageElement
                  el.style.display = 'none'
                  const parent = el.parentElement
                  if (parent && !parent.querySelector('.img-fallback')) {
                    const fb = document.createElement('div')
                    fb.className = 'img-fallback'
                    fb.style.cssText =
                      'min-height:260px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.75rem;color:#94A3B8;font-family:inherit;'
                    fb.innerHTML =
                      '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span style="font-size:0.9rem;font-weight:600;">Your Image Goes Here</span><span style="font-size:0.78rem;">Place your file as <code style=\'background:#E2E8F0;padding:2px 6px;border-radius:4px\'>/public/home-image.png</code></span>'
                    parent.appendChild(fb)
                  }
                }}
              />
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
