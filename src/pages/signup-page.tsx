import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

import { AppLogo } from '@/components/app-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const checklist = ['Invite-only admin onboarding', 'Role-based permissions later', 'Firebase hookup deferred for now']

export function SignupPage() {
  return (
    <main className="relative grid min-h-screen bg-slate-50 px-6 py-10 dark:bg-background lg:grid-cols-[0.95fr_1.05fr]">
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>
      <section className="flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <AppLogo />
            <CardTitle className="pt-6 text-2xl">Create an admin account</CardTitle>
            <CardDescription>Frontend-only setup for now. Authentication wiring can come next.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" placeholder="Nora" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" placeholder="James" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="work-email">Work email</Label>
                <Input id="work-email" type="email" placeholder="ops@blorbmart.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" placeholder="Support Lead" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Input id="team" placeholder="Operations" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="create-password">Password</Label>
                <Input id="create-password" type="password" placeholder="Choose a secure password" />
              </div>
              <Button asChild className="mt-2 w-full sm:col-span-2">
                <Link to="/dashboard">
                  Create account
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have access?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="hidden items-center justify-center px-10 lg:flex">
        <div className="max-w-lg space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight">Set up the admin experience before backend auth integration.</h1>
          <p className="text-base text-muted-foreground">
            This signup flow is ready for visual review and can later connect to Firebase or your existing backend APIs.
          </p>
          <div className="space-y-4 rounded-3xl border border-border/60 bg-background p-6 shadow-sm">
            {checklist.map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
