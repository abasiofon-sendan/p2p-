"use client"

import type React from "react"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

// Add ethereum to the window object type
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Types
interface User {
  id: string
  email: string
  walletAddress?: string
  kycStatus: "pending" | "verified" | "rejected"
  rating: number
  isAdmin: boolean
}

interface WalletBalance {
  usdt: number
  usdc: number
}

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
  createdAt: string
  bankAccount?: string
}

interface AppState {
  user: User | null
  isAuthenticated: boolean
  walletBalance: WalletBalance
  orders: Order[]
  activeOrder: Order | null
  isLoading: boolean
}

type AppAction =
  | { type: "SET_USER"; payload: User }
  | { type: "LOGOUT" }
  | { type: "SET_WALLET_BALANCE"; payload: WalletBalance }
  | { type: "SET_ORDERS"; payload: Order[] }
  | { type: "SET_ACTIVE_ORDER"; payload: Order | null }
  | { type: "SET_LOADING"; payload: boolean }

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  walletBalance: { usdt: 0, usdc: 0 },
  orders: [],
  activeOrder: null,
  isLoading: false,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload, isAuthenticated: true }
    case "LOGOUT":
      return { ...state, user: null, isAuthenticated: false }
    case "SET_WALLET_BALANCE":
      return { ...state, walletBalance: action.payload }
    case "SET_ORDERS":
      return { ...state, orders: action.payload }
    case "SET_ACTIVE_ORDER":
      return { ...state, activeOrder: action.payload }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
  connectWallet: () => Promise<void>
  logout: () => void
} | null>(null)

export function Providers({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const { toast } = useToast()

  const connectWallet = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      if (typeof window.ethereum !== "undefined") {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })

        if (accounts.length > 0) {
          const walletAddress = accounts[0];
          
          // Authenticate with the backend
          const response = await fetch('/api/users/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Authentication failed');
          }

          dispatch({ type: "SET_USER", payload: data.user });

          toast({
            title: "Wallet Connected",
            description: `Logged in as ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          })
        }
      } else {
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask to continue",
          variant: "destructive",
        })
      }
    } catch (error) {
      const err = error as Error;
      toast({
        title: "Connection Failed",
        description: err.message || "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }

  const logout = () => {
    dispatch({ type: "LOGOUT" })
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    })
  }

  // Load mock data
  useEffect(() => {
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
        createdAt: new Date().toISOString(),
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
        createdAt: new Date().toISOString(),
        bankAccount: "Chase Bank ****5678",
      },
    ]

    dispatch({ type: "SET_ORDERS", payload: mockOrders })
    dispatch({ type: "SET_WALLET_BALANCE", payload: { usdt: 2500.5, usdc: 1800.25 } })
  }, [])

  const value = {
    state,
    dispatch,
    connectWallet,
    logout,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within Providers")
  }
  return context
}
