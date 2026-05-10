'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { Shield, Smartphone, RefreshCw } from 'lucide-react'

export default function MFAPage() {
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const router = useRouter()

  const handleVerify = async () => {
    if (otp.length !== 6) return
    
    setIsLoading(true)
    
    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    router.push('/admin')
  }

  const handleResend = async () => {
    setIsResending(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsResending(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">MDSS</h1>
          <p className="text-muted-foreground">Malawi Disease Surveillance System</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter the 6-digit verification code sent to your registered mobile device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Code sent to: +265 *** *** 456
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={otp.length !== 6 || isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleResend}
              disabled={isResending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? 'Resending...' : 'Resend Code'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Having trouble? Contact IT support at support@health.gov.mw
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
