import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { InfiniteCanvas } from './components/canvas/InfiniteCanvas'
import { AuthPage } from './pages/AuthPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <InfiniteCanvas />,
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
