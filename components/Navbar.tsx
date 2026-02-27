'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, LogIn, LayoutDashboard, LogOut, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { ADMIN_EMAIL } from '@/lib/constants'

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
            setLoading(false)
        })
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-brand">
                    <motion.div className="brand-icon" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        R
                    </motion.div>
                    ResultHub
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Link href="/result" className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
                            <BookOpen size={15} />
                            Check Result
                        </Link>
                    </motion.div>

                    {!loading && (
                        <>
                            {isAdmin && (
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Link href="/admin" className="btn btn-primary btn-sm">
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
                                >
                                    <LogIn size={15} />
                                    Admin Login
                                </motion.button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
