"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/app/providers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search, Plus, TrendingUp, TrendingDown, DollarSign, Clock, User } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
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

export default function OrdersPage() {
  const { state } = useApp()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCurrency, setFilterCurrency] = useState("all")
  const [filterType, setFilterType] = useState("sell") // Default to showing sell orders
  const [sortBy, setSortBy] = useState("rate")

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/login")
      return
    }

    const fetchOrders = async () => {
      setIsLoading(true)
      try {
        // Remove BASE_URL concatenation since apiFetch handles it
        const data = await apiFetch(`/api/orders?type=${filterType}`)
        setOrders(data)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
        // Handle error with a toast or message
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [state.isAuthenticated, router, filterType])

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = searchTerm === "" || 
        order.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.seller.username || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCurrency = filterCurrency === "all" || order.asset === filterCurrency
      
      return matchesSearch && matchesCurrency
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rate":
          return a.rate - b.rate
        case "amount":
          return b.amount - a.amount
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            <Badge variant={order.orderType === "buy" ? "default" : "secondary"}>
              {order.orderType === "buy" ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {order.orderType.toUpperCase()}
            </Badge>
            <Badge variant="outline">{order.asset}</Badge>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#30a57f]">${order.rate}</div>
            <div className="text-sm text-gray-500">per {order.asset}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500">Amount</div>
            <div className="font-semibold">{order.amount} {order.asset}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Total Value</div>
            <div className="font-semibold">${(order.amount * order.rate).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Limit</div>
            <div className="font-semibold">${order.minLimit} - ${order.maxLimit}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Payment</div>
            <div className="font-semibold">Bank Transfer</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              {order.seller.username || `${order.seller.walletAddress.slice(0, 6)}...${order.seller.walletAddress.slice(-4)}`}
            </span>
            <Badge variant="outline" className="text-xs">
              {order.seller.completedTrades} trades
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <Link href={`/orders/${order._id}`}>
          <Button className="w-full mt-4">
            View Details & Trade
          </Button>
        </Link>
      </CardContent>
    </Card>
  )

  if (!state.isAuthenticated) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">P2P Orders</h1>
            <p className="text-gray-600">Buy and sell crypto with other users</p>
          </div>
          <Link href="/place-order">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by currency or seller..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rate">Best Rate</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Order Type Tabs */}
        <Tabs value={filterType} onValueChange={setFilterType}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sell" className="flex items-center">
              <TrendingDown className="h-4 w-4 mr-2" />
              Buy Crypto (Sell Orders)
            </TabsTrigger>
            <TabsTrigger value="buy" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Sell Crypto (Buy Orders)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sell" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#30a57f] mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading orders...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No sell orders available</p>
                <Link href="/place-order">
                  <Button className="mt-4">Create the first order</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="buy" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#30a57f] mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading orders...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No buy orders available</p>
                <Link href="/place-order">
                  <Button className="mt-4">Create the first order</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
