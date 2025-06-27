"use client"

import { useEffect, useState } from "react"
import { env } from "process"
import { useRouter } from "next/navigation"
import { useApp } from "@/app/providers"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, Star, DollarSign } from "lucide-react"
import Link from "next/link"
import { apiFetch } from "@/utils/api"

// The Order interface should match the backend's response
interface Order {
  _id: string
  orderId: string
  orderType: "buy" | "sell"
  asset: "USDT" | "USDC"
  amount: number
  rate: number
  minLimit: number
  maxLimit: number
  status: "active" | "matched" | "completed" | "cancelled"
  seller: {
    _id: string
    username: string
    reputation: number
    completedTrades: number
  }
  paymentMethods: string[]
  createdAt: string
}
  const BASE_URL = env.BASE_URL || "http://localhost:5001"

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
        const data = await apiFetch(`${BASE_URL}/api/orders?type=sell`)
        setOrders(data)
      } catch (error) {
        console.error(error)
        // Handle error with a toast or message
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [state.isAuthenticated, router])

  // Filtering logic remains the same, but operates on the fetched `orders` state
  const filteredOrders = orders.filter(order => {
      const searchMatch = order.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.seller.username.toLowerCase().includes(searchTerm.toLowerCase());
      const currencyMatch = filterCurrency === 'all' || order.asset === filterCurrency;
      // For now, we only show sell orders for buyers
      const typeMatch = order.orderType === 'sell';
      return searchMatch && currencyMatch && typeMatch;
  });

  // Sorting logic remains the same
  const sortedOrders = [...filteredOrders].sort((a, b) => {
      if (sortBy === 'rate') return a.rate - b.rate;
      if (sortBy === 'amount') return b.amount - a.amount;
      return 0;
  });


  if (!state.isAuthenticated) {
    return null // or a loading spinner
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header and Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Marketplace</h1>
            <p className="text-gray-600">Find the best offers to buy or sell crypto</p>
          </div>
          <Link href="/place-order">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user or currency..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={filterCurrency} onValueChange={setFilterCurrency}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="USDC">USDC</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rate">Best Rate</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {isLoading ? (
            <p>Loading orders...</p>
          ) : (
            sortedOrders.map((order) => <OrderCard key={order._id} order={order} />)
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

function OrderCard({ order }: { order: Order }) {
  return (
    <Link href={`/orders/${order._id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-lg font-bold text-green-600 bg-green-100 p-3 rounded-md">
              BUY
            </div>
            <div>
              <h3 className="font-bold text-lg">{order.asset}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Rate: ${order.rate.toFixed(2)}
                </span>
                <span>Available: ${order.amount.toFixed(2)}</span>
                <span>
                  Limits: ${order.minLimit} - ${order.maxLimit}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right space-y-1 hidden md:block">
            <div className="flex items-center justify-end space-x-2">
              <span className="text-sm font-medium">{order.seller.username}</span>
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs ml-1">{order.seller.reputation.toFixed(1)}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">{order.seller.completedTrades} trades</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
