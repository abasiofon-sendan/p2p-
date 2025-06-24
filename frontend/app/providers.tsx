"use client"

import type React from "react"
import { useReducer, createContext, useContext, type ReactNode, useCallback, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

// Define types for our state
interface User {
  id: string
  walletAddress: string
  isAdmin?: boolean
  kycStatus?: "unverified" | "pending" | "verified" | "rejected"
}

interface WalletBalance {
  usdt: number
  usdc: number
}

// New types for dashboard data
interface DashboardStats {
  rating: number
  completedTrades: number
  kycStatus: "unverified" | "pending" | "verified" | "rejected"
}

interface RecentTransaction {
  id: string
  type: "buy" | "sell"
  currency: string
  amount: number
  status: string
  date: string
  counterparty: string
}

interface DashboardData {
  stats: DashboardStats
  balances: WalletBalance
  recentTransactions: RecentTransaction[]
}

interface AppState {
  isAuthenticated: boolean
  user: User | null
  walletBalance: WalletBalance
  isLoading: boolean
  dashboardData: DashboardData | null
}

type AppAction =
  | { type: "LOGIN_SUCCESS"; payload: { user: User } }
  | { type: "LOGOUT" }
  | { type: "SET_USER"; payload: User }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_DASHBOARD_DATA"; payload: DashboardData }

const initialState: AppState = {
  isAuthenticated: false,
  user: null,
  walletBalance: { usdt: 0, usdc: 0 },
  isLoading: false,
  dashboardData: null,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
      }
    case "LOGOUT":
      return {
        ...initialState,
      }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_DASHBOARD_DATA":
      return { ...state, dashboardData: action.payload }
    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  connectWallet: () => Promise<void>
  logout: () => void
  fetchDashboardData: (walletAddress: string) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

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

  const fetchDashboardData = useCallback(
    async (walletAddress: string) => {
      if (!walletAddress) return
      dispatch({ type: "SET_LOADING", payload: true })
      try {
        const response = await fetch(`/api/users/dashboard/${walletAddress}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch dashboard data")
        }

        dispatch({ type: "SET_DASHBOARD_DATA", payload: data })
        // Also update walletBalance in the main state for consistency elsewhere
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            user: state.user!,
            walletBalance: data.balances,
          },
        })
      } catch (error) {
        const err = error as Error
        toast({
          title: "Dashboard Error",
          description: err.message,
          variant: "destructive",
        })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    },
    [state.user, toast]
  )

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
    connectWallet,
    logout,
    fetchDashboardData,
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
