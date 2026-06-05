// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router/index.jsx'
import './styles/globals.css'

// DevTools loaded lazily — only rendered inside the app shell after auth,
// so they never appear on the login page and never for non-IT_ADMIN users.
// See AppShell.jsx for where DevTools are conditionally mounted.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 5,   // 5 min
      gcTime:               1000 * 60 * 10,  // 10 min
      retry:                1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)