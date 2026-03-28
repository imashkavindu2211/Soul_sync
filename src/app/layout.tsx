import type { Metadata } from 'next'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import './globals.css'

export const metadata: Metadata = {
  title: 'Soul Sync | Shared Private Space',
  description: 'A private diary for couples to share their journey.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#d4a373', // Warm Earthy Brown/Gold
                colorBgBase: '#fffafa', // Snow/Cream
                colorTextBase: '#2c3e50', // Slate
                borderRadius: 12,
                fontFamily: "'Outfit', sans-serif",
              },
              components: {
                Button: {
                  borderRadius: 24,
                  controlHeight: 40,
                },
                Card: {
                  borderRadiusLG: 16,
                  boxShadowCard: '0 4px 12px rgba(0, 0, 0, 0.05)',
                },
              },
            }}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
