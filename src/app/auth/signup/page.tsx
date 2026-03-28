'use client'

import { Form, Input, Button, Card, Typography, Select, message } from 'antd'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Heart } from 'lucide-react'

const { Title, Text } = Typography

export default function Signup() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Generate 6-digit invite code
        const inviteCode = Math.floor(100000 + Math.random() * 900000).toString()

        // 3. Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            name: values.name,
            gender: values.gender,
            invite_code: inviteCode,
          })

        if (profileError) throw profileError

        message.success('Account created! Your love story begins.')
        router.push('/connect')
      }
    } catch (error: any) {
      console.error('Signup Error:', error)
      if (error.message === 'Failed to fetch') {
        message.error('Connection failed. Please check if your Supabase URL in .env.local is correct.')
      } else {
        message.error(error.message || 'Something went wrong')
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
        style={{ width: '100%', maxWidth: 450 }}
      >
        <Card className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Heart size={32} color="#d4a373" fill="#d4a373" style={{ opacity: 0.6, marginBottom: '1rem' }} />
          <Title level={2} style={{ fontWeight: 300, marginBottom: '0.5rem' }}>Start your journey</Title>
          <Text style={{ display: 'block', marginBottom: '2.5rem', color: '#7f8c8d' }}>
            A private space for you and your partner.
          </Text>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'What is your name?' }]}
              label="Your Name"
            >
              <Input placeholder="Enter your name" style={{ height: 45 }} />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[{ required: true, message: 'Please enter your email', type: 'email' }]}
              label="Email Address"
            >
              <Input placeholder="name@example.com" style={{ height: 45 }} />
            </Form.Item>

            <Form.Item
              name="gender"
              label="Gender Identity"
            >
              <Select placeholder="Select gender" style={{ height: 45 }}>
                <Select.Option value="male">Male</Select.Option>
                <Select.Option value="female">Female</Select.Option>
                <Select.Option value="other">Other</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Create a password' }]}
              label="Secret Password"
            >
              <Input.Password placeholder="Min 6 characters" style={{ height: 45 }} />
            </Form.Item>

            <Form.Item style={{ marginTop: '2.5rem' }}>
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                Create Account
              </Button>
            </Form.Item>
          </Form>

          <Text style={{ color: '#bdc3c7' }}>
            Already have an account? <a href="/auth/login" style={{ color: '#d4a373' }}>Login</a>
          </Text>
        </Card>
      </motion.div>
    </div>
  )
}
