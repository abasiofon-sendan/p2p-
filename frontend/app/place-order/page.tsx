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
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"

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
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([])
  const [selectedBankAccount, setSelectedBankAccount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/login")
    }
  }, [state.isAuthenticated, router])

  const paymentMethods = ["Bank Transfer", "PayPal", "Zelle", "Venmo", "Cash App", "Wire Transfer"]

  const bankAccounts = [
    { id: "1", name: "Chase Bank", account: "****1234" },
    { id: "2", name: "Bank of America", account: "****5678" },
  ]

  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    if (checked) {
      setSelectedPaymentMethods([...selectedPaymentMethods, method])
    } else {
      setSelectedPaymentMethods(selectedPaymentMethods.filter((m) => m !== method))
    }
  }

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

    if (selectedPaymentMethods.length === 0) {
      toast({
        title: "Payment Method Required",
        description: "Please select at least one payment method",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast({
      title: "Order Created Successfully",
      description: `Your ${orderType} order for ${currency} has been posted`,
    })

    setIsLoading(false)
    router.push("/orders")
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
                    <span className="text-xl font-bold text-blue-600">${calculateTotal()} USD</span>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="space-y-3">
                <Label>Payment Methods</Label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <Checkbox
                        id={method}
                        checked={selectedPaymentMethods.includes(method)}
                        onCheckedChange={(checked) => handlePaymentMethodChange(method, checked as boolean)}
                      />
                      <Label htmlFor={method} className="text-sm">
                        {method}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank Account Selection */}
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Bank Account</Label>
                <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} {account.account}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <Label htmlFor="instructions">Payment Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Provide clear instructions for the payment process..."
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
                    <p className="text-yellow-700">
                      Make sure you have sufficient balance and can fulfill this order. Orders that cannot be completed
                      may result in penalties.
                    </p>
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
