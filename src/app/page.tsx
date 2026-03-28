'use client'

import { Button, Typography, Space } from 'antd'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Heart } from 'lucide-react'

const { Title, Text } = Typography

export default function Home() {
  return (
    <div className="soul-sync-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ textAlign: 'center', maxWidth: 600 }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <Heart size={64} color="#d4a373" fill="#d4a373" style={{ opacity: 0.8 }} />
        </div>
        
        <Title level={1} style={{ fontSize: '3.5rem', fontWeight: 300, marginBottom: '0.5rem' }}>
          Soul Sync
        </Title>
        <Text style={{ fontSize: '1.2rem', color: '#7f8c8d', display: 'block', marginBottom: '3rem' }}>
          A private whispered space for just the two of you.
        </Text>

        <Space size="large">
          <Link href="/auth/signup">
            <Button type="primary" size="large" style={{ paddingInline: 40 }}>
              Begin Journey
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="large" style={{ paddingInline: 40 }}>
              Continue
            </Button>
          </Link>
        </Space>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1.5 }}
          style={{ marginTop: '5rem' }}
        >
          <Text italic style={{ color: '#bdc3c7' }}>
            "Love is composed of a single soul inhabiting two bodies."
          </Text>
        </motion.div>
      </motion.div>

      {/* Subtle Background Elements */}
      <div style={{ 
        position: 'fixed', 
        top: '10%', 
        left: '15%', 
        width: '300px', 
        height: '300px', 
        borderRadius: '50%', 
        background: 'radial-gradient(circle, rgba(212, 163, 115, 0.05) 0%, transparent 70%)',
        zIndex: -1 
      }} />
      <div style={{ 
        position: 'fixed', 
        bottom: '15%', 
        right: '10%', 
        width: '400px', 
        height: '400px', 
        borderRadius: '50%', 
        background: 'radial-gradient(circle, rgba(250, 237, 205, 0.3) 0%, transparent 70%)',
        zIndex: -1 
      }} />
    </div>
  )
}
