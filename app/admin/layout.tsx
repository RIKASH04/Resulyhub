import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="page-wrapper">
            <Navbar />
            <main className="page-content">
                {children}
            </main>
            <Footer />
        </div>
    )
}
