import { useState, useEffect, useRef } from 'react'

const POLL_INTERVAL_MS  = 30_000   // check every 30s
const WINDOW_BEFORE_MS  = 5 * 60 * 1000  // start polling 5 mins before scheduled start
const CRICAPI_KEY = import.meta.env.VITE_CRICAPI_KEY

/**
 * Returns whether a match has actually started, using CricAPI to detect delays.
 *
 * Behaviour:
 *  - More than 5 min before scheduled start → not started (no API calls)
 *  - Within 5 min window → polls CricAPI every 30s for matchStarted flag
 *  - If api_match_id is missing or API call fails → falls back to clock
 *  - Once started, stops polling
 */
export function useMatchStartCheck(match) {
  const scheduled = new Date(match.date).getTime()
  const now = Date.now()

  // Immediately true if clock is already past start (no need to poll)
  const [started, setStarted] = useState(now >= scheduled)
  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    // If admin already marked it live/done, or clock passed, skip polling
    if (match.status !== 'upcoming' || now >= scheduled) {
      setStarted(true)
      return
    }

    function startPolling() {
      if (!match.api_match_id || !CRICAPI_KEY) {
        // No API — fall back to clock at scheduled time
        const remaining = scheduled - Date.now()
        if (remaining <= 0) { setStarted(true); return }
        timeoutRef.current = setTimeout(() => setStarted(true), remaining)
        return
      }

      async function checkApi() {
        try {
          const res = await fetch(
            `https://api.cricapi.com/v1/match_info?apikey=${CRICAPI_KEY}&id=${match.api_match_id}`
          )
          const json = await res.json()
          if (json?.data?.matchStarted) {
            setStarted(true)
            clearInterval(intervalRef.current)
          }
        } catch {
          // API failed — fall back to clock
          if (Date.now() >= scheduled) setStarted(true)
        }
      }

      checkApi()
      intervalRef.current = setInterval(checkApi, POLL_INTERVAL_MS)
    }

    const msUntilWindow = (scheduled - WINDOW_BEFORE_MS) - Date.now()

    if (msUntilWindow <= 0) {
      // Already inside the 5-min window
      startPolling()
    } else {
      // Wait until 5 mins before scheduled start, then begin polling
      timeoutRef.current = setTimeout(startPolling, msUntilWindow)
    }

    return () => {
      clearTimeout(timeoutRef.current)
      clearInterval(intervalRef.current)
    }
  }, [match.id, match.status])

  return started
}
