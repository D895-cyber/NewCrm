import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Smartphone, Camera, Wrench } from 'lucide-react';

export function MobileTestingLauncher() {
  const launchMobileTest = (hash: string) => {
    window.location.hash = hash;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-600" />
          Mobile Testing Portal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Test the FSE mobile portal and photo upload functionality
          </p>
          
          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={() => launchMobileTest('mobile-test')}
              variant="outline"
              className="justify-start"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile Testing Hub
            </Button>
            
            <Button 
              onClick={() => launchMobileTest('photo-test')}
              variant="outline"
              className="justify-start"
            >
              <Camera className="h-4 w-4 mr-2" />
              Photo Capture Test
            </Button>
            
            <Button 
              onClick={() => launchMobileTest('mobile-fse')}
              variant="outline"
              className="justify-start"
            >
              <Wrench className="h-4 w-4 mr-2" />
              FSE Mobile Portal
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 pt-2 border-t">
            💡 Tip: Use your mobile device for the best testing experience
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

