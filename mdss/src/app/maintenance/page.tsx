"use client"

import { Button } from "@/components/ui/button"
import { Wrench, RefreshCw, Mail } from "lucide-react"

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-warning/10 mb-6">
            <Wrench className="w-12 h-12 text-warning" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">System Maintenance</h1>
          <p className="text-muted-foreground mb-6">
            The Malawi Disease Surveillance System is currently undergoing scheduled maintenance. 
            We apologize for any inconvenience and expect to be back online shortly.
          </p>
          
          <div className="bg-muted rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-foreground mb-2">Expected Downtime</h3>
            <p className="text-2xl font-bold text-primary mb-1">2:00 AM - 4:00 AM CAT</p>
            <p className="text-sm text-muted-foreground">Central Africa Time</p>
          </div>
          
          <p className="text-sm text-muted-foreground mb-8">
            If you have urgent surveillance data to report, please contact your district health office directly.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Page
          </Button>
          <Button asChild>
            <a href="mailto:support@mdss.health.gov.mw">
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </a>
          </Button>
        </div>
        
        <div className="mt-12 pt-8 border-t">
          <p className="text-xs text-muted-foreground">
            Ministry of Health, Malawi Disease Surveillance System
          </p>
        </div>
      </div>
    </div>
  )
}
