"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/app/providers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, TrendingUp, Shield, CreditCard, Star, Upload, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function DashboardPage() {
  const { state, fetchDashboardData } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/login")
    } else if (state.user?.walletAddress && !state.dashboardData) {
      fetchDashboardData(state.user.walletAddress)
    }
  }, [state.isAuthenticated, state.user, state.dashboardData, router, fetchDashboardData])

  if (!state.isAuthenticated || !state.dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  const { stats, balances, recentTransactions } = state.dashboardData
  const walletAddress = state.user?.walletAddress || ""

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-gray-600 truncate">{walletAddress}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">USDT Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${balances.usdt.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">USDC Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${balances.usdc.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trading Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rating}/5.0</div>
              <p className="text-xs text-muted-foreground">Based on {stats.completedTrades} trades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">KYC Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={stats.kycStatus === "verified" ? "default" : "secondary"}>
                {stats.kycStatus}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Identity verification</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="banking">Banking</TabsTrigger>
            <TabsTrigger value="kyc">KYC</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Start trading or manage your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/orders">
                    <Button className="w-full justify-start">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Browse Orders
                    </Button>
                  </Link>
                  <Link href="/place-order">
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Order
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Bank Account
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTransactions.slice(0, 3).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {tx.type === "buy" ? (
                            <ArrowDownLeft className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {tx.type === "buy" ? "Bought" : "Sold"} {tx.currency}
                            </p>
                            <p className="text-xs text-gray-500">{tx.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${tx.amount.toFixed(2)}</p>
                          <Badge variant={tx.status === "Released" ? "default" : "secondary"}>{tx.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All your trading activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {tx.type === "buy" ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">
                            {tx.type === "buy" ? "Purchase from" : "Sale to"} {`${tx.counterparty.slice(0, 6)}...`}
                          </p>
                          <p className="text-sm text-gray-500">
                            Amount: ${tx.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">{tx.date}</p>
                        </div>
                      </div>
                      <Badge variant={tx.status === "Released" ? "default" : "secondary"}>{tx.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bank Accounts</CardTitle>
                <CardDescription>Manage your linked bank accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <CreditCard className="h-5 w-5 text-[#30a57f]" />
                      <div>
                        <p className="font-medium">Chase Bank</p>
                        <p className="text-sm text-gray-500">****1234</p>
                      </div>
                    </div>
                    <Badge>Primary</Badge>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Bank Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>KYC Verification</CardTitle>
                <CardDescription>Complete your identity verification</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.kycStatus === "verified" ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-green-600">Verification Complete</h3>
                    <p className="text-gray-600">Your identity has been successfully verified</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Upload Documents</h3>
                      <p className="text-gray-600">Your status is currently: {stats.kycStatus}</p>
                    </div>
                    <Button className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Documents
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
