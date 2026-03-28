'use client'

import { Form, Input, Button, Card, Typography, message } from 'antd'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Heart } from 'lucide-react'

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) throw error

      if (data.user) {
        // Check if user has a partner
        const { data: profile } = await supabase
          .from('profiles')
          .select('partner_id')
          .eq('id', data.user.id)
          .single()

        if (profile?.partner_id) {
          router.push('/dashboard')
        } else {
          router.push('/connect')
        }
      }
    } catch (error: any) {
      console.error('Login Error:', error)
      if (error.message === 'Failed to fetch') {
        message.error('Connection failed. Please check if your Supabase URL in .env.local is correct.')
      } else {
        message.error(error.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="soul-sync-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <Card className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <Heart size={32} color="#d4a373" fill="#d4a373" style={{ opacity: 0.6, marginBottom: '1.5rem' }} />
          <Title level={2} style={{ fontWeight: 300, marginBottom: '2.5rem' }}>Welcome Back</Title>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="email"
              rules={[{ required: true, message: 'Your email address', type: 'email' }]}
              label="Email Address"
            >
              <Input placeholder="name@example.com" style={{ height: 45 }} />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Your secret password' }]}
              label="Secret Password"
            >
              <Input.Password placeholder="Enter password" style={{ height: 45 }} />
            </Form.Item>

            <Form.Item style={{ marginTop: '2.5rem' }}>
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                Continue Journey
              </Button>
            </Form.Item>
          </Form>

          <Text style={{ color: '#bdc3c7' }}>
            New here? <a href="/auth/signup" style={{ color: '#d4a373' }}>Start account</a>
          </Text>
        </Card>
      </motion.div>
    </div>
  )
}
