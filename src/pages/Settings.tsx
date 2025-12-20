/**
 * Settings Page Component
 * 
 * Enhanced Settings page with proper form validation and user experience
 * Requirements: R5.SETTINGS.NO_INVALID_PLACEHOLDERS, R5.SETTINGS.CLEAR_EXPLANATIONS
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useTier } from "@/hooks/useTier";
import { useUserMetadata } from "@/hooks/useUserMetadata";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { DisabledTooltipButton } from "@/components/ui/disabled-tooltip-button";
import { useFormButtonTooltip } from "@/hooks/useFormButtonTooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { NavigationRouter } from "@/lib/navigation/NavigationRouter";
import { 
  User, 
  Mail, 
  Calendar,
  Crown,
  Building,
  Zap,
  ArrowLeft,
  Save,
  Key,
  Settings as SettingsIcon,
  Bell,
  Shield,
  HelpCircle,
  Phone,
  Image,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FooterNav } from "@/components/layout/FooterNav";
import { profileSettingsSchema, notificationSettingsSchema, privacySettingsSchema, type ProfileSettings, type NotificationSettings, type PrivacySettings } from "@/schemas/settings";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { tier, isPremium, isEnterprise } = useTier();
  const { metadata, loading } = useUserMetadata();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy'>('profile');

  // Profile form
  const profileForm = useForm<ProfileSettings>({
    resolver: zodResolver(profileSettingsSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      avatarUrl: '',
      dateOfBirth: '',
      phoneNumber: '',
    },
  });

  // Notification form
  const notificationForm = useForm<NotificationSettings>({
    resolver: zodResolver(notificationSettingsSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      weeklyDigest: true,
      marketingEmails: false,
    },
  });

  // Privacy form
  const privacyForm = useForm<PrivacySettings>({
    resolver: zodResolver(privacySettingsSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      profileVisibility: 'public',
      showEmail: false,
      showActivity: true,
    },
  });

  // Load user data into forms
  useEffect(() => {
    if (user && metadata) {
      profileForm.reset({
        fullName: metadata?.profile?.name || user?.user_metadata?.full_name || '',
        email: user?.email || '',
        avatarUrl: metadata?.profile?.avatar_url || user?.user_metadata?.avatar_url || '',
        dateOfBirth: metadata?.profile?.date_of_birth || '',
        phoneNumber: metadata?.profile?.phone_number || '',
      });

      // Load notification preferences if available
      if (metadata?.preferences?.notifications) {
        notificationForm.reset(metadata.preferences.notifications);
      }

      // Load privacy preferences if available
      if (metadata?.preferences?.privacy) {
        privacyForm.reset(metadata.preferences.privacy);
      }
    }
  }, [user, metadata, profileForm, notificationForm, privacyForm]);

  const onProfileSubmit = async (data: ProfileSettings) => {
    try {
      // In a real implementation, this would save to the backend
      console.log('Saving profile data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Changes saved ✓",
        description: "Your profile has been successfully updated.",
        variant: "success",
      });
    } catch (error) {
      console.error('Profile save failed:', error);
      toast({
        title: "Profile update failed",
        description: "Unable to save profile changes. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const onNotificationSubmit = async (data: NotificationSettings) => {
    try {
      console.log('Saving notification preferences:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Changes saved ✓",
        description: "Your notification preferences have been saved.",
        variant: "success",
      });
    } catch (error) {
      console.error('Notification save failed:', error);
      toast({
        title: "Notification update failed",
        description: "Unable to save notification preferences. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const onPrivacySubmit = async (data: PrivacySettings) => {
    try {
      console.log('Saving privacy settings:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Changes saved ✓",
        description: "Your privacy preferences have been saved.",
        variant: "success",
      });
    } catch (error) {
      console.error('Privacy save failed:', error);
      toast({
        title: "Privacy update failed",
        description: "Unable to save privacy settings. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'enterprise':
        return <Building className="w-4 h-4 text-purple-600" />;
      default:
        return <Zap className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-yellow-100 text-yellow-800';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <nav className="space-y-2">
                    <Button
                      variant={activeTab === 'profile' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveTab('profile')}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                    <Button
                      variant={activeTab === 'notifications' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveTab('notifications')}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications
                    </Button>
                    <Button
                      variant={activeTab === 'privacy' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveTab('privacy')}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Privacy
                    </Button>
                  </nav>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Plan</span>
                    <Badge className={cn("capitalize", getTierColor(tier))}>
                      {getTierIcon(tier)}
                      <span className="ml-1">{tier}</span>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Member Since</span>
                    <span className="text-sm text-muted-foreground">
                      {user?.created_at 
                        ? new Date(user.created_at).toLocaleDateString()
                        : 'Not available'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant="outline" className="text-green-600">
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal information and account details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={profileForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter your full name" 
                                    {...field} 
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormDescription>
                                  This is your display name on the platform
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  Email Address
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Email cannot be changed for security reasons. Contact support if needed.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="email" 
                                    disabled 
                                    className="bg-muted" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Your email address is used for login and notifications
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={profileForm.control}
                          name="avatarUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Image className="w-4 h-4" />
                                Avatar URL
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://example.com/avatar.jpg" 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormDescription>
                                URL to your profile picture (optional)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={profileForm.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Date of Birth
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date" 
                                    {...field} 
                                    value={field.value || ''}
                                    placeholder="Not set"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Your date of birth (optional)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  Phone Number
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="tel" 
                                    placeholder="+1 (555) 123-4567" 
                                    {...field} 
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Used for SMS notifications and account recovery
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <DisabledTooltipButton 
                          type="submit" 
                          disabled={profileForm.formState.isSubmitting || !profileForm.formState.isDirty || !profileForm.formState.isValid}
                          disabledTooltip={
                            profileForm.formState.isSubmitting 
                              ? 'Saving changes...'
                              : !profileForm.formState.isDirty 
                                ? 'Make changes to enable save'
                                : !profileForm.formState.isValid
                                  ? 'Fix validation errors to save'
                                  : undefined
                          }
                          className="w-full md:w-auto"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                        </DisabledTooltipButton>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Choose how you want to receive notifications and updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...notificationForm}>
                      <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  Email Notifications
                                </FormLabel>
                                <FormDescription>
                                  Receive important updates and alerts via email
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="smsNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  SMS Notifications
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Requires a valid phone number in your profile</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </FormLabel>
                                <FormDescription>
                                  Receive urgent alerts via text message
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={!profileForm.getValues('phoneNumber')}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="pushNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Push Notifications</FormLabel>
                                <FormDescription>
                                  Receive browser notifications for real-time updates
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="weeklyDigest"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Weekly Digest</FormLabel>
                                <FormDescription>
                                  Receive a weekly summary of your activity and insights
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="marketingEmails"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Marketing Emails</FormLabel>
                                <FormDescription>
                                  Receive updates about new features and promotions
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <DisabledTooltipButton 
                          type="submit" 
                          disabled={notificationForm.formState.isSubmitting || !notificationForm.formState.isDirty || !notificationForm.formState.isValid}
                          disabledTooltip={
                            notificationForm.formState.isSubmitting 
                              ? 'Saving preferences...'
                              : !notificationForm.formState.isDirty 
                                ? 'Make changes to enable save'
                                : !notificationForm.formState.isValid
                                  ? 'Fix validation errors to save'
                                  : undefined
                          }
                          className="w-full md:w-auto"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {notificationForm.formState.isSubmitting ? 'Saving...' : 'Save Preferences'}
                        </DisabledTooltipButton>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Privacy Settings
                    </CardTitle>
                    <CardDescription>
                      Control your privacy and data sharing preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...privacyForm}>
                      <form onSubmit={privacyForm.handleSubmit(onPrivacySubmit)} className="space-y-6">
                        <FormField
                          control={privacyForm.control}
                          name="profileVisibility"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Profile Visibility</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select visibility level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="public">
                                    <div className="flex items-center gap-2">
                                      <Eye className="w-4 h-4" />
                                      Public - Anyone can see your profile
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="private">
                                    <div className="flex items-center gap-2">
                                      <EyeOff className="w-4 h-4" />
                                      Private - Only you can see your profile
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="friends">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      Friends - Only connected users can see
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Choose who can view your profile information
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={privacyForm.control}
                          name="showEmail"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Show Email Address</FormLabel>
                                <FormDescription>
                                  Allow others to see your email address on your profile
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={privacyForm.control}
                          name="showActivity"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Show Activity Status</FormLabel>
                                <FormDescription>
                                  Allow others to see when you were last active
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <DisabledTooltipButton 
                          type="submit" 
                          disabled={privacyForm.formState.isSubmitting || !privacyForm.formState.isDirty || !privacyForm.formState.isValid}
                          disabledTooltip={
                            privacyForm.formState.isSubmitting 
                              ? 'Saving settings...'
                              : !privacyForm.formState.isDirty 
                                ? 'Make changes to enable save'
                                : !privacyForm.formState.isValid
                                  ? 'Fix validation errors to save'
                                  : undefined
                          }
                          className="w-full md:w-auto"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {privacyForm.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
                        </DisabledTooltipButton>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Additional Actions */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                  <CardDescription>
                    Additional account management options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => navigate('/billing')}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Manage Billing
                    </Button>
                    
                    {isEnterprise && (
                      <Button 
                        variant="outline" 
                        className="justify-start"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        API Keys
                      </Button>
                    )}
                    
                    <Button 
                      variant="destructive" 
                      className="justify-start"
                      onClick={signOut}
                    >
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <FooterNav />
      </div>
    </TooltipProvider>
  );
}