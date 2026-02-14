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
  EyeOff,
  FileText,
  Info,
  ExternalLink,
  Bug,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FooterNav } from "@/components/layout/FooterNav";
import { profileSettingsSchema, notificationSettingsSchema, privacySettingsSchema, securitySettingsSchema, type ProfileSettings, type NotificationSettings, type PrivacySettings, type SecuritySettings } from "@/schemas/settings";
import { getBuildInfo, getVersionString, getBuildDateString } from "@/lib/utils/build-info";

/**
 * Utility function to safely format date values and prevent "Invalid Date" display
 */
const formatDateValue = (dateString: string | null | undefined): string => {
  if (!dateString || dateString === '') return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Utility function to safely format member since date
 */
const formatMemberSinceDate = (dateString: string | null | undefined): string => {
  if (!dateString || dateString === '') return 'Not available';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Not available';
    }
    // Format as MM/DD/YYYY to match test expectations
    return date.toLocaleDateString('en-US');
  } catch {
    return 'Not available';
  }
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { tier, isPremium, isEnterprise } = useTier();
  const { metadata, loading } = useUserMetadata();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'security' | 'legal' | 'about'>('profile');
  const [isSaving, setIsSaving] = useState<{
    profile: boolean;
    notifications: boolean;
    privacy: boolean;
    security: boolean;
  }>({
    profile: false,
    notifications: false,
    privacy: false,
    security: false,
  });

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

  // Security form (V1.1 - MEV Protection)
  const securityForm = useForm<SecuritySettings>({
    resolver: zodResolver(securitySettingsSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      mevProtectedMode: 'auto',
    },
  });

  // Load user data into forms
  useEffect(() => {
    if (user && metadata) {
      profileForm.reset({
        fullName: metadata?.profile?.name || user?.user_metadata?.full_name || '',
        email: user?.email || '',
        avatarUrl: metadata?.profile?.avatar_url || user?.user_metadata?.avatar_url || '',
        dateOfBirth: formatDateValue(metadata?.profile?.date_of_birth),
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
    setIsSaving(prev => ({ ...prev, profile: true }));
    
    try {
      // Show immediate feedback
      toast({
        title: "Saving changes...",
        description: "Your profile is being updated.",
        variant: "default",
      });
      
      // In a real implementation, this would save to the backend
      console.log('Saving profile data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear any previous toasts and show success
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
    } finally {
      setIsSaving(prev => ({ ...prev, profile: false }));
    }
  };

  const onNotificationSubmit = async (data: NotificationSettings) => {
    setIsSaving(prev => ({ ...prev, notifications: true }));
    
    try {
      // Show immediate feedback
      toast({
        title: "Saving preferences...",
        description: "Your notification settings are being updated.",
        variant: "default",
      });
      
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
    } finally {
      setIsSaving(prev => ({ ...prev, notifications: false }));
    }
  };

  const onPrivacySubmit = async (data: PrivacySettings) => {
    setIsSaving(prev => ({ ...prev, privacy: true }));
    
    try {
      // Show immediate feedback
      toast({
        title: "Saving settings...",
        description: "Your privacy preferences are being updated.",
        variant: "default",
      });
      
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
    } finally {
      setIsSaving(prev => ({ ...prev, privacy: false }));
    }
  };

  const onSecuritySubmit = async (data: SecuritySettings) => {
    setIsSaving(prev => ({ ...prev, security: true }));
    
    try {
      // Show immediate feedback
      toast({
        title: "Saving settings...",
        description: "Your security preferences are being updated.",
        variant: "default",
      });
      
      console.log('Saving security settings:', data);
      
      // In a real implementation, this would save to the backend via policyConfigService
      // await policyConfigService.saveUserPolicyConfig(user.id, { mevProtectedMode: data.mevProtectedMode });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Changes saved ✓",
        description: "Your security preferences have been saved.",
        variant: "success",
      });
    } catch (error) {
      console.error('Security save failed:', error);
      toast({
        title: "Security update failed",
        description: "Unable to save security settings. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(prev => ({ ...prev, security: false }));
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
                    <Button
                      variant={activeTab === 'security' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveTab('security')}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Security
                    </Button>
                    <Button
                      variant={activeTab === 'legal' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveTab('legal')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Legal & Support
                    </Button>
                    <Button
                      variant={activeTab === 'about' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveTab('about')}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      About
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
                      {formatMemberSinceDate(user?.created_at)}
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
                                <FormMessage role="alert" />
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
                                      <p>Email cannot be changed for security reasons. Contact support if you need to update your email address.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="email" 
                                    disabled 
                                    className="bg-muted cursor-not-allowed" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Your email address is used for login and notifications. This field is disabled for security - contact support to change.
                                </FormDescription>
                                <FormMessage role="alert" />
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
                              <FormMessage role="alert" />
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
                                    max={new Date().toISOString().split('T')[0]}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Your date of birth (optional) - used for age verification
                                </FormDescription>
                                <FormMessage role="alert" />
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
                                <FormMessage role="alert" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <DisabledTooltipButton 
                          type="submit" 
                          disabled={isSaving.profile || profileForm.formState.isSubmitting || !profileForm.formState.isDirty || !profileForm.formState.isValid}
                          disabledTooltip={
                            isSaving.profile || profileForm.formState.isSubmitting 
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
                          {isSaving.profile || profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
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
                                        <p>
                                          {!profileForm.getValues('phoneNumber') 
                                            ? 'Add a phone number in your profile to enable SMS notifications'
                                            : 'Receive urgent alerts via text message'
                                          }
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </FormLabel>
                                  <FormDescription>
                                    {!profileForm.getValues('phoneNumber') 
                                      ? 'Phone number required - add one in your profile first'
                                      : 'Receive urgent alerts via text message'
                                    }
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
                          disabled={isSaving.notifications || notificationForm.formState.isSubmitting || !notificationForm.formState.isDirty || !notificationForm.formState.isValid}
                          disabledTooltip={
                            isSaving.notifications || notificationForm.formState.isSubmitting 
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
                          {isSaving.notifications || notificationForm.formState.isSubmitting ? 'Saving...' : 'Save Preferences'}
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
                              <FormMessage role="alert" />
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
                          disabled={isSaving.privacy || privacyForm.formState.isSubmitting || !privacyForm.formState.isDirty || !privacyForm.formState.isValid}
                          disabledTooltip={
                            isSaving.privacy || privacyForm.formState.isSubmitting 
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
                          {isSaving.privacy || privacyForm.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
                        </DisabledTooltipButton>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Security Tab (V1.1 - MEV Protection) */}
              {activeTab === 'security' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Configure transaction security and MEV protection
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...securityForm}>
                      <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                        <FormField
                          control={securityForm.control}
                          name="mevProtectedMode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                MEV Protection Mode
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="font-semibold mb-2">MEV Protection Modes:</p>
                                    <ul className="space-y-1 text-sm">
                                      <li><strong>Off:</strong> No MEV protection. Transactions use public mempool.</li>
                                      <li><strong>Auto:</strong> MEV protection enabled automatically on supported chains (Ethereum, Goerli, Sepolia).</li>
                                      <li><strong>Force:</strong> Always require MEV protection. Blocks transactions on unsupported chains.</li>
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select MEV protection mode" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="off">
                                    <div className="flex flex-col items-start">
                                      <div className="font-medium">Off</div>
                                      <div className="text-xs text-muted-foreground">No MEV protection</div>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="auto">
                                    <div className="flex flex-col items-start">
                                      <div className="font-medium">Auto (Recommended)</div>
                                      <div className="text-xs text-muted-foreground">Enable on supported chains</div>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="force">
                                    <div className="flex flex-col items-start">
                                      <div className="font-medium">Force</div>
                                      <div className="text-xs text-muted-foreground">Always require MEV protection</div>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                MEV (Maximal Extractable Value) protection helps prevent front-running and sandwich attacks on your transactions. 
                                Currently supported on Ethereum Mainnet, Goerli, and Sepolia testnets.
                              </FormDescription>
                              <FormMessage role="alert" />
                            </FormItem>
                          )}
                        />

                        {/* Information Card */}
                        <div className="rounded-lg border bg-muted/50 p-4">
                          <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-primary mt-0.5" />
                            <div className="space-y-2">
                              <h4 className="font-medium">About MEV Protection</h4>
                              <p className="text-sm text-muted-foreground">
                                MEV protection routes your transactions through private mempools to prevent malicious actors from 
                                front-running or sandwiching your trades. This is especially important for high-value transactions.
                              </p>
                              <div className="text-sm space-y-1">
                                <p className="font-medium">Supported Chains:</p>
                                <ul className="list-disc list-inside text-muted-foreground">
                                  <li>Ethereum Mainnet (Chain ID: 1)</li>
                                  <li>Goerli Testnet (Chain ID: 5)</li>
                                  <li>Sepolia Testnet (Chain ID: 11155111)</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>

                        <DisabledTooltipButton 
                          type="submit" 
                          disabled={isSaving.security || securityForm.formState.isSubmitting || !securityForm.formState.isDirty || !securityForm.formState.isValid}
                          disabledTooltip={
                            isSaving.security || securityForm.formState.isSubmitting 
                              ? 'Saving settings...'
                              : !securityForm.formState.isDirty 
                                ? 'Make changes to enable save'
                                : !securityForm.formState.isValid
                                  ? 'Fix validation errors to save'
                                  : undefined
                          }
                          className="w-full md:w-auto"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving.security || securityForm.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
                        </DisabledTooltipButton>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Legal & Support Tab */}
              {activeTab === 'legal' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Legal & Support
                    </CardTitle>
                    <CardDescription>
                      Access legal documents and get help
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Legal Documents */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Legal Documents</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          className="justify-start h-auto p-4"
                          onClick={() => navigate('/legal/terms')}
                        >
                          <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 mt-0.5 text-muted-foreground" />
                            <div className="text-left">
                              <div className="font-medium">Terms of Service</div>
                              <div className="text-sm text-muted-foreground">
                                Our terms and conditions
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                          </div>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="justify-start h-auto p-4"
                          onClick={() => navigate('/legal/privacy')}
                        >
                          <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 mt-0.5 text-muted-foreground" />
                            <div className="text-left">
                              <div className="font-medium">Privacy Policy</div>
                              <div className="text-sm text-muted-foreground">
                                How we handle your data
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                          </div>
                        </Button>
                      </div>
                    </div>

                    {/* Support Options */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Get Support</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          className="justify-start h-auto p-4"
                          onClick={() => navigate('/legal/contact')}
                        >
                          <div className="flex items-start gap-3">
                            <HelpCircle className="w-5 h-5 mt-0.5 text-muted-foreground" />
                            <div className="text-left">
                              <div className="font-medium">Contact Support</div>
                              <div className="text-sm text-muted-foreground">
                                Get help with your account
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                          </div>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="justify-start h-auto p-4"
                          onClick={() => {
                            const mailtoLink = `mailto:bugs@alphawhale.com?subject=Bug Report&body=Please describe the bug you encountered:%0A%0ASteps to reproduce:%0A1. %0A2. %0A3. %0A%0AExpected behavior:%0A%0AActual behavior:%0A%0ABrowser: ${navigator.userAgent}%0AURL: ${window.location.href}%0ATimestamp: ${new Date().toISOString()}`;
                            window.location.href = mailtoLink;
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <Bug className="w-5 h-5 mt-0.5 text-muted-foreground" />
                            <div className="text-left">
                              <div className="font-medium">Report a Bug</div>
                              <div className="text-sm text-muted-foreground">
                                Report technical issues
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                          </div>
                        </Button>
                      </div>
                    </div>

                    {/* Quick Contact */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Quick Contact</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="font-medium">General Support</div>
                            <div className="text-sm text-muted-foreground">For account and general questions</div>
                          </div>
                          <a 
                            href="mailto:support@alphawhale.com"
                            className="text-primary hover:underline text-sm"
                          >
                            support@alphawhale.com
                          </a>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="font-medium">Bug Reports</div>
                            <div className="text-sm text-muted-foreground">For technical issues and bugs</div>
                          </div>
                          <a 
                            href="mailto:bugs@alphawhale.com"
                            className="text-primary hover:underline text-sm"
                          >
                            bugs@alphawhale.com
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      About AlphaWhale
                    </CardTitle>
                    <CardDescription>
                      App version and build information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Version Information */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Version Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="font-medium">App Version</div>
                            <div className="text-sm text-muted-foreground">Current release version</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm">{getVersionString()}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="font-medium">Build Date</div>
                            <div className="text-sm text-muted-foreground">When this version was built</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">{getBuildDateString()}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="font-medium">Environment</div>
                            <div className="text-sm text-muted-foreground">Current deployment environment</div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="capitalize">
                              {getBuildInfo().environment}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System Information */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">System Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="font-medium">Browser</div>
                            <div className="text-sm text-muted-foreground">Your current browser</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono max-w-xs truncate">
                              {navigator.userAgent.split(' ')[0]}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="font-medium">Screen Resolution</div>
                            <div className="text-sm text-muted-foreground">Current viewport size</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono">
                              {window.innerWidth} × {window.innerHeight}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                          AlphaWhale is a comprehensive blockchain analytics and portfolio management platform.
                        </p>
                        <p>
                          For technical support or questions about this version, please contact our support team.
                        </p>
                      </div>
                    </div>

                    {/* Developer Tools (Development Only) */}
                    {process.env.NODE_ENV === 'development' && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Developer Tools</h3>
                        <div className="space-y-3">
                          <Button 
                            variant="outline" 
                            className="justify-start w-full"
                            onClick={() => {
                              // Open performance debugger via global function
                              const debugWindow = window as Window & {
                                openPerformanceDebugger?: () => void;
                              };
                              if (debugWindow.openPerformanceDebugger) {
                                debugWindow.openPerformanceDebugger();
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <Activity className="w-5 h-5 mt-0.5 text-muted-foreground" />
                              <div className="text-left">
                                <div className="font-medium">Performance Debugger</div>
                                <div className="text-sm text-muted-foreground">
                                  Monitor memory usage and performance metrics
                                </div>
                              </div>
                            </div>
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Developer tools are only available in development mode
                        </div>
                      </div>
                    )}
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
