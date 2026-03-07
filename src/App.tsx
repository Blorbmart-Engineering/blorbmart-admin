import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { OverviewPage } from '@/pages/admin/overview-page'
import { SectionPage } from '@/pages/admin/section-page'
import { LoginPage } from '@/pages/login-page'
import { SignupPage } from '@/pages/signup-page'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<Navigate to="/admin/overview" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
        <Route path="/admin/overview" element={<OverviewPage />} />
        <Route path="/admin/users" element={<SectionPage sectionKey="users" />} />
        <Route path="/admin/sellers" element={<SectionPage sectionKey="sellers" />} />
        <Route path="/admin/products" element={<SectionPage sectionKey="products" />} />
        <Route path="/admin/orders" element={<SectionPage sectionKey="orders" />} />
        <Route path="/admin/riders" element={<SectionPage sectionKey="riders" />} />
        <Route path="/admin/finance" element={<SectionPage sectionKey="finance" />} />
        <Route path="/admin/analytics" element={<SectionPage sectionKey="analytics" />} />
        <Route path="/admin/reviews" element={<SectionPage sectionKey="reviews" />} />
        <Route path="/admin/promotions" element={<SectionPage sectionKey="promotions" />} />
        <Route path="/admin/notifications" element={<SectionPage sectionKey="notifications" />} />
        <Route path="/admin/locations" element={<SectionPage sectionKey="locations" />} />
        <Route path="/admin/security" element={<SectionPage sectionKey="security" />} />
        <Route path="/admin/reports" element={<SectionPage sectionKey="reports" />} />
        <Route path="/admin/settings" element={<SectionPage sectionKey="settings" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
