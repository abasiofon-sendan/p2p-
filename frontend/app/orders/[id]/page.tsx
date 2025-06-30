"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApp } from "@/app/providers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Clock, User, Star, Shield, Building2, CreditCard, AlertTriangle, CheckCircle, Hourglass, MessageSquare } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/utils/api"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// --- INTERFACES ---

interface Seller {
  _id: string
  username?: string
  reputation: number
  completedTrades: number
  walletAddress: string
}

interface Order {
  _id: string
  orderType: "buy" | "sell"
  asset: "USDT" | "USDC"
  amount: number
  rate: number
  minLimit: number
  maxLimit: number
  status: "active" | "matched" | "completed" | "cancelled"
  seller: Seller
  paymentMethods: string[]
  paymentInstructions?: string
  bankDetails: {
    bankName: string
    accountNumber: string
    accountName: string
  }
  createdAt: string
}

interface Escrow {
  _id: string
  order: Order
  amount: string
  fiatAmount: number
  seller: string
  buyer: string
  status: 'Active' | 'PaymentSent' | 'Disputed' | 'Completed' | 'Cancelled'
  disputeReason?: string
  disputeRaisedBy?: 'buyer' | 'seller'
  createdAt: string
  paymentSentAt?: string
}

// --- COMPONENT ---

