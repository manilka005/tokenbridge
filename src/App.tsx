import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import Home from './pages/Home'
import Tool from './pages/Tool'

function PageWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(8px)'
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }, 20)
    return () => clearTimeout(t)
  }, [location.pathname])

  return <div ref={ref}>{children}</div>
}

export default function App() {
  const location = useLocation()

  return (
    <PageWrapper>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<Tool />} />
      </Routes>
    </PageWrapper>
  )
}
