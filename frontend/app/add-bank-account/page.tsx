"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/app/providers"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function AddBankAccountPage() {
  const { state } = useApp()
  const { toast } = useToast()
  const router = useRouter()
  const [name, setName] = useState("")
  const [account, setAccount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await fetch(`/api/bank-accounts/${state.user?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, account }),
      })
      toast({ title: "Bank Account Added" })
      router.push("/place-order")
    } catch {
      toast({ title: "Failed to add bank account", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Add Bank Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Bank Name" value={name} onChange={e => setName(e.target.value)} required />
          <Input placeholder="Account Number (masked)" value={account} onChange={e => setAccount(e.target.value)} required />
          <Button type="submit" loading={isLoading}>Add Account</Button>
        </form>
      </CardContent>
    </Card>
  )
}