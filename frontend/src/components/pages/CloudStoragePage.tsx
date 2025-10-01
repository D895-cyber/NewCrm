import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Cloud,
  Folder,
  FileImage,
  HardDrive,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  Database,
  Server
} from "lucide-react";
import { apiClient } from "../../utils/api/client";

interface CloudStats {
  totalFolders: number;
  totalFiles: number;
  totalSize: number;
  foldersBySerial: {
    [key: string]: {
      visits: number;
      files: number;
      size: number;
    };
  };
  cloudinaryUsage?: {
    plan: string;
    credits: {
      usage: number;
      limit: number;
      used_percent: number;
    };
    objects: {
      usage: number;
    };
    bandwidth: {
      usage: number;
      credits_usage: number;
    };
    storage: {
      usage: number;
      credits_usage: number;
    };
    requests: number;
  };
}

interface FolderDetails {
  serialNumber: string;
  visits: number;
  files: number;
  size: number;
  lastModified: string;
}

export function CloudStoragePage() {
  const [cloudStats, setCloudStats] = useState<CloudStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderPhotos, setFolderPhotos] = useState<any[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

  useEffect(() => {
    loadCloudStats();
  }, []);

  const loadCloudStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const stats = await apiClient.getCloudStats();
      setCloudStats(stats);
    } catch (err: any) {
      console.error('Error loading cloud stats:', err);
      setError('Failed to load cloud storage statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolderPhotos = async (serialNumber: string) => {
    try {
      setIsLoadingPhotos(true);
      setError(null);
      
      // Get all service visits for this serial number
      const visits = await apiClient.getServiceVisitsByProjector(serialNumber);
      
      // Collect all photos from these visits
      const allPhotos: any[] = [];
      visits.forEach((visit: any) => {
        if (visit.photos && visit.photos.length > 0) {
          visit.photos.forEach((photo: any) => {
            allPhotos.push({
              ...photo,
              visitId: visit.visitId,
              visitDate: visit.scheduledDate,
              visitType: visit.visitType
            });
          });
        }
      });
      
      setFolderPhotos(allPhotos);
      setSelectedFolder(serialNumber);
      setShowFolderModal(true);
    } catch (err: any) {
      console.error('Error loading folder photos:', err);
      setError('Failed to load folder photos');
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCloudinaryUsagePercentage = () => {
    if (!cloudStats) return 0;
    // Use the actual usage percentage from Cloudinary
    return cloudStats.cloudinaryUsage?.credits?.used_percent || 0;
  };

  const getCloudinaryColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const foldersList: FolderDetails[] = cloudStats ? Object.entries(cloudStats.foldersBySerial).map(([serial, data]) => ({
    serialNumber: serial,
    visits: data.visits,
    files: data.files,
    size: data.size,
    lastModified: new Date().toLocaleDateString() // This would be calculated from actual file dates
  })) : [];

  return (
    <>
      {/* Header */}
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Cloud Storage</h1>
            <p className="text-sm text-gray-300 mt-1">Manage and monitor cloud storage for service visit photos</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={loadCloudStats}
              disabled={isLoading}
              className="dark-button-secondary gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-900 bg-opacity-30 rounded-lg border border-red-600">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : cloudStats ? (
          <>
            {/* Storage Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="dark-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Folders</CardTitle>
                  <Folder className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{cloudStats.totalFolders}</div>
                  <p className="text-xs text-gray-200">
                    Serial number folders
                  </p>
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Files</CardTitle>
                  <FileImage className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{cloudStats.totalFiles}</div>
                  <p className="text-xs text-gray-200">
                    Photos uploaded
                  </p>
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Storage Used</CardTitle>
                  <HardDrive className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{formatFileSize(cloudStats.cloudinaryUsage?.storage?.usage || 0)}</div>
                  <p className="text-xs text-gray-200">
                    {getCloudinaryUsagePercentage().toFixed(1)}% of credits used
                  </p>
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Cloudinary Plan</CardTitle>
                  <Server className="h-4 w-4 text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {cloudStats.cloudinaryUsage?.plan || 'Free'}
                  </div>
                  <p className="text-xs text-gray-200">
                    {cloudStats.cloudinaryUsage?.credits?.usage || 0} / {cloudStats.cloudinaryUsage?.credits?.limit || 25} credits used
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Cloudinary Usage */}
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white">Cloudinary Usage</CardTitle>
                <CardDescription className="text-gray-300">
                  Cloudinary storage and bandwidth usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-dark-bg rounded-lg">
                    <div className="text-lg font-bold text-white">
                      {cloudStats.cloudinaryUsage?.objects?.usage || 0}
                    </div>
                    <div className="text-xs text-gray-200">Images</div>
                  </div>
                  <div className="text-center p-4 bg-dark-bg rounded-lg">
                    <div className="text-lg font-bold text-white">
                      {formatFileSize(cloudStats.cloudinaryUsage?.storage?.usage || 0)}
                    </div>
                    <div className="text-xs text-gray-200">Storage</div>
                  </div>
                  <div className="text-center p-4 bg-dark-bg rounded-lg">
                    <div className="text-lg font-bold text-white">
                      {formatFileSize(cloudStats.cloudinaryUsage?.bandwidth?.usage || 0)}
                    </div>
                    <div className="text-xs text-gray-200">Bandwidth</div>
                  </div>
                  <div className="text-center p-4 bg-dark-bg rounded-lg">
                    <div className="text-lg font-bold text-white">
                      {cloudStats.cloudinaryUsage?.requests || 0}
                    </div>
                    <div className="text-xs text-gray-200">Requests</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Folders by Serial Number */}
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white">Folders by Serial Number</CardTitle>
                <CardDescription className="text-gray-300">
                  Storage breakdown by projector serial number
                </CardDescription>
              </CardHeader>
              <CardContent>
                {foldersList.length > 0 ? (
                  <div className="space-y-4">
                    {foldersList.map((folder) => (
                      <div key={folder.serialNumber} className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-dark-color">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Folder className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-white">{folder.serialNumber}</h3>
                            <p className="text-xs text-gray-400">
                              {folder.visits} visits, {folder.files} files
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">{formatFileSize(folder.size)}</p>
                            <p className="text-xs text-gray-400">{folder.files} files</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="dark-button-secondary"
                              onClick={() => loadFolderPhotos(folder.serialNumber)}
                              disabled={isLoadingPhotos}
                            >
                              {isLoadingPhotos ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="dark-button-secondary"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Cloud className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-300">No cloud storage folders found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Storage Actions */}
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white">Storage Actions</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage cloud storage and perform maintenance tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="dark-button-secondary"
                    onClick={() => {
                      // Implement backup functionality
                      alert('Backup functionality coming soon');
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Backup Storage
                  </Button>
                  <Button
                    variant="outline"
                    className="dark-button-secondary"
                    onClick={() => {
                      // Implement cleanup functionality
                      alert('Cleanup functionality coming soon');
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cleanup Old Files
                  </Button>
                  <Button
                    variant="outline"
                    className="dark-button-secondary"
                    onClick={() => {
                      // Implement analytics functionality
                      alert('Analytics functionality coming soon');
                    }}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Storage Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12">
            <Cloud className="w-12 h-12 mx-auto mb-4 text-dark-secondary" />
            <p className="text-dark-secondary">No cloud storage data available</p>
          </div>
        )}
      </div>

      {/* Folder Photos Modal */}
      {showFolderModal && selectedFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-dark-bg border-2 border-dark-color rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Folder: {selectedFolder}</h2>
                <p className="text-sm text-gray-300 mt-1">
                  {folderPhotos.length} photos • {formatFileSize(folderPhotos.reduce((sum, photo) => sum + (photo.fileSize || 0), 0))}
                </p>
              </div>
              <Button
                onClick={() => setShowFolderModal(false)}
                className="text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600"
              >
                ×
              </Button>
            </div>

            {folderPhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {folderPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-dark-bg border border-dark-color rounded-lg overflow-hidden">
                      <img
                        src={photo.cloudUrl || photo.path || '/placeholder-image.jpg'}
                        alt={photo.description || photo.originalName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          // If both cloudUrl and path fail, show placeholder
                          if (e.currentTarget.src !== 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjM0I0MjU5Ii8+CjxwYXRoIGQ9Ik02MCAxMDBMMTAwIDgwTDE0MCAxMDBMMTgwIDEyMEgxNDBMMTAwIDE0MEw2MCAxMjBINjBaIiBmaWxsPSIjN0M4Q0E5Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIxMCIgZmlsbD0iIzdDOENBOSIvPgo8L3N2Zz4K') {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjM0I0MjU5Ii8+CjxwYXRoIGQ9Ik02MCAxMDBMMTAwIDgwTDE0MCAxMDBMMTgwIDEyMEgxNDBMMTAwIDE0MEw2MCAxMjBINjBaIiBmaWxsPSIjN0M4Q0E5Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIxMCIgZmlsbD0iIzdDOENBOSIvPgo8L3N2Zz4K';
                          }
                        }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-300">
                      <div className="font-medium text-white">{photo.visitId}</div>
                      <div className="text-gray-400">{photo.category}</div>
                      <div className="text-gray-400">{new Date(photo.uploadedAt).toLocaleDateString()}</div>
                      {!photo.cloudUrl && photo.path && photo.path.startsWith('blob:') && (
                        <div className="text-yellow-400 text-xs mt-1">⚠️ Local file (not uploaded)</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileImage className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-300">No photos found in this folder</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 