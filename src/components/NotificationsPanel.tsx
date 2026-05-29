import React from 'react'
import { useApp } from '../context/AppContext'
import { NotificationType } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationsPanel({ isOpen, onClose }: Props) {
  const { notifications, markNotificationAsRead, clearNotifications, setCurrentPage } = useApp()

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'price_increase':
        return (
          <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 16a1 1 0 01-1-1v-5a1 1 0 011-1h10a1 1 0 011 1v5a1 1 0 01-1 1H7z" />
            <path d="M12 8V4m0 0L9 7m3-3l3 3" strokeWidth={2} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      case 'price_decrease':
        return (
          <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 8a1 1 0 011 1v5a1 1 0 01-1 1H7a1 1 0 01-1-1V9a1 1 0 011-1h10a1 1 0 011 1v5a1 1 0 01-1 1h-10a1 1 0 01-1-1V9a1 1 0 011-1h0zm5 12v-4m0 0l3-3m-3 3l-3-3" strokeWidth={2} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      case 'back_in_stock':
        return (
          <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'out_of_stock':
        return (
          <svg className="w-4 h-4 text-stone-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
    }
  }

  const getLabel = (type: NotificationType) => {
    switch (type) {
      case 'price_increase':
        return 'Price Increased'
      case 'price_decrease':
        return 'Price Decreased'
      case 'back_in_stock':
        return 'Back in Stock'
      case 'out_of_stock':
        return 'Out of Stock'
    }
  }

  const getDescription = (notification: typeof notifications[0]) => {
    switch (notification.type) {
      case 'price_increase':
        return `$${notification.oldPrice} → $${notification.newPrice}`
      case 'price_decrease':
        return `$${notification.oldPrice} → $${notification.newPrice}`
      case 'back_in_stock':
        return 'Now available'
      case 'out_of_stock':
        return 'Some sizes unavailable'
    }
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-screen w-80 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-out flex flex-col border-l border-stone-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Notifications</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-900 transition-colors p-1"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <svg className="w-10 h-10 text-stone-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm text-stone-500 mb-1">No notifications</p>
              <p className="text-xs text-stone-400">
                We'll notify you when prices change or items go in/out of stock
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-stone-50 transition-colors cursor-pointer ${
                    notification.read ? 'opacity-60' : 'bg-blue-50/30'
                  }`}
                  onClick={() => {
                    markNotificationAsRead(notification.id)
                    setCurrentPage('wishlists')
                    onClose()
                  }}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex-shrink-0">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-900">{getLabel(notification.type)}</p>
                      <p className="text-xs text-stone-600 mt-0.5 truncate">{notification.productName}</p>
                      <p className="text-xs text-stone-500 mt-1">{getDescription(notification)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-stone-100 p-3">
            <button
              onClick={() => clearNotifications()}
              className="w-full text-xs font-medium text-stone-500 hover:text-stone-900 py-2 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  )
}
