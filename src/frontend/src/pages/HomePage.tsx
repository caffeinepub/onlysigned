import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Shield, CheckCircle, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { UserProfile } from '../backend';

export default function HomePage() {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { mutateAsync: saveProfile, isPending: isSaving } = useSaveCallerUserProfile();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
    }
  }, [userProfile]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Failed to login');
    }
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
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          OnlySigned
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Ushering in a new era of trustless digital authenticity where fakes are impossible and every certificate is verifiable on-chain
        </p>
      </div>

      {!isAuthenticated ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Welcome to OnlySigned</CardTitle>
            <CardDescription>
              Login with Internet Identity to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogin} disabled={isLoggingIn} size="lg" className="w-full">
              {isLoggingIn ? 'Logging in...' : 'Login with Internet Identity'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Status</CardTitle>
              <CardDescription>Your account information and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Principal ID:</p>
                <p className="text-xs font-mono break-all text-muted-foreground">
                  {identity.getPrincipal().toString()}
                </p>
              </div>

              {profileLoading && !isFetched ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading profile...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={userProfile ? 'h-5 w-5 text-green-500' : 'h-5 w-5 text-muted-foreground'} />
                    <span className="text-sm font-medium">
                      Profile: {userProfile ? 'Created' : 'Not created'}
                    </span>
                  </div>

                  {userProfile && (
                    <>
                      {userProfile.isAdmin && (
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">Admin Status: Active</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">User Number: {userProfile.userNumber.toString()}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{userProfile ? 'Update Profile' : 'Create Profile'}</CardTitle>
              <CardDescription>
                {userProfile ? 'Update your profile information' : 'Set up your OnlySigned profile'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userProfile && (
                  <div className="p-4 bg-muted rounded-lg mb-4">
                    <p className="text-sm font-medium mb-1">Current Profile:</p>
                    <p className="text-lg font-bold">{userProfile.displayName}</p>
                    {userProfile.bio && (
                      <p className="text-sm text-muted-foreground mt-1">{userProfile.bio}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself"
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
