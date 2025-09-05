declare module 'react-to-print' {
  import { ReactInstance, RefObject } from 'react'

  export interface UseReactToPrintOptions {
    bodyClass?: string
    content: () => ReactInstance | null
    copyStyles?: boolean
    documentTitle?: string
    fonts?: { family: string; source: string }[]
    onAfterPrint?: () => void
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

  export interface ReactToPrintProps extends UseReactToPrintOptions {
    trigger?: () => React.ReactElement
  }

  export default class ReactToPrint extends React.Component<ReactToPrintProps> {}
}