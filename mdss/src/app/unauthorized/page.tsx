"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldX, ArrowLeft, LogIn } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10 mb-6">
            <ShieldX className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            You do not have permission to access this page. If you believe this is an error, 
            please contact your system administrator or try logging in with different credentials.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button asChild>
            <Link href="/login">
              <LogIn className="w-4 h-4 mr-2" />
              Login Again
            </Link>
          </Button>
        </div>
        
        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Need access? Contact your district health administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
