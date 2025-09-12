import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Wifi, 
  Battery, 
  Camera,
  FileText,
  Settings
} from 'lucide-react';

export function MobileTestPage() {
  const testCards = [
    {
      icon: Smartphone,
      title: "Mobile First Design",
      description: "Optimized for mobile devices with touch-friendly interfaces",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Monitor,
      title: "Responsive Layout",
      description: "Adapts seamlessly across all screen sizes",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Tablet,
      title: "Tablet Support",
      description: "Perfect experience on tablet devices",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: Wifi,
      title: "Offline Ready",
      description: "Works even without internet connection",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: Battery,
      title: "Performance Optimized",
      description: "Fast loading and efficient resource usage",
      color: "bg-red-100 text-red-600"
    },
    {
      icon: Camera,
      title: "Camera Integration",
      description: "Native camera access for photo capture",
      color: "bg-indigo-100 text-indigo-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Mobile-first container */}
      <div className="mobile-container">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="mobile-text-xl font-bold text-gray-900 mb-2">
            Mobile-First CRM System
          </h1>
          <p className="mobile-text-base text-gray-600">
            Responsive design that works perfectly on all devices
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="mobile-grid mb-8">
          {testCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color} mb-3`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="mobile-text-lg">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mobile-text-sm text-gray-600">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Demo */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Responsive Features Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Mobile Navigation</h3>
                <p className="text-sm text-blue-700">Hamburger menu with slide-out sidebar</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Touch Targets</h3>
                <p className="text-sm text-green-700">44px minimum touch targets for accessibility</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">Flexible Layout</h3>
                <p className="text-sm text-purple-700">CSS Grid and Flexbox for responsive layouts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="dark-button-primary flex-1 sm:flex-none">
            <FileText className="w-4 h-4 mr-2" />
            Test Mobile Features
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Camera className="w-4 h-4 mr-2" />
            Camera Test
          </Button>
        </div>

        {/* Responsive Text Demo */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Responsive Typography</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h1 className="mobile-text-xl font-bold">This text scales with screen size</h1>
              <h2 className="mobile-text-lg font-semibold">Mobile-first responsive design</h2>
              <p className="mobile-text-base">
                The text size automatically adjusts based on the device screen size. 
                On mobile devices, text is optimized for readability, while on larger 
                screens, it scales up for better visual hierarchy.
              </p>
              <p className="mobile-text-sm text-gray-600">
                Small text for additional information that remains readable across all devices.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Breakpoint Indicator */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            Current breakpoint: 
            <span className="font-semibold text-blue-600 ml-1">
              <span className="block sm:hidden">Mobile (&lt; 640px)</span>
              <span className="hidden sm:block md:hidden">Small (640px+)</span>
              <span className="hidden md:block lg:hidden">Medium (768px+)</span>
              <span className="hidden lg:block xl:hidden">Large (1024px+)</span>
              <span className="hidden xl:block">Extra Large (1280px+)</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
