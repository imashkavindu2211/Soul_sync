'use client'

import { Form, Input, Button, Card, Typography, Space, message, Divider } from 'antd'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Heart, UserPlus, Copy } from 'lucide-react'

const { Title, Text, Paragraph } = Typography

export default function Connect() {
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile?.partner_id) {
        router.push('/dashboard')
        return
      }
      
      setUserProfile(profile)
    }
    loadUser()
  }, [supabase, router])

  const copyCode = () => {
    if (userProfile?.invite_code) {
      navigator.clipboard.writeText(userProfile.invite_code)
      message.success('Code copied to clipboard!')
    }
  }

  const handleConnect = async (values: any) => {
    setLoading(true)
    try {
      // 1. Find the partner profile by code
      const { data: partner, error: partnerError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('invite_code', values.invite_code)
        .single()

      if (partnerError || !partner) {
        throw new Error('Partner code not found. Please double check.')
      }

      if (partner.id === userProfile.id) {
        throw new Error('You cannot connect with yourself.')
      }

      // 2. Mutual update (pairing)
      // Note: In production, use a transaction/Rpc script
      const { error: updateSelf } = await supabase
        .from('profiles')
        .update({ partner_id: partner.id })
        .eq('id', userProfile.id)

      const { error: updatePartner } = await supabase
        .from('profiles')
        .update({ partner_id: userProfile.id })
        .eq('id', partner.id)

      if (updateSelf || updatePartner) throw new Error('Failed to link profiles.')

      // 3. Create a couple record for easier querying permissions
      await supabase.from('couples').insert({
        user1_id: userProfile.id,
        user2_id: partner.id
      })

      message.success(`Successfully connected with ${partner.name}!`)
      router.push('/dashboard')

    } catch (error: any) {
      message.error(error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!userProfile) return null

  return (
    <div className="soul-sync-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: 500 }}
      >
        <Card className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <UserPlus size={40} color="#d4a373" style={{ marginBottom: '1.5rem' }} />
          <Title level={2} style={{ fontWeight: 300 }}>Connect Your Hearts</Title>
          <Paragraph style={{ color: '#7f8c8d' }}>
            To begin your shared diary journey, you must first connect with your partner.
          </Paragraph>

          <Space direction="vertical" style={{ width: '100%', marginTop: '2rem' }}>
            <div style={{ background: '#fcfaf7', border: '1px dashed #d4a373', padding: '1.5rem', borderRadius: 12 }}>
              <Text type="secondary" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                Your Invite Code
              </Text>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <Title level={3} style={{ margin: 0, letterSpacing: 4 }}>{userProfile.invite_code}</Title>
                <Button icon={<Copy size={16} />} onClick={copyCode} type="text" />
              </div>
            </div>

            <Divider>
              <Heart size={16} fill="#d4a373" color="#d4a373" />
            </Divider>

            <Form layout="vertical" onFinish={handleConnect}>
              <Form.Item
                name="invite_code"
                label="Enter Partner's Code"
                rules={[{ required: true, message: 'Invite code is 6 digits', min: 6, max: 6 }]}
              >
                <Input placeholder="E.g. 123456" style={{ height: 45, textAlign: 'center', letterSpacing: 4 }} />
              </Form.Item>

              <Form.Item style={{ marginTop: '1.5rem' }}>
                <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                  Request Connection
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      </motion.div>
    </div>
  )
}
