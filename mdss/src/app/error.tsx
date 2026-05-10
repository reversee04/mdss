"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10 mb-6">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-4">
            An unexpected error occurred. Our team has been notified and is working to fix the issue.
          </p>
          {error.digest && (
            <p className="text-sm text-muted-foreground mb-8">
              Error ID: <code className="bg-muted px-2 py-1 rounded">{error.digest}</code>
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button asChild>
            <Link href="/login">
              <Home className="w-4 h-4 mr-2" />
              Return to Login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
