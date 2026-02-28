'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, LogIn, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { ADMIN_EMAIL } from '@/lib/constants'
import { AnimatePresence } from 'framer-motion'

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    useEffect(() => {
        const id = setTimeout(() => setIsMenuOpen(false), 0)
        return () => clearTimeout(id)
    }, [pathname])

    useEffect(() => {
        supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
            setUser(data.user)
            setLoading(false)
        })
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
            setUser(session?.user ?? null)
        })
        return () => subscription.unsubscribe()
    }, [])

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` }
        })
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const isAdmin = user?.email === ADMIN_EMAIL

    const renderNavItems = () => (
        <>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href="/result" className="btn btn-secondary btn-sm" style={{ gap: '0.4rem', width: '100%' }}>
                    <BookOpen size={15} />
                    Check Result
                </Link>
            </motion.div>

            {!loading && (
                <>
                    {isAdmin && (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link href="/admin" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                                <LayoutDashboard size={15} />
                                Dashboard
                            </Link>
                        </motion.div>
                    )}
                    {user ? (
                        <motion.button
                            onClick={handleLogout}
                            className="btn btn-ghost btn-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ width: '100%' }}
                        >
                            <LogOut size={15} />
                            Logout
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={handleLogin}
                            className="btn btn-ghost btn-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ width: '100%' }}
                        >
                            <LogIn size={15} />
                            Admin Login
                        </motion.button>
                    )}
                </>
            )}
        </>
    )

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-brand">
                    <motion.div className="brand-icon" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        R
                    </motion.div>
                    ResultHub
                </Link>

                {/* Desktop Nav */}
                <div className="nav-desktop">
                    {renderNavItems()}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="nav-mobile-toggle"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Nav Sidebar */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            className="nav-mobile-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <motion.div
                            className="nav-mobile-sidebar"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <div className="nav-mobile-header">
                                <span className="nav-mobile-title">Menu</span>
                                <button onClick={() => setIsMenuOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="nav-mobile-content">
                                {renderNavItems()}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav>
    )
}
