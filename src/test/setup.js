import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup, configure } from '@testing-library/react'

// The default wait of 1 s is too short when the machine is busy, so a slow render failed a test now and then.
configure({ asyncUtilTimeout: 4000 })

afterEach(() => cleanup())
