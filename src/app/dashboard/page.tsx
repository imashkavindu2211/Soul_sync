'use client'

import { Card, Typography, Button, Input, Upload, message, Divider, Badge, Tag, Spin, Empty, Space } from 'antd'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Navigation } from '@/components/Navigation'
import { HeartExplosion } from '@/components/HeartExplosion'
import { Heart, Camera, Lock, Eye, CheckCircle2, MoreHorizontal, Calendar } from 'lucide-react'
import type { UploadProps } from 'antd'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [partner, setPartner] = useState<any>(null)
  const [myEntry, setMyEntry] = useState<any>(null)
  const [partnerEntry, setPartnerEntry] = useState<any>(null)
  const [taskComplete, setTaskComplete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [showCelebration, setShowCelebration] = useState(false)
  const [accessRequestStatus, setAccessRequestStatus] = useState<string | null>(null)
  const [incomingRequests, setIncomingRequests] = useState<any[]>([])

  const router = useRouter()
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, partner:profiles(id, name)')
        .eq('id', user.id)
        .single()

      if (!profile?.partner_id) {
        router.push('/connect')
        return
      }

      setProfile(profile)
      setPartner(profile.partner)

      // Fetch My Entry for Today
      const { data: myEntryToday } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('created_at', today)
        .single()

      if (myEntryToday) {
        setMyEntry(myEntryToday)
        setContent(myEntryToday.content)
        setPhotoUrl(myEntryToday.photo_url)
      }

      // Fetch Partner's Entry for Today (Existence Check)
      // Note: Data fetching policy will restrict full content if not approved
      const { data: partnerEntryToday } = await supabase
        .from('diary_entries')
        .select('id, created_at, photo_url') // Limited columns
        .eq('user_id', profile.partner_id)
        .eq('created_at', today)
        .single()

      if (partnerEntryToday) {
        setPartnerEntry(partnerEntryToday)
        
        // Check Access Request Status
        const { data: req } = await supabase
          .from('access_requests')
          .select('status')
          .eq('requester_id', user.id)
          .eq('target_entry_id', partnerEntryToday.id)
          .single()
        
        if (req) {
          setAccessRequestStatus(req.status)
          if (req.status === 'approved') {
            const { data: fullPartnerEntry } = await supabase
              .from('diary_entries')
              .select('*')
              .eq('id', partnerEntryToday.id)
              .single()
            setPartnerEntry(fullPartnerEntry)
          }
        }
      }

      // Fetch Incoming Requests
      const { data: reqs } = await supabase
        .from('access_requests')
        .select('*, requester:profiles(name)')
        .eq('target_entry_id', myEntryToday?.id)
        .eq('status', 'pending')
      
      if (reqs) setIncomingRequests(reqs)

      setLoading(false)
    }

    loadDashboard()
  }, [supabase, router, today, myEntry?.id])

  useEffect(() => {
    if (myEntry && partnerEntry && !taskComplete) {
      setTaskComplete(true)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }, [myEntry, partnerEntry])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (myEntry) {
        const { error } = await supabase
          .from('diary_entries')
          .update({ content, photo_url: photoUrl })
          .eq('id', myEntry.id)
        if (error) throw error
        message.success('Safe and kept within my heart.')
      } else {
        const { data, error } = await supabase
          .from('diary_entries')
          .insert({
            user_id: profile.id,
            partner_id: partner.id,
            content,
            photo_url: photoUrl,
            created_at: today
          })
          .select()
          .single()
        if (error) throw error
        setMyEntry(data)
        message.success('A new chapter written.')
      }
    } catch (e: any) {
      message.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleActionRequest = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ status })
        .eq('id', requestId)
      if (error) throw error
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId))
      message.success(status === 'approved' ? 'Secret shared.' : 'Stayed hidden.')
    } catch (e: any) {
      message.error(e.message)
    }
  }

  const handleRequestPeek = async () => {
    if (!partnerEntry) return
    try {
      const { error } = await supabase
        .from('access_requests')
        .insert({
          requester_id: profile.id,
          target_entry_id: partnerEntry.id,
          status: 'pending'
        })
      if (error) throw error
      setAccessRequestStatus('pending')
      message.info('Sent a whisper asking to peek.')
    } catch (e: any) {
      message.error(e.message)
    }
  }

  const handleUpload: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'done') {
      // In a real app, upload to storage and set photoUrl
      // Here we simulate with a dummy URL
      setPhotoUrl('https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800')
      message.success('Photo shared.')
    }
  }

  if (loading) return (
    <div className="soul-sync-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Spin size="large" />
    </div>
  )

  return (
    <div className="soul-sync-container" style={{ background: '#f8f4f1' }}>
      <Navigation userName={profile?.name || ''} partnerName={partner?.name} />
      <HeartExplosion active={showCelebration} />

      <main style={{ padding: '2rem 1rem', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        {/* Daily Box Indicator */}
        <motion.div
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           style={{ marginBottom: '2rem' }}
        >
          <Card 
            className="glass-card" 
            style={{ 
              borderRadius: 24, 
              border: taskComplete ? '2px solid #d4a373' : '1px solid #eee',
              background: taskComplete ? '#fff' : 'rgba(255,255,255,0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <CheckCircle2 color={taskComplete ? '#d4a373' : '#bdc3c7'} size={32} />
                <div>
                  <Title level={4} style={{ margin: 0, color: taskComplete ? '#2c3e50' : '#7f8c8d' }}>
                    {taskComplete ? 'Our day is complete' : 'One more whisper to share'}
                  </Title>
                  <Text type="secondary">{today}</Text>
                </div>
              </div>
              <div>
                <Heart size={24} fill={taskComplete ? '#d4a373' : 'none'} color="#d4a373" style={{ opacity: taskComplete ? 1 : 0.3 }} />
              </div>
            </div>
          </Card>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* My Diary Entry */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card 
              title={<span style={{ fontWeight: 400 }}>My Chapter</span>} 
              extra={<Tag color="gold">Locked Today</Tag>}
              className="glass-card"
            >
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {!photoUrl ? (
                  <Upload 
                    className="avatar-uploader"
                    showUploadList={false}
                    onChange={handleUpload}
                    action="/api/dummy-upload" // Placeholder
                  >
                    <div style={{ 
                      height: 200, 
                      background: '#f9f9f9', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      borderRadius: 12,
                      border: '1px dashed #d9d9d9',
                      cursor: 'pointer'
                    }}>
                      <Camera size={32} color="#999" />
                      <Text type="secondary">Upload a moment</Text>
                    </div>
                  </Upload>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <img src={photoUrl} alt="Moment" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12 }} />
                    <Button 
                      size="small" 
                      style={{ position: 'absolute', top: 10, right: 10 }} 
                      icon={<Camera size={14} />}
                      onClick={() => setPhotoUrl('')}
                    >
                      Change
                    </Button>
                  </div>
                )}

                <TextArea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tell your heart's story..."
                  autoSize={{ minRows: 6, maxRows: 12 }}
                  style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', padding: 0 }}
                />

                <Button 
                  type="primary" 
                  block 
                  size="large" 
                  loading={saving}
                  onClick={handleSave}
                  style={{ height: 50, borderRadius: 25 }}
                >
                  Store Memory
                </Button>
              </Space>
            </Card>
          </motion.div>

          {/* Partner's Entry (Interaction) */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card 
              title={<span style={{ fontWeight: 400 }}>{partner?.name}'s Chapter</span>}
              className="glass-card"
              style={{ minHeight: 400, display: 'flex', flexDirection: 'column' }}
            >
              {!partnerEntry ? (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  description={<Text italic>Waiting for {partner?.name} to write...</Text>}
                  style={{ marginTop: '5rem' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', textAlign: 'center' }}>
                  {accessRequestStatus === 'approved' ? (
                    <div style={{ textAlign: 'left' }}>
                       {partnerEntry.photo_url && (
                         <img src={partnerEntry.photo_url} alt="Moment" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />
                       )}
                       <Paragraph style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                         {partnerEntry.content}
                       </Paragraph>
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ 
                        width: 120, 
                        height: 120, 
                        background: '#fcfaf7', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        marginBottom: '2rem'
                      }}>
                        <Lock size={48} color="#d4a373" fill="rgba(212, 163, 115, 0.1)" />
                      </div>
                      <Title level={4} style={{ fontWeight: 300 }}>A shared memory is waiting</Title>
                      <Paragraph style={{ color: '#7f8c8d', marginBottom: '2rem' }}>
                        {partner?.name} has hidden a secret today.
                      </Paragraph>
                      
                      {accessRequestStatus === 'pending' ? (
                        <Button disabled block icon={<MoreHorizontal size={16} />} size="large" style={{ borderRadius: 25 }}>
                          Sent a whisper...
                        </Button>
                      ) : (
                        <Button 
                          type="primary" 
                          icon={<Eye size={18} />} 
                          block 
                          size="large" 
                          style={{ background: '#2c3e50', borderRadius: 25, height: 50 }}
                          onClick={handleRequestPeek}
                        >
                          Request to Peek
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        <AnimatePresence>
          {incomingRequests.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: '2rem' }}>
              <Title level={4} style={{ fontWeight: 300, textAlign: 'center' }}>Whispers from {partner?.name}</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                {incomingRequests.map(req => (
                  <Card key={req.id} size="small" className="glass-card" style={{ borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>{partner?.name} wants to peek into your memory today.</Text>
                      <Space>
                        <Button type="primary" size="small" onClick={() => handleActionRequest(req.id, 'approved')}>Approve</Button>
                        <Button size="small" danger onClick={() => handleActionRequest(req.id, 'denied')}>Not today</Button>
                      </Space>
                    </div>
                  </Card>
                ))}
              </Space>
            </motion.div>
          )}
        </AnimatePresence>

        <Divider style={{ marginTop: '4rem' }}>
          <Tag icon={<Calendar size={14} style={{ marginRight: 4 }} />} color="default">Previous Journeys</Tag>
        </Divider>
        <div style={{ textAlign: 'center', color: '#bdc3c7' }}>
           <Text italic>Accessing past entries feature coming soon...</Text>
        </div>
      </main>
    </div>
  )
}
