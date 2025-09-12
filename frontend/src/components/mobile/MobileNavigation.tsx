import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Camera, 
  FileText, 
  Smartphone, 
  Wrench,
  Home,
  ArrowRight
} from 'lucide-react';

export function MobileNavigation() {
  const navigateTo = (hash: string) => {
    window.location.hash = hash;
  };

  const goHome = () => {
    window.location.hash = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mobile Testing Portal</h1>
            <p className="text-gray-600">Choose a testing component to get started</p>
          </div>
        </div>
        <Button onClick={goHome} variant="outline" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Back to Main App
        </Button>
      </div>

      {/* Navigation Cards */}
      <div className="space-y-4">
        {/* Photo Capture Test */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateTo('photo-test')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Camera className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Photo Capture Test</h3>
                  <p className="text-gray-600">Test camera integration and photo uploads</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* FSE Mobile App */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateTo('mobile-fse')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">FSE Mobile Portal</h3>
                  <p className="text-gray-600">Full mobile interface for field service engineers</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Service Report Forms */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateTo('service-forms')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Service Report Forms</h3>
                  <p className="text-gray-600">Test mobile-optimized service report creation</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Click on any component above to start testing</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Use your mobile device for the best testing experience</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Test camera permissions and photo uploads</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Check PWA installation and offline functionality</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 mb-2">Quick Access URLs:</p>
        <div className="space-y-2">
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => navigateTo('photo-test')}
            className="text-blue-600 hover:text-blue-700"
          >
            #photo-test
          </Button>
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => navigateTo('mobile-fse')}
            className="text-green-600 hover:text-green-700"
          >
            #mobile-fse
          </Button>
        </div>
      </div>
    </div>
  );
}
