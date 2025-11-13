'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit2, 
  Trash2,
  DollarSign,
  TrendingUp,
  Calendar,
  PieChart,
  Download
} from 'lucide-react';
import { 
  getExpenditures,
  createExpenditure,
  updateExpenditure,
  deleteExpenditure,
  type Expenditure,
  type ExpenditureCategory,
  type PaymentMethod
} from '@/services/expenditure';
import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { formatCurrency } from '@/lib/currency';

const CATEGORIES: ExpenditureCategory[] = [
  'Salaries',
  'Utilities',
  'Supplies',
  'Maintenance',
  'Transport',
  'Food',
  'Technology',
  'Events',
  'Other'
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Cheque',
  'Bank Transfer',
  'Mobile Money',
  'Other'
];

// Local helper (kept client-side) to calculate totals by category.
// We intentionally keep this in the UI so it's synchronous and not treated as a Server Action.
function calculateCategoryTotals(expenditures: Expenditure[]): Record<ExpenditureCategory, number> {
  const totals: Record<ExpenditureCategory, number> = {
    Salaries: 0,
    Utilities: 0,
    Supplies: 0,
    Maintenance: 0,
    Transport: 0,
    Food: 0,
    Technology: 0,
    Events: 0,
    Other: 0
  };

  expenditures.forEach(exp => {
    totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
  });

  return totals;
}

interface ExpenditureFormData {
  description: string;
  amount: number;
  category: ExpenditureCategory;
  date: string;
  paymentMethod: PaymentMethod;
  recipient: string;
  referenceNumber: string;
  notes: string;
}

export default function ExpenditurePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpenditure, setEditingExpenditure] = useState<Expenditure | null>(null);
  const [formData, setFormData] = useState<ExpenditureFormData>({
    description: '',
    amount: 0,
    category: 'Other',
    date: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'Cash',
    recipient: '',
    referenceNumber: '',
    notes: ''
  });

  // Load data on mount and when filters change
  useEffect(() => {
    if (user?.currentOrganizationId) {
      loadExpenditures();
    }
  }, [user?.currentOrganizationId, selectedCategory, dateRange]);

  const loadExpenditures = async () => {
    try {
      setLoading(true);
      const data = await getExpenditures(
        user!.currentOrganizationId!,
        (selectedCategory && selectedCategory !== 'all') ? selectedCategory as ExpenditureCategory : undefined,
        dateRange.start,
        dateRange.end
      );
      setExpenditures(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load expenditures',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (expenditure?: Expenditure) => {
    if (expenditure) {
      setEditingExpenditure(expenditure);
      setFormData({
        description: expenditure.description,
        amount: expenditure.amount,
        category: expenditure.category,
        date: expenditure.date,
        paymentMethod: expenditure.paymentMethod || 'Cash',
        recipient: expenditure.recipient || '',
        referenceNumber: expenditure.referenceNumber || '',
        notes: expenditure.notes || ''
      });
    } else {
      setEditingExpenditure(null);
      setFormData({
        description: '',
        amount: 0,
        category: 'Other',
        date: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'Cash',
        recipient: '',
        referenceNumber: '',
        notes: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSaveExpenditure = async () => {
    try {
      // Validation
      if (!formData.description || formData.amount <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please provide a description and valid amount',
          variant: 'destructive'
        });
        return;
      }

      setSaving(true);
      
      const expenditureData = {
        ...formData,
        organizationId: user!.currentOrganizationId!,
        recordedBy: user!.id
      };

      if (editingExpenditure) {
        await updateExpenditure(editingExpenditure.id, expenditureData);
        toast({
          title: 'Success',
          description: 'Expenditure updated successfully'
        });
      } else {
        await createExpenditure(expenditureData);
        toast({
          title: 'Success',
          description: 'Expenditure added successfully'
        });
      }
      
      setDialogOpen(false);
      await loadExpenditures();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save expenditure',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpenditure = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expenditure?')) return;
    
    try {
      await deleteExpenditure(id);
      toast({
        title: 'Success',
        description: 'Expenditure deleted successfully'
      });
      await loadExpenditures();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete expenditure',
        variant: 'destructive'
      });
    }
  };

  const getCategoryBadge = (category: ExpenditureCategory) => {
    const colors: Record<ExpenditureCategory, string> = {
      Salaries: 'bg-blue-500',
      Utilities: 'bg-yellow-500',
      Supplies: 'bg-green-500',
      Maintenance: 'bg-orange-500',
      Transport: 'bg-purple-500',
      Food: 'bg-pink-500',
      Technology: 'bg-indigo-500',
      Events: 'bg-red-500',
      Other: 'bg-gray-500'
    };
    
    return (
      <Badge className={`${colors[category]} text-white`}>
        {category}
      </Badge>
    );
  };

  const calculateStats = () => {
    const total = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryTotals = calculateCategoryTotals(expenditures);
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    
    return {
      total,
      count: expenditures.length,
      average: expenditures.length > 0 ? total / expenditures.length : 0,
      topCategory: topCategory ? topCategory[0] : 'None',
      topCategoryAmount: topCategory ? topCategory[1] : 0,
      categoryTotals
    };
  };

  const stats = calculateStats();
  const categoryTotals = Object.entries(stats.categoryTotals)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenditure Management</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage school expenditures
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expenditure
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenditure</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.count} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.average)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <PieChart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              {stats.topCategory}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.topCategoryAmount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Date Range</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {format(new Date(dateRange.start), 'MMM dd')} - {format(new Date(dateRange.end), 'MMM dd')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {categoryTotals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Expenditure by category for selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categoryTotals.map(([category, amount]) => {
                const percentage = (amount / stats.total) * 100;
                return (
                  <div key={category} className="flex items-center gap-4">
                    <div className="w-32">
                      {getCategoryBadge(category as ExpenditureCategory)}
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-40 text-right">
                      <div className="font-semibold">
                        {formatCurrency(amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenditure List */}
      <Card>
        <CardHeader>
          <CardTitle>Expenditure Records</CardTitle>
          <CardDescription>View and manage expenditure records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="category-filter">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>

          {/* Expenditure Table */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : expenditures.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No expenditures found</p>
              <p className="text-sm">Add expenditures to start tracking your expenses</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenditures.map(expenditure => (
                    <TableRow key={expenditure.id}>
                      <TableCell>
                        {format(new Date(expenditure.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{expenditure.description}</div>
                          {expenditure.referenceNumber && (
                            <div className="text-xs text-muted-foreground">
                              Ref: {expenditure.referenceNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(expenditure.category)}
                      </TableCell>
                      <TableCell>{expenditure.recipient || '-'}</TableCell>
                      <TableCell>{expenditure.paymentMethod || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(expenditure.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(expenditure)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpenditure(expenditure.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Expenditure Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExpenditure ? 'Edit Expenditure' : 'Add New Expenditure'}
            </DialogTitle>
            <DialogDescription>
              Enter the expenditure details below
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  placeholder="e.g., Teacher salaries, Electricity bill"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as ExpenditureCategory })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as PaymentMethod })}
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient/Vendor</Label>
                <Input
                  id="recipient"
                  placeholder="e.g., ABC Supplies Ltd"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                placeholder="Receipt or invoice number"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveExpenditure} disabled={saving}>
              {saving ? 'Saving...' : editingExpenditure ? 'Update Expenditure' : 'Add Expenditure'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}