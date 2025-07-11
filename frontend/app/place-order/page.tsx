"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/app/providers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, AlertCircle, Building2 } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/utils/api"

export default function PlaceOrderPage() {
  const { state } = useApp()
  const router = useRouter()
  const { toast } = useToast()
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy")
  const [currency, setCurrency] = useState<"USDT" | "USDC">("USDT")
  const [amount, setAmount] = useState("")
  const [rate, setRate] = useState("")
  const [minLimit, setMinLimit] = useState("")
  const [maxLimit, setMaxLimit] = useState("")
  const [instructions, setInstructions] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Bank details state
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/login")
    }
  }, [state.isAuthenticated, router])

  const calculateTotal = () => {
    const amountNum = Number.parseFloat(amount) || 0
    const rateNum = Number.parseFloat(rate) || 0
    return (amountNum * rateNum).toFixed(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validation
    if (!amount || !rate || !minLimit || !maxLimit) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (!bankName || !accountNumber || !accountName) {
      toast({
        title: "Bank Details Required",
        description: "Please fill in all bank details",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Validate limits
    const minLimitNum = parseFloat(minLimit)
    const maxLimitNum = parseFloat(maxLimit)
    if (minLimitNum >= maxLimitNum) {
      toast({
        title: "Invalid Limits",
        description: "Maximum limit must be greater than minimum limit",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      console.log('Current user state:', state.user); // Add this line

      // Prepare payload
      const payload = {
        orderType,
        asset: currency,
        amount: parseFloat(amount),
        rate: parseFloat(rate),
        minLimit: parseFloat(minLimit),
        maxLimit: parseFloat(maxLimit),
        seller: state.user?.id || state.user?._id, // Try both id and _id
        paymentMethods: ["Bank Transfer"], // Only bank transfer allowed
        paymentInstructions: instructions,
        bankDetails: {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
        },
      }

      console.log('Creating order with payload:', payload)

      // POST to backend - Remove BASE_URL since apiFetch handles it
      await apiFetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      toast({
        title: "Order Created Successfully",
        description: `Your ${orderType} order for ${currency} has been posted`,
      })

      router.push("/orders")
    } catch (error: any) {
      console.error('Order creation failed:', error)
      toast({
        title: "Order Creation Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!state.isAuthenticated) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create New Order</h1>
            <p className="text-gray-600">Set up your buy or sell order</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Configure your trading order parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order Type */}
              <Tabs value={orderType} onValueChange={(value) => setOrderType(value as "buy" | "sell")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy" className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Buy Order
                  </TabsTrigger>
                  <TabsTrigger value="sell" className="flex items-center">
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Sell Order
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Currency Selection */}
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={(value) => setCurrency(value as "USDT" | "USDC")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDT">USDT (Tether)</SelectItem>
                    <SelectItem value="USDC">USDC (USD Coin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount and Rate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({currency})</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Rate (USD per {currency})</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      placeholder="1.00"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minLimit">Minimum Limit (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="minLimit"
                      type="number"
                      placeholder="0.00"
                      value={minLimit}
                      onChange={(e) => setMinLimit(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLimit">Maximum Limit (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="maxLimit"
                      type="number"
                      placeholder="0.00"
                      value={maxLimit}
                      onChange={(e) => setMaxLimit(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Total Calculation */}
              {amount && rate && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Value:</span>
                    <span className="text-xl font-bold text-[#30a57f]">${calculateTotal()} USD</span>
                  </div>
                </div>
              )}

              {/* Bank Details Section */}
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-gray-600" />
                  <Label className="text-base font-semibold">Bank Details</Label>
                </div>
                <p className="text-sm text-gray-600">
                  Provide your bank details for receiving payments. This information will be shared with buyers.
                </p>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      type="text"
                      placeholder="e.g., Chase Bank, Bank of America"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      type="text"
                      placeholder="Enter your account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Holder Name</Label>
                    <Input
                      id="accountName"
                      type="text"
                      placeholder="Full name as on bank account"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <Label htmlFor="instructions">Additional Payment Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Provide any additional instructions for the bank transfer process (optional)..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Important:</p>
                    <ul className="text-yellow-700 mt-1 space-y-1">
                      <li>• Make sure you have sufficient balance and can fulfill this order</li>
                      <li>• Your bank details will be shared with buyers when they initiate a trade</li>
                      <li>• Only bank transfers are accepted as payment method</li>
                      <li>• Orders that cannot be completed may result in penalties</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Order..." : `Create ${orderType} Order`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
