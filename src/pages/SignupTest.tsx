import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SignupTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Signup Flow Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link to="/signup">
                New Best-in-Class Signup
                <Badge className="ml-2 bg-green-500">NEW</Badge>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/signup-old">
                Old Signup (Backup)
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/welcome?plan=premium">
                Test Welcome Page (Premium)
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/welcome?plan=free">
                Test Welcome Page (Free)
              </Link>
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Test the new signup flow components</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupTest;