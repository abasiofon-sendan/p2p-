"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useApp } from "@/app/providers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  MessageCircle,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  Send,
  Star,
  CreditCard,
} from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"

interface ChatMessage {
  id: string
  sender: "user" | "counterpart" | "system"
  message: string
  timestamp: string
}

export default function OrderDetailsPage() {
  const { state } = useApp()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [chatMessage, setChatMessage] = useState("")
  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes
  const [orderStatus, setOrderStatus] = useState<"matched" | "payment_pending" | "payment_confirmed" | "completed">(
    "matched",
  )

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/login")
    }
  }, [state.isAuthenticated, router])

  // Mock order data
  const order = {
    id: params.id,
    type: "buy" as const,
    currency: "USDT" as const,
    amount: 1000,
    rate: 1.02,
    minLimit: 100,
    maxLimit: 1000,
    status: "matched" as const,
    userId: "2",
    userName: "trader_pro",
    userRating: 4.8,
    completedTrades: 156,
    paymentMethods: ["Bank Transfer", "PayPal"],
    createdAt: "2024-01-15T10:30:00Z",
    bankAccount: "Bank of America ****1234",
    instructions:
      "Please transfer to the account details provided. Include the reference number in the transfer description.",
  }

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "system",
      message: "Order matched! Please follow the payment instructions below.",
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      sender: "counterpart",
      message: "Hi! Please send the payment to my bank account. I will release the USDT once confirmed.",
      timestamp: new Date().toISOString(),
    },
  ])

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      message: chatMessage,
      timestamp: new Date().toISOString(),
    }

    setChatMessages([...chatMessages, newMessage])
    setChatMessage("")
  }

  const handlePaymentConfirmation = () => {
    setOrderStatus("payment_confirmed")
    toast({
      title: "Payment Confirmed",
      description: "Waiting for seller to release crypto",
    })
  }

  const handleDispute = () => {
    toast({
      title: "Dispute Initiated",
      description: "Admin will review this transaction",
      variant: "destructive",
    })
  }

  if (!state.isAuthenticated) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Order #{order.id}</h1>
            <p className="text-gray-600">
              {order.type === "buy" ? "Buying" : "Selling"} {order.currency}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    Transaction Status
                  </CardTitle>
                  <Badge variant={orderStatus === "completed" ? "default" : "secondary"}>
                    {orderStatus.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Time Remaining:</span>
                    <div className="flex items-center text-orange-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(timeLeft)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Order Matched</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Payment Sent</span>
                      {orderStatus === "payment_confirmed" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Crypto Released</span>
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex space-x-3">
                    {orderStatus === "matched" && (
                      <Button onClick={handlePaymentConfirmation} className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Payment Sent
                      </Button>
                    )}
                    <Button variant="destructive" onClick={handleDispute}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Dispute
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Bank Transfer Details</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Bank:</strong> Bank of America
                    </p>
                    <p>
                      <strong>Account:</strong> ****1234
                    </p>
                    <p>
                      <strong>Amount:</strong> ${(order.amount * order.rate).toFixed(2)}
                    </p>
                    <p>
                      <strong>Reference:</strong> ORDER-{order.id}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{order.instructions}</p>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-64 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            msg.sender === "user"
                              ? "bg-blue-600 text-white"
                              : msg.sender === "system"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-white border"
                          }`}
                        >
                          {msg.sender !== "user" && msg.sender !== "system" && (
                            <p className="text-xs font-medium mb-1">{order.userName}</p>
                          )}
                          <p>{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <Badge variant={order.type === "buy" ? "default" : "secondary"}>{order.type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Currency:</span>
                  <span className="font-medium">{order.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">${order.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate:</span>
                  <span className="font-medium">${order.rate}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${(order.amount * order.rate).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Counterpart Info */}
            <Card>
              <CardHeader>
                <CardTitle>Trading Partner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {order.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{order.userName}</p>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-sm ml-1">{order.userRating}/5.0</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">{order.completedTrades} completed trades</div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Payment Methods:</p>
                  <div className="flex flex-wrap gap-1">
                    {order.paymentMethods.map((method) => (
                      <Badge key={method} variant="outline" className="text-xs">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-orange-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Security Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Only release crypto after confirming payment</p>
                <p>• Use the chat for all communication</p>
                <p>• Report suspicious activity immediately</p>
                <p>• Never share personal information</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
