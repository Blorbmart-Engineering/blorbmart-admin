import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'

import { AppLogo } from '@/components/app-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <AppLogo dark />
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <ShieldCheck className="size-4" />
            Internal access for finance and support teams
          </span>
          <div className="max-w-xl space-y-4">
            <h1 className="text-4xl font-semibold leading-tight">Monitor wallets, verify activity, and keep support moving.</h1>
            <p className="text-base text-slate-300">
              A clean admin workspace for managing payouts, reviewing flagged transactions, and tracking operational metrics.
            </p>
          </div>
        </div>
      </section>

      <section className="relative flex items-center justify-center bg-slate-50 px-6 py-10 dark:bg-background">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <div className="lg:hidden">
              <AppLogo compact />
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to access the Blorbmart admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="admin@blorbmart.com" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <Input id="password" type="password" placeholder="Enter your password" />
              </div>
              <Button asChild className="w-full">
                <Link to="/dashboard">
                  Sign in
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Need an account?{' '}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
