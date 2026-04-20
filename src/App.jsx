import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'

function Layout({ children }) {
  const { currentUser, logout } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white p-4 shadow-sm border-b border-indigo-400 flex justify-between items-center">
        <h1 className="text-xl font-bold">PlanSync</h1>
        {currentUser && (
          <button 
            onClick={logout} 
            className="text-sm bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm ml-4"
          >
            Log Out
          </button>
        )}
      </header>
      <main className="flex-1 w-full relative">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  const { currentUser } = useAuth();

  return (
    <Layout>
      <Routes>
        {/* Secure Application Area (Dashboard) */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <div className="max-w-5xl mx-auto p-6 mt-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="text-2xl font-semibold mb-4 text-slate-800">
                    Welcome to PlanSync Dashboard
                  </h2>
                  <p className="text-slate-600 mb-4">You are securely logged in as <span className="font-semibold text-slate-800">{currentUser?.email}</span>.</p>
                  <p className="text-slate-600">This is the securely restricted area. Start building your group planning tools here!</p>
                </div>
              </div>
            </PrivateRoute>
          } 
        />

        {/* Public Authentication Pages (If already logged in, they shouldn't realistically stay here. You can add public redirects manually later if desired.) */}
        <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/signup" element={currentUser ? <Navigate to="/" replace /> : <Signup />} />
      </Routes>
    </Layout>
  )
}
