import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { createContext, useContext, type ReactNode } from 'react'

const AppRouterChildrenContext = createContext<ReactNode>(null)

function AppRouterRoot() {
  return useContext(AppRouterChildrenContext)
}

const router = createRouter({
  routeTree: createRootRoute({ component: AppRouterRoot }),
  history: createMemoryHistory({ initialEntries: ['/'] }),
  defaultNotFoundComponent: () => null,
})

/** Minimal router so admin-ui `Breadcrumbs` can render `@wordpress/route` links. */
export function AppRouter({ children }: { children: ReactNode }) {
  return (
    <AppRouterChildrenContext.Provider value={children}>
      <RouterProvider router={router} />
    </AppRouterChildrenContext.Provider>
  )
}
