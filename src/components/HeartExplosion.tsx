'use client'

import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

export const HeartExplosion = ({ active }: { active: boolean }) => {
  if (!active) return null

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{ 
            scale: [0, 1.5, 0], 
            x: (Math.random() - 0.5) * 300, 
            y: (Math.random() - 0.5) * 300,
            opacity: 0 
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ position: 'absolute', top: '50%', left: '50%' }}
        >
          <Heart size={24} fill="#d4a373" color="#d4a373" />
        </motion.div>
      ))}
    </div>
  )
}
