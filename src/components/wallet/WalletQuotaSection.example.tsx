/**
 * Example: Using WalletQuotaSection Component
 * 
 * This example shows how to integrate the WalletQuotaSection component
 * into your application to display wallet quota usage.
 * 
 * Requirement 7.7: The UI SHALL display quota usage (used_addresses, used_rows, total)
 */

import React from 'react'
import { WalletQuotaSection } from './WalletQuotaSection'

/**
 * Example 1: Basic usage with default settings
 */
export function BasicQuotaExample() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Wallet Quota</h2>
      <WalletQuotaSection />
    </div>
  )
}

/**
 * Example 2: With custom styling
 */
export function StyledQuotaExample() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Wallet Quota</h2>
      <WalletQuotaSection className="bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
    </div>
  )
}

/**
 * Example 3: With quota reached callback
 */
export function QuotaWithCallbackExample() {
  const handleQuotaReached = () => {
    console.log('Quota reached! User should upgrade their plan.')
    // Show upgrade modal or notification
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Wallet Quota</h2>
      <WalletQuotaSection onQuotaReached={handleQuotaReached} />
    </div>
  )
}

/**
 * Example 4: In a wallet management page
 */
export function WalletManagementPageExample() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Wallet Management</h1>

        {/* Quota section at the top */}
        <div className="mb-8">
          <WalletQuotaSection />
        </div>

        {/* Rest of wallet management UI */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Add Wallet</h2>
            <p className="text-gray-400 mb-4">
              Add a new wallet address to your registry
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              Add Wallet
            </button>
          </div>

          <div className="bg-white/5 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Wallets</h2>
            <p className="text-gray-400 mb-4">
              View and manage your registered wallets
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              View Wallets
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Example 5: In Guardian page with quota display
 */
export function GuardianPageWithQuotaExample() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Guardian</h1>
          <p className="text-gray-400">Multi-Wallet Security Dashboard</p>
        </div>

        {/* Quota section */}
        <div className="mb-8">
          <WalletQuotaSection />
        </div>

        {/* Main content */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Connected Wallets</h3>
            <p className="text-3xl font-bold text-cyan-400">3</p>
            <p className="text-gray-400 text-sm mt-2">Active wallets</p>
          </div>

          <div className="bg-white/5 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Security Score</h3>
            <p className="text-3xl font-bold text-green-400">92</p>
            <p className="text-gray-400 text-sm mt-2">Overall security</p>
          </div>

          <div className="bg-white/5 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Risk Alerts</h3>
            <p className="text-3xl font-bold text-yellow-400">2</p>
            <p className="text-gray-400 text-sm mt-2">Pending review</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Example 6: Responsive layout with quota
 */
export function ResponsiveQuotaExample() {
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-4xl font-bold mb-6">Wallet Dashboard</h1>

        {/* Quota section - responsive */}
        <div className="mb-8">
          <WalletQuotaSection className="w-full" />
        </div>

        {/* Content grid - responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Wallet cards would go here */}
        </div>
      </div>
    </div>
  )
}

