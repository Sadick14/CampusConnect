'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/common/page-header';
import { ListPageSkeleton } from '@/components/common/page-skeletons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Archive,
  Download,
  Eye,
  Loader2,
  FileJson,
  FileSpreadsheet,
  Calendar,
  Database,
} from 'lucide-react';
import {
  getOrganizationArchives,
  getArchivedData,
  exportArchiveAsJSON,
  exportArchiveAsCSV,
  ArchiveMetadata,
  ArchivedData,
} from '@/services/archive';

export default function ArchivesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [archives, setArchives] = useState<ArchiveMetadata[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<ArchivedData | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [loadingArchive, setLoadingArchive] = useState(false);

  useEffect(() => {
    loadArchives();
  }, [currentUser]);

  async function loadArchives() {
    if (!currentUser?.currentOrganizationId) return;

    setLoading(true);
    try {
      const data = await getOrganizationArchives(currentUser.currentOrganizationId);
      setArchives(data.sort((a, b) => 
        new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading archives:', error);
      toast({
        title: 'Error',
        description: 'Failed to load archives',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleViewArchive(archiveId: string) {
    setLoadingArchive(true);
    try {
      const data = await getArchivedData(archiveId);
      if (data) {
        setSelectedArchive(data);
        setViewDialog(true);
      }
    } catch (error) {
      console.error('Error loading archive data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load archive data',
        variant: 'destructive',
      });
    } finally {
      setLoadingArchive(false);
    }
  }

  function handleExportJSON() {
    if (!selectedArchive) return;
    
    try {
      exportArchiveAsJSON(selectedArchive);
      toast({
        title: 'Success',
        description: 'Archive exported as JSON',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export archive',
        variant: 'destructive',
      });
    }
  }

  function handleExportCSV(collectionName: string) {
    if (!selectedArchive) return;

    try {
      const data = (selectedArchive as any)[collectionName];
      if (data && data.length > 0) {
        exportArchiveAsCSV(data, collectionName, selectedArchive.metadata.academicYearName);
        toast({
          title: 'Success',
          description: `${collectionName} exported as CSV`,
        });
      } else {
        toast({
          title: 'Info',
          description: `No ${collectionName} data to export`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }

  if (loading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Archived Data"
        description="Access and export historical academic year data"
      />

      {/* Archives List */}
      <Card>
        <CardHeader>
          <CardTitle>All Archives ({archives.length})</CardTitle>
          <CardDescription>
            Archived academic year data that can be accessed and exported
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {archives.length > 0 ? (
              archives.map((archive) => (
                <div
                  key={archive.id}
                  className="p-4 border rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Archive className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-semibold">{archive.academicYearName}</h4>
                        <Badge variant="outline">{archive.archiveType}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(archive.archivedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          <span>{archive.dataCollections.length} collections</span>
                        </div>
                      </div>

                      {/* Record Counts */}
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(archive.recordCounts).map(([collection, count]) => (
                          <Badge key={collection} variant="secondary" className="text-xs">
                            {collection}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewArchive(archive.id)}
                        disabled={loadingArchive}
                      >
                        {loadingArchive ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No archived data yet</p>
                <p className="text-sm text-muted-foreground">
                  Archives will appear here when you end academic years with archiving enabled
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Archive Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Archive: {selectedArchive?.metadata.academicYearName}
            </DialogTitle>
            <DialogDescription>
              Archived on {selectedArchive && formatDate(selectedArchive.metadata.archivedAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedArchive && (
            <div className="space-y-6">
              {/* Export Options */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Export Options</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportJSON}
                  >
                    <FileJson className="h-4 w-4 mr-1" />
                    Export All (JSON)
                  </Button>
                  
                  {selectedArchive.metadata.dataCollections.map((collection) => {
                    const count = selectedArchive.metadata.recordCounts[collection];
                    if (count === 0) return null;
                    
                    return (
                      <Button
                        key={collection}
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportCSV(collection)}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        {collection} ({count})
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Data Summary */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Data Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(selectedArchive.metadata.recordCounts).map(([collection, count]) => (
                    <Card key={collection}>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {collection.replace('_', ' ')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Students Preview */}
              {selectedArchive.students && selectedArchive.students.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">
                    Students ({selectedArchive.students.length})
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Class</th>
                            <th className="px-4 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedArchive.students.slice(0, 10).map((student: any, idx: number) => (
                            <tr key={idx} className="border-t">
                              <td className="px-4 py-2">
                                {student.firstName} {student.lastName}
                              </td>
                              <td className="px-4 py-2">{student.className || 'N/A'}</td>
                              <td className="px-4 py-2">
                                <Badge variant="outline">{student.status}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {selectedArchive.students.length > 10 && (
                        <div className="p-2 text-center text-sm text-muted-foreground bg-muted">
                          And {selectedArchive.students.length - 10} more...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
