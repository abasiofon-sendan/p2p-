"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useApp } from "@/app/providers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Clock, User, Star, Shield, Building2, CreditCard } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/utils/api"

// Updated Order interface to include bank details
interface Order {
  _id: string
  orderId?: string
  orderType: "buy" | "sell"
  asset: "USDT" | "USDC"
  amount: number
  rate: number
  minLimit: number
  maxLimit: number
  status: "active" | "matched" | "completed" | "cancelled"
  seller: {
    _id: string
    username?: string
    reputation: number
    completedTrades: number
    walletAddress: string
  }
  paymentMethods: string[]
  paymentInstructions?: string
  bankDetails: {
    bankName: string
    accountNumber: string
    accountName: string
  }
  createdAt: string
}

export default function OrderDetailsPage() {
  const { state } = useApp()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [trade, setTrade] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [buyAmountFiat, setBuyAmountFiat] = useState("")
  const [buyAmountCrypto, setBuyAmountCrypto] = useState("")

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/login")
      return
    }

    const fetchTrade = async () => {
      try {
        const orderData = await apiFetch(`/api/orders/${params.id}`)
        setTrade(orderData)
      } catch (error) {
        console.error('Failed to fetch order:', error)
        toast({
          title: "Error",
          description: "Failed to load order details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrade()
  }, [params.id, state.isAuthenticated, router, toast])

  const handleAmountChange = (value: string, type: "fiat" | "crypto") => {
    if (!trade) return

    if (type === "fiat") {
      setBuyAmountFiat(value)
      if (value && !isNaN(parseFloat(value))) {
        const cryptoAmount = (parseFloat(value) / trade.rate).toFixed(6)
        setBuyAmountCrypto(cryptoAmount)
      } else {
        setBuyAmountCrypto("")
      }
    } else {
      setBuyAmountCrypto(value)
      if (value && !isNaN(parseFloat(value))) {
        const fiatAmount = (parseFloat(value) * trade.rate).toFixed(2)
        setBuyAmountFiat(fiatAmount)
      } else {
        setBuyAmountFiat("")
      }
    }
  }

  const handleInitiateTrade = async () => {
    if (!trade || !buyAmountCrypto) {
      toast({ 
        title: "Invalid Amount", 
        description: "Please enter a valid amount to buy.", 
        variant: "destructive" 
      })
      return
    }

    const fiatAmount = parseFloat(buyAmountFiat)
    if (fiatAmount < trade.minLimit || fiatAmount > trade.maxLimit) {
      toast({ 
        title: "Amount Out of Range", 
        description: `Amount must be between $${trade.minLimit} and $${trade.maxLimit}`, 
        variant: "destructive" 
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Use apiFetch instead of direct fetch
      const result = await apiFetch("/api/escrows/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: trade._id,
          amount: parseFloat(buyAmountCrypto),
          fiatAmount: parseFloat(buyAmountFiat),
          buyerAddress: state.user?.walletAddress,
        }),
      })

      toast({ 
        title: "Trade Initiated!", 
        description: "Seller's crypto is now locked in escrow." 
      })
      
      // Refresh the page to show the new trade status
      router.refresh()
    } catch (error: any) {
      console.error('Failed to initiate trade:', error)
      toast({
        title: "Trade Initiation Failed",
        description: error.message || "Failed to initiate trade",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!state.isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#30a57f]"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!trade) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-gray-500">Order not found</p>
          <Link href="/orders">
            <Button className="mt-4">Back to Orders</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-gray-600">Complete your {trade.asset} trade</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Badge variant={trade.orderType === "buy" ? "default" : "secondary"}>
                      {trade.orderType.toUpperCase()}
                    </Badge>
                    <span>{trade.asset}</span>
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#30a57f]">${trade.rate}</div>
                    <div className="text-sm text-gray-500">per {trade.asset}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Available Amount</Label>
                    <p className="font-semibold">{trade.amount} {trade.asset}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Total Value</Label>
                    <p className="font-semibold">${(trade.amount * trade.rate).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Order Limits</Label>
                    <p className="font-semibold">${trade.minLimit} - ${trade.maxLimit}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Payment Method</Label>
                    <p className="font-semibold flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      Bank Transfer
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Bank Details */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Bank Details
                  </Label>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">Bank Name</Label>
                        <p className="font-medium">{trade.bankDetails.bankName}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Account Name</Label>
                        <p className="font-medium">{trade.bankDetails.accountName}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Account Number</Label>
                      <p className="font-mono text-lg font-bold">{trade.bankDetails.accountNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Instructions */}
                {trade.paymentInstructions && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Additional Instructions</Label>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm">{trade.paymentInstructions}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seller Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Seller Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {trade.seller.username ? trade.seller.username[0].toUpperCase() : trade.seller.walletAddress.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold">
                      {trade.seller.username || `${trade.seller.walletAddress.slice(0, 6)}...${trade.seller.walletAddress.slice(-4)}`}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {trade.seller.reputation}/5
                      </div>
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        {trade.seller.completedTrades} trades
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Buy {trade.asset}</CardTitle>
                <CardDescription>Enter the amount you want to purchase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="buy-fiat">You Pay (USD)</Label>
                    <Input
                      id="buy-fiat"
                      type="number"
                      placeholder="0.00"
                      value={buyAmountFiat}
                      onChange={(e) => handleAmountChange(e.target.value, "fiat")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buy-crypto">You Receive ({trade.asset})</Label>
                    <Input
                      id="buy-crypto"
                      type="number"
                      placeholder="0.000000"
                      value={buyAmountCrypto}
                      onChange={(e) => handleAmountChange(e.target.value, "crypto")}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleInitiateTrade} 
                  disabled={isSubmitting || !buyAmountCrypto || parseFloat(buyAmountFiat) < trade.minLimit || parseFloat(buyAmountFiat) > trade.maxLimit} 
                  className="w-full"
                >
                  {isSubmitting ? "Initiating..." : `Buy ${trade.asset}`}
                </Button>
                
                {buyAmountFiat && (parseFloat(buyAmountFiat) < trade.minLimit || parseFloat(buyAmountFiat) > trade.maxLimit) && (
                  <p className="text-sm text-red-600">
                    Amount must be between ${trade.minLimit} and ${trade.maxLimit}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Trading Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How it works</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 rounded-full bg-[#30a57f] text-white text-xs flex items-center justify-center mt-0.5">1</div>
                  <p>Click "Buy {trade.asset}" to lock the seller's crypto in escrow</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 rounded-full bg-[#30a57f] text-white text-xs flex items-center justify-center mt-0.5">2</div>
                  <p>Transfer the agreed amount to the seller's bank account</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 rounded-full bg-[#30a57f] text-white text-xs flex items-center justify-center mt-0.5">3</div>
                  <p>Seller confirms payment and releases crypto to you</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 rounded-full bg-[#30a57f] text-white text-xs flex items-center justify-center mt-0.5">4</div>
                  <p>If there's an issue, raise a dispute for admin review</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
