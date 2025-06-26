"use client"

import type React from "react"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useApp } from "@/app/providers"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Wallet } from "lucide-react"

export default function LoginPage() {
  const { connectWallet, state } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (state.isAuthenticated) {
      router.push("/dashboard")
    }
  }, [state.isAuthenticated, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardDescription>Connect your wallet to sign in or create an account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-6 p-4">
              <Wallet className="h-16 w-16 text-primary" />
              <Button
                onClick={connectWallet}
                className="w-full"
                disabled={state.isLoading}
              >
                <Wallet className="h-4 w-4 mr-2" />
                {state.isLoading ? "Connecting..." : "Connect Wallet"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
