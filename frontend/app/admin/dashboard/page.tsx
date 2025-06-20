"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, AlertTriangle, TrendingUp, Shield, Search, Ban, CheckCircle, Eye } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function AdminDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const mockTransactions = [
    {
      id: "1",
      buyer: "user123",
      seller: "trader_pro",
      amount: 1000,
      currency: "USDT",
      status: "disputed",
      createdAt: "2024-01-15",
      disputeReason: "Payment not received",
    },
    {
      id: "2",
      buyer: "crypto_king",
      seller: "safe_trader",
      amount: 500,
      currency: "USDC",
      status: "completed",
      createdAt: "2024-01-14",
    },
    {
      id: "3",
      buyer: "quick_trader",
      seller: "reliable_user",
      amount: 750,
      currency: "USDT",
      status: "pending",
      createdAt: "2024-01-13",
    },
  ]

  const mockUsers = [
    {
      id: "1",
      email: "user123@example.com",
      username: "user123",
      kycStatus: "verified",
      rating: 4.5,
      totalTrades: 45,
      status: "active",
      joinedAt: "2023-12-01",
    },
    {
      id: "2",
      email: "suspicious@example.com",
      username: "suspicious_user",
      kycStatus: "pending",
      rating: 2.1,
      totalTrades: 3,
      status: "flagged",
      joinedAt: "2024-01-10",
    },
  ]

  const handleRestrictUser = (userId: string) => {
    console.log("Restricting user:", userId)
  }

  const handleResolveDispute = (transactionId: string, resolution: "buyer" | "seller") => {
    console.log("Resolving dispute:", transactionId, "in favor of:", resolution)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-red-600">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor and manage platform activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Disputes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231</div>
              <p className="text-xs text-muted-foreground">+5.2% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Pending review</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Monitor all platform transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-3">
                    {mockTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">#{tx.id}</span>
                            <Badge
                              variant={
                                tx.status === "completed"
                                  ? "default"
                                  : tx.status === "disputed"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {tx.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {tx.buyer} ↔ {tx.seller}
                          </p>
                          <p className="text-sm">
                            ${tx.amount} {tx.currency} • {tx.createdAt}
                          </p>
                          {tx.disputeReason && <p className="text-sm text-red-600">Dispute: {tx.disputeReason}</p>}
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {tx.status === "disputed" && (
                            <>
                              <Button size="sm" onClick={() => handleResolveDispute(tx.id, "buyer")}>
                                Favor Buyer
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleResolveDispute(tx.id, "seller")}>
                                Favor Seller
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Disputes</CardTitle>
                <CardDescription>Resolve transaction disputes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTransactions
                    .filter((tx) => tx.status === "disputed")
                    .map((tx) => (
                      <div key={tx.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <span className="font-medium">Transaction #{tx.id}</span>
                              <Badge variant="destructive">Disputed</Badge>
                            </div>
                            <p className="text-sm">
                              <strong>Parties:</strong> {tx.buyer} vs {tx.seller}
                            </p>
                            <p className="text-sm">
                              <strong>Amount:</strong> ${tx.amount} {tx.currency}
                            </p>
                            <p className="text-sm">
                              <strong>Reason:</strong> {tx.disputeReason}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleResolveDispute(tx.id, "buyer")}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Favor Buyer
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleResolveDispute(tx.id, "seller")}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Favor Seller
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Monitor and manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search users..." className="pl-10" />
                  </div>

                  <div className="space-y-3">
                    {mockUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{user.username}</span>
                            <Badge
                              variant={
                                user.status === "active"
                                  ? "default"
                                  : user.status === "flagged"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {user.status}
                            </Badge>
                            <Badge variant={user.kycStatus === "verified" ? "default" : "secondary"}>
                              KYC: {user.kycStatus}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-sm">
                            Rating: {user.rating}/5.0 • {user.totalTrades} trades • Joined {user.joinedAt}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {user.status === "flagged" && (
                            <Button size="sm" variant="destructive" onClick={() => handleRestrictUser(user.id)}>
                              <Ban className="h-4 w-4 mr-1" />
                              Restrict
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
