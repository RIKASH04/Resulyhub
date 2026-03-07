'use client'

import React from 'react'

interface CertificateProps {
    studentName: string
    fatherName: string
    admissionNumber: string
    className: string
    marks: { subjectName: string; marksObtained: number }[]
    certRef: React.RefObject<HTMLDivElement | null>
}

export default function Certificate({
    studentName,
    fatherName,
    admissionNumber,
    className,
    marks,
    certRef,
}: CertificateProps) {
    const today = new Date()
    const dateStr = today.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })

    // Build marks string e.g. "THAFHEM VOL 1: 48, DUROOS: 50"
    const marksStr = marks
        .map((m) => `${m.subjectName.toUpperCase()}: ${m.marksObtained}`)
        .join(', ')

    return (
        /*
          This wrapper is ONLY rendered off-screen (via visibility:hidden / position:absolute)
          so it doesn't affect the page layout. We make it exactly A4 landscape proportions
          to match the certificate image size.
        */
        <div
            ref={certRef}
            style={{
                position: 'absolute',
                top: 0,
                left: '-9999px',
                width: '1122px',   /* A4 landscape @ 96 dpi */
                height: '794px',
                overflow: 'hidden',
                fontFamily: "'Times New Roman', Georgia, serif",
                background: 'transparent',
            }}
        >
            {/* ── Background Certificate Image ── */}
            <img
                src="/certificate-template.jpg"
                alt="Certificate Background"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'fill',
                    display: 'block',
                }}
                crossOrigin="anonymous"
            />

            {/* ── DATE — upper-left area next to the "Date" label ── */}
            <div
                style={{
                    position: 'absolute',
                    top: '210px',
                    left: '112px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#111',
                    letterSpacing: '0.02em',
                }}
            >
                {dateStr}
            </div>

            {/*
        ── STUDENT NAME PARAGRAPH ──
        Matches the reference: "ABDUL NIHAD S/o NAZEERUEEN born on 15-02-2018
        having Admission Number 101 has studied in HIMAYATHUL ISLAM MADRASA..."
        We render this as a block paragraph positioned in the body of the cert.
      */}
            <div
                style={{
                    position: 'absolute',
                    top: '455px',
                    left: '140px',
                    right: '140px',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#111',
                    lineHeight: 1.65,
                    letterSpacing: '0.01em',
                }}
            >
                <span style={{ color: '#000' }}>{studentName.toUpperCase()}</span>
                {' S/o '}
                <span style={{ color: '#000' }}>{fatherName.toUpperCase()}</span>
                {' having Admission Number '}
                <span style={{ color: '#000' }}>{admissionNumber}</span>
                {' has studied in'}
            </div>

            {/* ── MARKS LINE ── */}
            <div
                style={{
                    position: 'absolute',
                    top: '616px',
                    left: '140px',
                    right: '140px',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#111',
                    letterSpacing: '0.01em',
                }}
            >
                {marksStr}
            </div>
        </div>
    )
}
