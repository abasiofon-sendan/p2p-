import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Shield, Zap, Users, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className=" mx-auto p-5 py-6 sm:px-10 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
                            <Image src="/logo.png" alt="Logo" width={180} height={40} className="" />
            </Link>
          </div>
          <div className="space-x-4">
            
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Trade USDT & USDC
          <span className="text-[#30a57f] block">Peer-to-Peer</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Secure, fast, and reliable P2P cryptocurrency exchange with built-in escrow protection. Trade directly with
          other users at the best rates.
        </p>
        <div className="space-x-4">
          <Link href="/orders">
            <Button size="lg" className="bg-[#30a57f] text-white hover:border hover:border-[#30a57f] hover:text-[#30a57f]">
              Start Trading <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
         
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Platform?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-[#30a57f] mb-2" />
              <CardTitle>Secure Escrow</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Smart contract-based escrow system protects both buyers and sellers</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Fast Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Quick order matching and instant crypto transfers upon confirmation</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Trusted Community</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>User rating system and KYC verification for safe trading</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Best Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Competitive rates set by the community, no hidden fees</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#30a57f] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of users already trading on our secure platform</p>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 TradeAm. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
