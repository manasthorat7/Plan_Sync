import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
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
      <main className="flex-1 w-full">
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
        <Route path="/" element={
          <div className="max-w-5xl mx-auto p-6 mt-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-semibold mb-4 text-slate-800">
                Welcome to PlanSync
              </h2>
              {currentUser ? (
                <>
                  <p className="text-slate-600 mb-4">You are securely logged in as <span className="font-heading text-slate-800 font-semibold">{currentUser.email}</span>.</p>
                  <p className="text-slate-600">This is a clean, minimal UI setup. Ready to start building the group planning app!</p>
                </>
              ) : (
                <p className="text-slate-600">
                  Please <a href="/login" className="text-primary hover:underline">log in</a> or <a href="/signup" className="text-primary hover:underline">sign up</a> to start planning with your group!
                </p>
              )}
            </div>
          </div>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Layout>
  )
}
