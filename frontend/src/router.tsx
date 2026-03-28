import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MarketplacePage from './pages/MarketplacePage';
import CollectionsPage from './pages/CollectionsPage';
import UploadPage from './pages/UploadPage';
import MyCollectiblesPage from './pages/MyCollectiblesPage';
import UsernameNFTsPage from './pages/UsernameNFTsPage';
import UserExplorerPage from './pages/UserExplorerPage';
import ContactsPage from './pages/ContactsPage';
import ContactInvitationsPage from './pages/ContactInvitationsPage';
import MessagesPage from './pages/MessagesPage';
import SupportPage from './pages/SupportPage';
import AssetDetailPage from './pages/AssetDetailPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import PublicProfilePage from './pages/PublicProfilePage';
import CertificateValidationPage from './pages/CertificateValidationPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import PitchDeckPage from './pages/PitchDeckPage';
import WellKnownPage from './pages/WellKnownPage';
import MyCollectionPage from './pages/MyCollectionPage';

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboardPage,
});

const marketplaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/marketplace',
  component: MarketplacePage,
});

const collectionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/collections',
  component: CollectionsPage,
});

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/upload',
  component: UploadPage,
});

const myCollectiblesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/my-collectibles',
  component: MyCollectiblesPage,
});

const usernameNFTsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/username-nfts',
  component: UsernameNFTsPage,
});

const userExplorerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: UserExplorerPage,
});

const contactsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contacts',
  component: ContactsPage,
});

const contactInvitationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contact-invitations',
  component: ContactInvitationsPage,
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages',
  component: MessagesPage,
});

const supportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/support',
  component: SupportPage,
});

const assetDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/assets/$assetId',
  component: AssetDetailPage,
});

const collectionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/collections/$collectionId',
  component: CollectionDetailPage,
});

const publicProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  component: PublicProfilePage,
});

const certificateValidationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/validate',
  component: CertificateValidationPage,
});

const privacyPolicyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/privacy',
  component: PrivacyPolicyPage,
});

const pitchDeckRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pitch',
  component: PitchDeckPage,
});

const wellKnownRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/.well-known',
  component: WellKnownPage,
});

const myCollectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/my-collection',
  component: MyCollectionPage,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  profileRoute,
  adminRoute,
  marketplaceRoute,
  collectionsRoute,
  uploadRoute,
  myCollectiblesRoute,
  usernameNFTsRoute,
  userExplorerRoute,
  contactsRoute,
  contactInvitationsRoute,
  messagesRoute,
  supportRoute,
  assetDetailRoute,
  collectionDetailRoute,
  publicProfileRoute,
  certificateValidationRoute,
  privacyPolicyRoute,
  pitchDeckRoute,
  wellKnownRoute,
  myCollectionRoute,
]);
