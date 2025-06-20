"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/app/providers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, TrendingUp, TrendingDown, Star, Clock, DollarSign } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"

interface Order {
  id: string
  type: "buy" | "sell"
  currency: "USDT" | "USDC"
  amount: number
  rate: number
  minLimit: number
  maxLimit: number
  status: "active" | "matched" | "completed" | "cancelled"
  userId: string
  userName: string
  userRating: number
  completedTrades: number
  paymentMethods: string[]
  createdAt: string
  bankAccount?: string
}

export default function OrdersPage() {
  const { state } = useApp()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCurrency, setFilterCurrency] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [sortBy, setSortBy] = useState("rate")

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/login")
    }
  }, [state.isAuthenticated, router])

  const mockOrders: Order[] = [
    {
      id: "1",
      type: "buy",
      currency: "USDT",
      amount: 1000,
      rate: 1.02,
      minLimit: 100,
      maxLimit: 1000,
      status: "active",
      userId: "2",
      userName: "trader_pro",
      userRating: 4.8,
      completedTrades: 156,
      paymentMethods: ["Bank Transfer", "PayPal"],
      createdAt: "2024-01-15T10:30:00Z",
      bankAccount: "Bank of America ****1234",
    },
    {
      id: "2",
      type: "sell",
      currency: "USDC",
      amount: 500,
      rate: 0.99,
      minLimit: 50,
      maxLimit: 500,
      status: "active",
      userId: "3",
      userName: "crypto_king",
      userRating: 4.9,
      completedTrades: 89,
      paymentMethods: ["Bank Transfer", "Zelle"],
      createdAt: "2024-01-15T09:15:00Z",
      bankAccount: "Chase Bank ****5678",
    },
    {
      id: "3",
      type: "buy",
      currency: "USDT",
      amount: 2000,
      rate: 1.01,
      minLimit: 200,
      maxLimit: 2000,
      status: "active",
      userId: "4",
      userName: "safe_trader",
      userRating: 4.7,
      completedTrades: 234,
      paymentMethods: ["Bank Transfer"],
      createdAt: "2024-01-15T08:45:00Z",
      bankAccount: "Wells Fargo ****9012",
    },
    {
      id: "4",
      type: "sell",
      currency: "USDC",
      amount: 750,
      rate: 0.98,
      minLimit: 100,
      maxLimit: 750,
      status: "active",
      userId: "5",
      userName: "quick_exchange",
      userRating: 4.6,
      completedTrades: 67,
      paymentMethods: ["Bank Transfer", "Venmo"],
      createdAt: "2024-01-15T07:20:00Z",
      bankAccount: "Citi Bank ****3456",
    },
  ]

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.currency.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCurrency = filterCurrency === "all" || order.currency === filterCurrency
    const matchesType = filterType === "all" || order.type === filterType

    return matchesSearch && matchesCurrency && matchesType
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "rate":
        return a.type === "buy" ? b.rate - a.rate : a.rate - b.rate
      case "amount":
        return b.amount - a.amount
      case "rating":
        return b.userRating - a.userRating
      default:
        return 0
    }
  })

  if (!state.isAuthenticated) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Order Book</h1>
            <p className="text-gray-600">Browse and trade with other users</p>
          </div>
          <Link href="/place-order">
            <Button>
              <TrendingUp className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="buy">Buy Orders</SelectItem>
                  <SelectItem value="sell">Sell Orders</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rate">Best Rate</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="rating">User Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Order Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Orders ({sortedOrders.length})</TabsTrigger>
            <TabsTrigger value="buy">Buy Orders ({sortedOrders.filter((o) => o.type === "buy").length})</TabsTrigger>
            <TabsTrigger value="sell">Sell Orders ({sortedOrders.filter((o) => o.type === "sell").length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {sortedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="buy" className="space-y-4">
            <div className="grid gap-4">
              {sortedOrders
                .filter((o) => o.type === "buy")
                .map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4">
            <div className="grid gap-4">
              {sortedOrders
                .filter((o) => o.type === "sell")
                .map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

function OrderCard({ order }: { order: Order }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className={`p-2 rounded-full ${
                order.type === "buy" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}
            >
              {order.type === "buy" ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg">
                  {order.type === "buy" ? "Buy" : "Sell"} {order.currency}
                </h3>
                <Badge variant={order.type === "buy" ? "default" : "secondary"}>{order.type}</Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Rate: ${order.rate}
                </span>
                <span>Amount: ${order.amount}</span>
                <span>
                  Limits: ${order.minLimit} - ${order.maxLimit}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{order.userName}</span>
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs ml-1">{order.userRating}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">{order.completedTrades} trades completed</div>
            <div className="flex space-x-2">
              <Link href={`/orders/${order.id}`}>
                <Button size="sm">View Details</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Payment Methods:</span>
              <div className="flex space-x-1">
                {order.paymentMethods.map((method) => (
                  <Badge key={method} variant="outline" className="text-xs">
                    {method}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
