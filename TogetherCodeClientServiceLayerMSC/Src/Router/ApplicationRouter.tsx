import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router';
import LobbyScreenRoute from '@/Routes/LobbyScreenRoute';
import WorkspaceScreenRoute from '@/Routes/WorkspaceScreenRoute';

// Root Route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Lobby Route (/)
const lobbyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LobbyScreenRoute,
});

// Workspace Route (/Room/$code)
const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/Room/$code',
  component: WorkspaceScreenRoute,
});

// Route Tree
const routeTree = rootRoute.addChildren([lobbyRoute, workspaceRoute]);

export const applicationRouter = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof applicationRouter;
  }
}
