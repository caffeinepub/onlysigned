import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { UserProfile } from '../backend';

export default function HomePage() {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { mutateAsync: saveProfile, isPending: isSaving } = useSaveCallerUserProfile();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Failed to login');
    }
  };

  const handleLogout = async () => {
    await clear();
    toast.success('Logged out successfully');
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    try {
      const profile: UserProfile = {
        principal: identity!.getPrincipal(),
        displayName: displayName.trim(),
        bio: bio.trim(),
        isCreator: false,
        isAdmin: false,
        isVerified: false,
        isTrustedParty: false,
        userNumber: BigInt(0),
      };

      await saveProfile(profile);
      toast.success('Profile saved successfully');
    } catch (error: any) {
      console.error('Save profile error:', error);
      toast.error(error.message || 'Failed to save profile');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">OnlySigned Platform</h1>
          <p className="text-muted-foreground">
            Digital collectibles platform with blockchain authentication
          </p>
        </div>

        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Backend Implementation Required</AlertTitle>
          <AlertDescription>
            The backend is currently incomplete. Most features are not available. Only basic authentication and user profile management are functional.
          </AlertDescription>
        </Alert>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Login with Internet Identity to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isAuthenticated ? (
              <Button onClick={handleLogin} disabled={isLoggingIn} size="lg" className="w-full">
                {isLoggingIn ? 'Logging in...' : 'Login with Internet Identity'}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Connected Principal:</p>
                  <p className="text-xs font-mono break-all">
                    {identity.getPrincipal().toString()}
                  </p>
                </div>
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  Logout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                {userProfile ? 'Update your profile information' : 'Create your profile'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading profile...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userProfile && (
                    <div className="p-4 bg-muted rounded-lg mb-4">
                      <p className="text-sm font-medium">Current Profile:</p>
                      <p className="text-lg font-bold">{userProfile.displayName}</p>
                      {userProfile.bio && (
                        <p className="text-sm text-muted-foreground mt-1">{userProfile.bio}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        {userProfile.isAdmin && (
                          <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-2 py-1 rounded">
                            Admin
                          </span>
                        )}
                        {userProfile.isCreator && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded">
                            Creator
                          </span>
                        )}
                        {userProfile.isVerified && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={userProfile?.displayName || 'Enter your display name'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={userProfile?.bio || 'Tell us about yourself'}
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? 'Saving...' : userProfile ? 'Update Profile' : 'Create Profile'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
