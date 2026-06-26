import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { BASE_URL } from './api'
import { ToastProvider } from './components/Toast'

import Login from './pages/Login'
import Home from './pages/Home'
import AllFlights from './pages/AllFlights'
import { AppShell } from './components/shell/AppShell'
import { Spinner } from './components/ui/Spinner'

const New = lazy(() => import('./pages/New'))
const Statistics = lazy(() => import('./pages/Statistics'))
const Settings = lazy(() => import('./pages/Settings'))

function Loading() {
    return (
        <div className="flex justify-center py-20">
            <Spinner />
        </div>
    )
}

export function App() {
    return (
        <ToastProvider>
            <BrowserRouter basename={BASE_URL}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<AppShell />}>
                    <Route path="/" element={<Home />} />
                    <Route
                        path="/new"
                        element={
                            <Suspense fallback={<Loading />}>
                                <New />
                            </Suspense>
                        }
                    />
                    <Route path="/flights" element={<AllFlights />} />
                    <Route
                        path="/statistics"
                        element={
                            <Suspense fallback={<Loading />}>
                                <Statistics />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <Suspense fallback={<Loading />}>
                                <Settings />
                            </Suspense>
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
        </ToastProvider>
    )
}
