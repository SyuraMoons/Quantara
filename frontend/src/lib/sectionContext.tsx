import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

interface SectionContextValue {
  text: string | null
  setText: (value: string | null) => void
}

const SectionContext = createContext<SectionContextValue | undefined>(undefined)

export function SectionContextProvider({ children }: { children: ReactNode }) {
  const [text, setTextState] = useState<string | null>(null)

  const setText = useCallback((value: string | null) => {
    setTextState(value)
  }, [])

  return (
    <SectionContext.Provider value={{ text, setText }}>
      {children}
    </SectionContext.Provider>
  )
}

export function useSectionContext() {
  const ctx = useContext(SectionContext)
  if (!ctx) throw new Error('useSectionContext must be used within SectionContextProvider')
  return ctx
}

