"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/app/providers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, MessageCircle, Clock, FileText } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function DisputesPage() {
  const { state } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/login")
    }
  }, [state.isAuthenticated, router])

  const mockDisputes = [
    {
      id: "1",
      orderId: "ORD-001",
      type: "payment_not_received",
      status: "open",
      createdAt: "2024-01-15",
      counterpart: "trader_pro",
      amount: 1000,
      currency: "USDT",
      description: "Payment was sent but seller claims not received",
    },
    {
      id: "2",
      orderId: "ORD-002",
      type: "crypto_not_released",
      status: "resolved",
      createdAt: "2024-01-10",
      counterpart: "crypto_king",
      amount: 500,
      currency: "USDC",
      description: "Crypto not released after payment confirmation",
      resolution: "Resolved in your favor",
    },
  ]

  if (!state.isAuthenticated) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Disputes</h1>
          <p className="text-gray-600">Track and manage your transaction disputes</p>
        </div>

        {/* Disputes List */}
        <div className="space-y-4">
          {mockDisputes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Disputes</h3>
                <p className="text-gray-600">You don't have any active disputes</p>
              </CardContent>
            </Card>
          ) : (
            mockDisputes.map((dispute) => (
              <Card key={dispute.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                      Dispute #{dispute.id}
                    </CardTitle>
                    <Badge variant={dispute.status === "resolved" ? "default" : "destructive"}>{dispute.status}</Badge>
                  </div>
                  <CardDescription>
                    Order #{dispute.orderId} • {dispute.counterpart}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Amount</p>
                      <p className="text-lg font-semibold">
                        ${dispute.amount} {dispute.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Type</p>
                      <p className="text-sm">{dispute.type.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Created</p>
                      <div className="flex items-center text-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        {dispute.createdAt}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                    <p className="text-sm">{dispute.description}</p>
                  </div>

                  {dispute.resolution && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Resolution</p>
                      <p className="text-sm text-green-700">{dispute.resolution}</p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {dispute.status === "open" && (
                      <Button size="sm" variant="outline">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Add Comment
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
