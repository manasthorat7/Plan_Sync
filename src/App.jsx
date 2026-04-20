import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="bg-primary text-white p-4 shadow-sm border-b border-indigo-400">
        <h1 className="text-xl font-bold">PlanSync</h1>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        <Routes>
          <Route path="/" element={
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-semibold mb-4 text-slate-800">Welcome to PlanSync</h2>
              <p className="text-slate-600">This is a clean, minimal UI setup. Ready to start building the group planning app!</p>
            </div>
          } />
        </Routes>
      </main>
    </div>
  )
}
