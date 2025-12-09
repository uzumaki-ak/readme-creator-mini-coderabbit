// Declare global types to avoid conflicts
import { JSX } from 'react'

declare global {
  // This helps TypeScript understand lucide-react icons as valid JSX components
  namespace JSX {
    interface IntrinsicElements {
      // Add any custom element types here if needed
    }
  }
}

// Export nothing since this is a declaration file
export {}