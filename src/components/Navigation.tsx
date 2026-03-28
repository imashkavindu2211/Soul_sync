'use client'

import { createClient } from '@/lib/supabase'
import { Button, message, Space, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import { LogOut, Heart } from 'lucide-react'

const { Text } = Typography

export const Navigation = ({ userName, partnerName }: { userName: string, partnerName?: string }) => {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    message.success('Until next time.')
    router.push('/auth/login')
  }

  return (
    <nav style={{ 
      padding: '1rem 2rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      borderBottom: '1px solid #f0f0f0',
      background: 'white'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Heart size={24} color="#d4a373" fill="#d4a373" />
        <Text style={{ fontSize: '1.2rem', fontWeight: 500, letterSpacing: 1 }}>Soul Sync</Text>
      </div>

      <Space size="large" align="center">
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Text style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
            {userName} {partnerName ? `& ${partnerName}` : ''}
          </Text>
          <Button 
            type="text" 
            icon={<LogOut size={16} />} 
            onClick={handleLogout}
            style={{ color: '#95a5a6' }}
          />
        </div>
      </Space>
    </nav>
  )
}