export default function TradeRoomPage() {
  const { state } = useApp()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const [escrow, setEscrow] = useState<Escrow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [disputeReason, setDisputeReason] = useState("")

  const fetchEscrow = useCallback(async () => {
    try {
      const escrowData = await apiFetch(`/api/escrows/${params.id}`)
      setEscrow(escrowData)
    } catch (error) {
      console.error('Failed to fetch escrow:', error)
      toast({
        title: "Error",
        description: "Failed to load trade details. It may not exist.",
        variant: "destructive",
      })
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [params.id, router, toast])

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/login")
      return
    }
    fetchEscrow()
  }, [state.isAuthenticated, router, fetchEscrow])

  // --- ACTION HANDLERS ---

  const handleConfirmPayment = async () => {
    if (!escrow) return
    setIsSubmitting(true)
    try {
      const result = await apiFetch(`/api/escrows/${escrow._id}/confirm-payment`, { method: 'POST' })
      setEscrow(result.escrow)
      toast({ title: 'Payment Confirmed', description: 'The seller has been notified to release the crypto.' })
    } catch (error: any) {
      toast({ title: 'Confirmation Failed', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmReceipt = async () => {
    if (!escrow) return
    setIsSubmitting(true)
    try {
      const result = await apiFetch(`/api/escrows/${escrow._id}/confirm-receipt`, { method: 'POST' })
      setEscrow(result.escrow)
      toast({ title: 'Trade Complete!', description: 'The crypto has been released to the buyer.' })
    } catch (error: any) {
      toast({ title: 'Confirmation Failed', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRaiseDispute = async () => {
    if (!escrow || !disputeReason.trim()) {
      toast({ title: 'Dispute Failed', description: 'Please provide a reason for the dispute.', variant: 'destructive' })
      return
    }
    setIsSubmitting(true)
    try {
      const raisedBy = state.user?.walletAddress.toLowerCase() === escrow.buyer.toLowerCase() ? 'buyer' : 'seller'
      const result = await apiFetch(`/api/escrows/${escrow._id}/raise-dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputeReason, raisedBy }),
      })
      setEscrow(result.escrow)
      toast({ title: 'Dispute Raised', description: 'An admin will review the case shortly.', variant: 'destructive' })
    } catch (error: any) {
      toast({ title: 'Dispute Failed', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- RENDER LOGIC ---

  const renderStatusBadge = (status: Escrow['status']) => {
    switch (status) {
      case 'Active':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Hourglass className="h-3 w-3 mr-1" />Awaiting Payment</Badge>
      case 'PaymentSent':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Hourglass className="h-3 w-3 mr-1" />Awaiting Confirmation</Badge>
      case 'Disputed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Disputed</Badge>
      case 'Completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const renderActionPanel = () => {
    if (!escrow) return null

    const isBuyer = state.user?.walletAddress.toLowerCase() === escrow.buyer.toLowerCase()
    const isSeller = state.user?.walletAddress.toLowerCase() === escrow.seller.toLowerCase()

    switch (escrow.status) {
      case 'Active':
        if (isBuyer) {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Action Required: Confirm Payment</CardTitle>
                <CardDescription>Transfer the funds to the seller's bank account, then confirm below.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleConfirmPayment} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Confirming...' : 'I Have Sent The Payment'}
                </Button>
              </CardContent>
            </Card>
          )
        }
        return <Card><CardContent className="p-6 text-center text-gray-500">Waiting for the buyer to send payment.</CardContent></Card>

      case 'PaymentSent':
        if (isSeller) {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Action Required: Confirm Receipt</CardTitle>
                <CardDescription>The buyer has marked the payment as sent. Please verify you have received the funds.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleConfirmReceipt} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Releasing...' : 'Payment Received, Release Crypto'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={isSubmitting} variant="destructive" className="w-full">Raise a Dispute</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Raise a Dispute</AlertDialogTitle>
                      <AlertDialogDescription>
                        Only raise a dispute if you have not received the payment. Please provide a clear reason.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                      placeholder="E.g., Payment not received after 2 hours..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRaiseDispute} disabled={isSubmitting || !disputeReason.trim()}>
                        {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )
        }
        return <Card><CardContent className="p-6 text-center text-gray-500">Waiting for the seller to confirm receipt.</CardContent></Card>

      case 'Disputed':
        return (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center"><AlertTriangle className="h-5 w-5 mr-2 text-destructive" />Trade Disputed</CardTitle>
              <CardDescription>An admin will review this trade. Please do not make any further transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">Reason:</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{escrow.disputeReason}</p>
              {/* TODO: Add evidence upload and chat component here */}
            </CardContent>
          </Card>
        )

      case 'Completed':
        return (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" />Trade Completed</CardTitle>
              <CardDescription>The crypto has been successfully transferred.</CardDescription>
            </CardHeader>
          </Card>
        )

      default:
        return null
    }
  }

  // --- MAIN RENDER ---

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#30a57f]"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!escrow) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-gray-500">Trade not found</p>
          <Link href="/orders">
            <Button className="mt-4">Back to Orders</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const { order } = escrow

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/orders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Trade Room</h1>
              <p className="text-gray-600">Trade ID: {escrow._id}</p>
            </div>
          </div>
          {renderStatusBadge(escrow.status)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trade Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trade Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">You are paying</Label>
                    <p className="font-semibold text-lg">${escrow.fiatAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">You will receive</Label>
                    <p className="font-semibold text-lg">{ethers.formatUnits(escrow.amount, 6)} {order.asset}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Seller's Bank Details
                  </Label>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">Bank Name</Label>
                        <p className="font-medium">{order.bankDetails.bankName}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Account Name</Label>
                        <p className="font-medium">{order.bankDetails.accountName}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Account Number</Label>
                      <p className="font-mono text-lg font-bold">{order.bankDetails.accountNumber}</p>
                    </div>
                  </div>
                </div>
                {order.paymentInstructions && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Instructions from Seller</Label>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm">{order.paymentInstructions}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
                      {order.seller.username ? order.seller.username[0].toUpperCase() : order.seller.walletAddress.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold">
                      {order.seller.username || `${order.seller.walletAddress.slice(0, 6)}...${order.seller.walletAddress.slice(-4)}`}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {order.seller.reputation.toFixed(1)}/5
                      </div>
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        {order.seller.completedTrades} trades
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Panel */}
          <div className="space-y-6">
            {renderActionPanel()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
