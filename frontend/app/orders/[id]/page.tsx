"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useApp } from "@/app/providers"
import { useToast } from "@/components/ui/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, CreditCard, DollarSign, AlertTriangle } from "lucide-react"
import Link from "next/link"

// This should be a combination of Order and Escrow data
interface TradeDetails {
  _id: string
  orderType: "buy" | "sell"
  asset: "USDT" | "USDC"
  amount: number
  rate: number
  minLimit: number
  maxLimit: number
  seller: {
    username: string
  }
  paymentMethods: string[]
  instructions: string
  // Escrow-related fields, null if not yet initiated
  escrowId?: string
  escrowStatus?: "LOCKED" | "PAYMENT_SENT" | "RELEASED" | "DISPUTED"
  buyerAddress?: string
}

export default function OrderDetailsPage() {
  const { state, connectWallet } = useApp()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const [trade, setTrade] = useState<TradeDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [buyAmountCrypto, setBuyAmountCrypto] = useState("")
  const [buyAmountFiat, setBuyAmountFiat] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const orderId = params.id as string

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/login")
      return
    }

    const fetchTradeDetails = async () => {
      setIsLoading(true)
      try {
        // This endpoint should fetch order details and any existing escrow status
        const response = await fetch(`/api/orders/${orderId}`)
        if (!response.ok) throw new Error("Failed to fetch trade details")
        const data = await response.json()
        setTrade(data)
      } catch (error) {
        console.error(error)
        toast({ title: "Error", description: "Could not load trade details.", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTradeDetails()
  }, [state.isAuthenticated, router, orderId, toast])

  const handleAmountChange = (value: string, type: "crypto" | "fiat") => {
    if (!trade) return
    const numValue = parseFloat(value)
    if (type === "crypto") {
      setBuyAmountCrypto(value)
      if (!Number.isNaN(numValue)) {
        setBuyAmountFiat((numValue * trade.rate).toFixed(2))
      } else {
        setBuyAmountFiat("")
      }
    } else {
      setBuyAmountFiat(value)
      if (!Number.isNaN(numValue)) {
        setBuyAmountCrypto((numValue / trade.rate).toFixed(6))
      } else {
        setBuyAmountCrypto("")
      }
    }
  }

  const handleInitiateTrade = async () => {
    if (!trade || !buyAmountCrypto) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount to buy.", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      // This is the new endpoint to start the trade and lock funds
      const response = await fetch("/api/escrows/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: trade._id,
          amount: parseFloat(buyAmountCrypto),
          buyerAddress: state.user?.walletAddress,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || "Failed to initiate trade")
      }

      toast({ title: "Trade Initiated!", description: "Seller's crypto is now locked in escrow." })
      // Refresh the page to show the new trade status
      router.refresh()
    } catch (error) {
      const err = error as Error
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ... handlers for confirmPayment, release, dispute would go here ...

  if (isLoading) return <DashboardLayout><p>Loading...</p></DashboardLayout>
  if (!trade) return <DashboardLayout><p>Order not found.</p></DashboardLayout>

  // RENDER LOGIC
  // If trade has not started (no escrowId), show the trade initiation view
  if (!trade.escrowId) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link href="/orders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Buy {trade.asset}</h1>
              <p className="text-gray-600">From seller: {trade.seller.username}</p>
            </div>
          </div>

          {/* Trade Initiation Card */}
          <Card>
            <CardHeader>
              <CardTitle>Start Your Trade</CardTitle>
              <CardDescription>
                Rate: 1 {trade.asset} = ${trade.rate.toFixed(2)} USD. Limits: ${trade.minLimit} - ${trade.maxLimit}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Button onClick={handleInitiateTrade} disabled={isSubmitting || !buyAmountCrypto} className="w-full">
                {isSubmitting ? "Initiating..." : `Buy ${trade.asset}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  // If trade HAS started, show the escrow status view
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <h1 className="text-2xl font-bold">Trade in Progress (Escrow #{trade.escrowId})</h1>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status: {trade.escrowStatus}</CardTitle>
            <CardDescription>Follow the steps below to complete the trade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dynamic content based on who is viewing (buyer/seller) and status */}
            <p>Step 1: Buyer sends fiat payment.</p>
            <p>Step 2: Buyer confirms payment.</p>
            <p>Step 3: Seller confirms receipt and releases crypto.</p>
            
            {/* Action buttons for the buyer */}
            {state.user?.walletAddress === trade.buyerAddress && trade.escrowStatus === 'LOCKED' && (
              <Button>
                <CheckCircle className="h-4 w-4 mr-2" />
                I Have Made Payment
              </Button>
            )}

            {/* Action buttons for the seller */}
            {state.user?.walletAddress !== trade.buyerAddress && trade.escrowStatus === 'PAYMENT_SENT' && (
               <Button>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Receipt & Release Crypto
              </Button>
            )}

            <Button variant="destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Dispute Trade
            </Button>
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm bg-gray-100 p-4 rounded-md">{trade.instructions}</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
