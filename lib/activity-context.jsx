'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const ActivityContext = createContext(null)

const STORAGE_KEY = 'nc_recent_bills'

export function ActivityProvider({ children }) {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) setEntries(JSON.parse(stored))
    } catch { }
  }, [])

  function persist(next) {
    setEntries(next)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch { }
  }

  function addActivity(entry) {
    persist([entry, ...entries].slice(0, 20))
  }

  function removeActivity(billId) {
    persist(entries.filter((e) => e.billId !== billId))
  }
  function updateActivity(billId, updatedEntry) {
    setEntries((currentEntries) => {
      const next = currentEntries.map((entry) =>
        Number(entry.billId) === Number(billId)
          ? { ...entry, ...updatedEntry, billId: entry.billId }
          : entry
      )

      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch { }

      return next
    })
  }
  return (
    <ActivityContext.Provider
      value={{ entries, addActivity, updateActivity, removeActivity }}
    >      {children}
    </ActivityContext.Provider>
  )
}

export function useActivity() {
  const ctx = useContext(ActivityContext)
  if (!ctx) throw new Error('useActivity must be used within ActivityProvider')
  return ctx
}