'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Clock } from 'lucide-react'

interface SessionTimeoutModalProps {
  isOpen: boolean
  onExtend: () => void
  timeRemaining: number
}

export function SessionTimeoutModal({ isOpen, onExtend, timeRemaining }: SessionTimeoutModalProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(timeRemaining)

  useEffect(() => {
    if (!isOpen) {
      setCountdown(timeRemaining)
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, timeRemaining, router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <AlertDialogTitle className="text-center">Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your session will expire in{' '}
            <span className="font-bold text-foreground">{formatTime(countdown)}</span> due to
            inactivity. Would you like to extend your session?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2">
          <AlertDialogCancel onClick={() => router.push('/login')}>
            Sign Out
          </AlertDialogCancel>
          <AlertDialogAction onClick={onExtend}>
            Extend Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Demo component showing the modal
export function SessionTimeoutDemo() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm text-primary hover:underline"
      >
        Demo: Show Session Timeout
      </button>
      <SessionTimeoutModal
        isOpen={showModal}
        onExtend={() => setShowModal(false)}
        timeRemaining={120}
      />
    </>
  )
}
