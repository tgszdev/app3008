declare module 'react-to-print' {
  import { ComponentType, ReactInstance, RefObject } from 'react'

  export interface ReactToPrintProps {
    bodyClass?: string
    content: () => ReactInstance | null
    copyStyles?: boolean
    documentTitle?: string
    fonts?: { family: string; source: string }[]
    onAfterPrint?: () => void | Promise<void>
    onBeforeGetContent?: () => void | Promise<void>
    onBeforePrint?: () => void | Promise<void>
    onPrintError?: (errorLocation: string, error: Error) => void
    pageStyle?: string | (() => string)
    print?: (iframe: HTMLIFrameElement) => void | Promise<any>
    removeAfterPrint?: boolean
    suppressErrors?: boolean
    nonce?: string
    trigger?: () => React.ReactElement
  }

  export interface UseReactToPrintOptions {
    bodyClass?: string
    content: () => ReactInstance | null
    copyStyles?: boolean
    documentTitle?: string
    fonts?: { family: string; source: string }[]
    onAfterPrint?: () => void | Promise<void>
    onBeforeGetContent?: () => void | Promise<void>
    onBeforePrint?: () => void | Promise<void>
    onPrintError?: (errorLocation: string, error: Error) => void
    pageStyle?: string | (() => string)
    print?: (iframe: HTMLIFrameElement) => void | Promise<any>
    removeAfterPrint?: boolean
    suppressErrors?: boolean
    nonce?: string
  }

  export function useReactToPrint(options: UseReactToPrintOptions): () => void

  const ReactToPrint: ComponentType<ReactToPrintProps>
  export default ReactToPrint
}