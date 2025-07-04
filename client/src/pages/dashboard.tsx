import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, FileText, CheckCircle, ArrowLeft, Edit, Trash2, Eye, Receipt, Download, DollarSign, Pen } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  // Tab management state
  const [activeTab, setActiveTab] = useState("my-jobs");

  // Job creation form state
  const [jobForm, setJobForm] = useState({
    title: "",
    organization: "",
    location: "",
    country: "",
    sector: "",
    description: "",
    howToApply: "",
    experience: "",
    qualifications: "",
    responsibilities: "",
    deadline: "",
    url: "",
    status: "published", // Add status field
    type: "job" as "job" | "tender", // Add type field
    attachmentUrl: "" // Add attachment URL field
  });

  // Update organization field when user data loads and initialize profile form
  useEffect(() => {
    if (user) {
      if ((user as any)?.companyName) {
        setJobForm(prev => ({
          ...prev,
          organization: (user as any).companyName
        }));
      }
      
      // Initialize profile form with user data
      setProfileForm({
        firstName: (user as any)?.firstName || "",
        lastName: (user as any)?.lastName || "",
        email: (user as any)?.email || "",
        phoneNumber: (user as any)?.phoneNumber || "",
        companyName: (user as any)?.companyName || "",
        position: (user as any)?.position || "",
        bio: (user as any)?.bio || ""
      });
    }
  }, [user]);

  // Get pending users (for super admin)
  const { data: pendingUsers = [] } = useQuery({
    queryKey: ["/api/admin/pending-users"],
    enabled: (user as any)?.isAdmin === true,
  });

  // Get user's jobs
  const { data: userJobs = [], isLoading: userJobsLoading } = useQuery({
    queryKey: ["/api/user/jobs"],
    enabled: !!user,
  });

  // Get user's invoices
  const { data: userInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
    enabled: !!user,
  });

  // Get all users (for super admin)
  const { data: allUsers = [], isLoading: allUsersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: (user as any)?.isAdmin === true,
  });

  // Get all jobs (for super admin)
  const { data: allJobs = [], isLoading: allJobsLoading } = useQuery({
    queryKey: ["/api/admin/jobs"],
    enabled: (user as any)?.isAdmin === true,
  });

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState({
    description: "",
    pricePerJob: "",
    selectedJobIds: [] as number[],
  });

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  // Get jobs available for billing (excludes already billed jobs)
  const { data: availableJobsForBilling = [], isLoading: availableJobsLoading } = useQuery({
    queryKey: ["/api/user/jobs/available-for-billing"],
    enabled: !!user && showInvoiceForm,
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(jobData),
      });
      if (!response.ok) {
        throw new Error(`Failed to create job: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job created successfully!",
      });
      setJobForm({
        title: "",
        organization: (user as any)?.companyName || "",
        location: "",
        country: "",
        sector: "",
        description: "",
        howToApply: "",
        experience: "",
        qualifications: "",
        responsibilities: "",
        deadline: "",
        url: "",
        status: "published",
        type: "job",
        attachmentUrl: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create job",
        variant: "destructive",
      });
    },
  });

  // Approve user mutation
  const approveUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/approve-user/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to approve user: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User approved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve user",
        variant: "destructive",
      });
    },
  });

  // Reject user mutation
  const rejectUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason?: string }) => {
      const response = await fetch(`/api/admin/reject-user/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        throw new Error(`Failed to reject user: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User registration rejected successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject user",
        variant: "destructive",
      });
    },
  });

  // Admin delete job mutation (for any job)
  const adminDeleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to delete job: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to delete job: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setSelectedJobs([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  // Bulk delete jobs mutation
  const bulkDeleteJobsMutation = useMutation({
    mutationFn: async (jobIds: number[]) => {
      const promises = jobIds.map(jobId => 
        fetch(`/api/jobs/${jobId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
          },
        })
      );
      const responses = await Promise.all(promises);
      const failedDeletes = responses.filter(response => !response.ok);
      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete ${failedDeletes.length} job(s)`);
      }
    },
    onSuccess: (_, jobIds) => {
      toast({
        title: "Success",
        description: `${jobIds.length} job(s) deleted successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setSelectedJobs([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete selected jobs",
        variant: "destructive",
      });
    },
  });

  // Edit mode state
  const [editingJob, setEditingJob] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    companyName: "",
    position: "",
    bio: ""
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest("PUT", `/api/users/${(user as any)?.id}`, profileData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success", 
        description: "Profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditingProfile(false); // Switch back to view mode
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async ({ jobId, jobData }: { jobId: number; jobData: any }) => {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(jobData),
      });
      if (!response.ok) {
        throw new Error(`Failed to update job: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job updated successfully!",
      });
      setEditingJob(null);
      queryClient.invalidateQueries({ queryKey: ["/api/user/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update job",
        variant: "destructive",
      });
    },
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(invoiceData),
      });
      if (!response.ok) {
        throw new Error(`Failed to create invoice: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice created successfully!",
      });
      setInvoiceForm({
        description: "",
        pricePerJob: "",
        selectedJobIds: [],
      });
      setShowInvoiceForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/jobs/available-for-billing"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ invoiceId, invoiceData }: { invoiceId: number; invoiceData: any }) => {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(invoiceData),
      });
      if (!response.ok) {
        throw new Error(`Failed to update invoice: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice updated successfully!",
      });
      setEditingInvoice(null);
      setShowInvoiceForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/jobs/available-for-billing"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to delete invoice: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/jobs/available-for-billing"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  // Invoice form handling
  const handleInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoiceForm.pricePerJob || invoiceForm.selectedJobIds.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in price per job and select at least one job",
        variant: "destructive",
      });
      return;
    }

    const invoiceData = {
      ...invoiceForm,
      title: "Job Posting Services", // Auto-generate title
      selectedJobIds: JSON.stringify(invoiceForm.selectedJobIds),
    };

    if (editingInvoice) {
      updateInvoiceMutation.mutate({ 
        invoiceId: editingInvoice.id, 
        invoiceData 
      });
    } else {
      createInvoiceMutation.mutate(invoiceData);
    }
  };

  // Handle job selection for invoice
  const toggleJobSelection = (jobId: number) => {
    setInvoiceForm(prev => ({
      ...prev,
      selectedJobIds: prev.selectedJobIds.includes(jobId)
        ? prev.selectedJobIds.filter(id => id !== jobId)
        : [...prev.selectedJobIds, jobId]
    }));
  };

  const toggleJobForDeletion = (jobId: number) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const selectAllJobs = () => {
    const allJobIds = (userJobs as any[]).map(job => job.id);
    setSelectedJobs(selectedJobs.length === allJobIds.length ? [] : allJobIds);
  };

  // Generate PDF with enhanced formatting
  const generatePDF = async (invoice: any) => {
    const { jsPDF } = await import('jspdf');
    
    // Get selected jobs data from the database using the stored job IDs
    const selectedJobIds = JSON.parse(invoice.selectedJobIds || '[]');
    let selectedJobs: any[] = [];
    
    if (selectedJobIds.length > 0) {
      try {
        // Fetch job details from the API
        const jobPromises = selectedJobIds.map(async (jobId: number) => {
          const response = await fetch(`/api/jobs/${jobId}`);
          if (response.ok) {
            return await response.json();
          }
          return null;
        });
        
        const jobs = await Promise.all(jobPromises);
        selectedJobs = jobs.filter(job => job !== null);
      } catch (error) {
        console.error('Error fetching job details:', error);
        // Fallback to creating dummy data from invoice info
        selectedJobs = selectedJobIds.map((id: number, index: number) => ({
          id,
          title: `Job Posting ${index + 1}`,
          organization: 'Various Organizations',
          location: 'Kenya/Somalia'
        }));
      }
    }
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let currentY = margin;
      
      // Header with company logo (using text-based logo)
      pdf.setFillColor(0, 119, 181); // #0077B5
      pdf.rect(margin, currentY, 15, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SJ', margin + 7.5, currentY + 9, { align: 'center' });
      pdf.setFontSize(18);
      pdf.setTextColor(0, 119, 181); // #0077B5
      pdf.setFont('helvetica', 'bold');
      pdf.text('Somken Jobs', margin + 20, currentY + 8);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Professional Job Board Services', margin + 20, currentY + 12);
      pdf.text('Email: info@somkenjobs.com | Web: www.somkenjobs.com', margin + 20, currentY + 16);
      
      currentY += 25;
      
      // Horizontal line separator below header
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.5);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      
      currentY += 20;
      
      // Sender information (top right)
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Sender: Somken Jobs', pageWidth - 60, currentY);
      
      // Draw a line under sender
      pdf.setDrawColor(0, 0, 0);
      pdf.line(pageWidth - 60, currentY + 3, pageWidth - 15, currentY + 3);
      
      currentY += 20;
      
      // Invoice title - large and bold like reference
      pdf.setFontSize(32);
      pdf.setTextColor(120, 120, 120);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INVOICE', margin, currentY);
      currentY += 25;
      
      // Invoice details section - two columns like reference
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      
      // Left column - Invoice details
      pdf.text(`Invoice: ${invoice.invoiceNumber}`, margin, currentY);
      pdf.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, margin, currentY + 7);
      pdf.text(`Payment Due: ${new Date(new Date(invoice.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, margin, currentY + 14);
      
      // Right column - Customer details
      pdf.text('Receiver:', pageWidth - 80, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${invoice.clientOrganization || 'Humanitarian Organization'}`, pageWidth - 80, currentY + 7);
      pdf.text(`${invoice.clientEmail || (user as any)?.email}`, pageWidth - 80, currentY + 14);
      
      currentY += 35;
      
      // Items table with clean design matching reference
      const tableStartY = currentY;
      const tableWidth = pageWidth - 2 * margin;
      const rowHeight = 8;
      
      // Table header with clean background and borders
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, currentY, tableWidth, rowHeight, 'F');
      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, currentY, tableWidth, rowHeight, 'S');
      
      // Calculate column widths to fit within table
      const col1Width = tableWidth * 0.5;  // 50% for Item Description
      const col2Width = tableWidth * 0.2;  // 20% for Price
      const col3Width = tableWidth * 0.15; // 15% for Quantity  
      const col4Width = tableWidth * 0.15; // 15% for Subtotal
      
      // Header column separators (vertical lines)
      pdf.line(margin + col1Width, currentY, margin + col1Width, currentY + rowHeight);
      pdf.line(margin + col1Width + col2Width, currentY, margin + col1Width + col2Width, currentY + rowHeight);
      pdf.line(margin + col1Width + col2Width + col3Width, currentY, margin + col1Width + col2Width + col3Width, currentY + rowHeight);
      
      // Header text with proper column positioning
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      
      pdf.text('Item Description', margin + 5, currentY + 6);
      pdf.text('Price ($)', margin + col1Width + 5, currentY + 6);
      pdf.text('Quantity', margin + col1Width + col2Width + 5, currentY + 6);
      pdf.text('Subtotal ($)', margin + col1Width + col2Width + col3Width + col4Width - 5, currentY + 6, { align: 'right' });
      
      currentY += rowHeight;
      
      // Table rows with clean alternating background like reference
      let totalAmount = 0;
      selectedJobs.forEach((job: any, index: number) => {
        const pricePerJob = parseFloat(invoice.pricePerJob || '0');
        const subtotal = pricePerJob;
        totalAmount += subtotal;
        
        // Alternating row background
        if (index % 2 === 0) {
          pdf.setFillColor(248, 248, 248);
          pdf.rect(margin, currentY, tableWidth, rowHeight, 'F');
        }
        
        // Row border (outer border)
        pdf.setDrawColor(150, 150, 150);
        pdf.setLineWidth(0.5);
        pdf.rect(margin, currentY, tableWidth, rowHeight, 'S');
        
        // Column separators (vertical lines for this row)
        pdf.line(margin + col1Width, currentY, margin + col1Width, currentY + rowHeight);
        pdf.line(margin + col1Width + col2Width, currentY, margin + col1Width + col2Width, currentY + rowHeight);
        pdf.line(margin + col1Width + col2Width + col3Width, currentY, margin + col1Width + col2Width + col3Width, currentY + rowHeight);
        
        // Row content using the same column positioning as headers
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        // Truncate job title to fit in column
        const maxTitleLength = Math.floor(col1Width / 3); // Approximate character width
        const jobTitle = job.title.length > maxTitleLength ? job.title.substring(0, maxTitleLength) + '...' : job.title;
        
        pdf.text(jobTitle, margin + 5, currentY + 6);
        pdf.text(pricePerJob.toFixed(2), margin + col1Width + 5, currentY + 6);
        pdf.text('1', margin + col1Width + col2Width + 5, currentY + 6);
        pdf.text(subtotal.toFixed(2), margin + col1Width + col2Width + col3Width + col4Width - 5, currentY + 6, { align: 'right' });
        
        currentY += rowHeight;
      });
      
      // Total row with emphasis like reference
      pdf.setFillColor(230, 230, 230);
      pdf.rect(margin, currentY, tableWidth, rowHeight, 'F');
      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, currentY, tableWidth, rowHeight, 'S');
      
      // Column separators for total row
      pdf.line(margin + col1Width, currentY, margin + col1Width, currentY + rowHeight);
      pdf.line(margin + col1Width + col2Width, currentY, margin + col1Width + col2Width, currentY + rowHeight);
      pdf.line(margin + col1Width + col2Width + col3Width, currentY, margin + col1Width + col2Width + col3Width, currentY + rowHeight);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Total ($)', margin + col1Width + col2Width + 5, currentY + 6);
      pdf.text(totalAmount.toFixed(2), margin + col1Width + col2Width + col3Width + col4Width - 5, currentY + 6, { align: 'right' });
      
      currentY += 30;
      
      // Payment information section matching reference style
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Kindly make your payment to:', margin, currentY);
      pdf.text('Bank: Somken Jobs Payment Services', margin, currentY + 7);
      pdf.text('Account: 123-456-7890', margin, currentY + 14);
      pdf.text('BIC: SOMKEN123', margin, currentY + 21);
      
      currentY += 35;
      
      // Notes section like reference
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Note: Please send a remittance advice by email to billing@somkenjobs.com', margin, currentY);
      
      currentY += 15;
      
      // Digital signature section matching reference (very compact)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(0, 119, 181); // LinkedIn blue
      pdf.text('DIGITALLY SIGNED & AUTHENTICATED', margin, currentY);
      
      currentY += 10;
      
      // Document details with very compact spacing
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      
      const documentId = `INV-${Date.now()}-NF8DI-${Math.random().toString(36).substr(2, 11).toUpperCase()}`;
      const digitalSignature = `SHA256-${Math.random().toString(36).substr(2, 20).toUpperCase()}`;
      const currentDate = new Date().toLocaleDateString('en-GB');
      const currentTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
      
      pdf.text(`Document ID: ${documentId}`, margin, currentY);
      pdf.text(`Digital Signature: ${digitalSignature}`, margin, currentY + 8);
      pdf.text(`Authenticated: ${currentDate}, ${currentTime}`, margin, currentY + 16);
      
      // Footer branding at bottom of page
      const footerY = pageHeight - 20; // 20mm from bottom
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Somken Jobs - Professional Invoice', margin, footerY);
      
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
      
      toast({
        title: "Success",
        description: "Enhanced invoice PDF generated successfully!",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error", 
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobForm.title || !jobForm.organization || !jobForm.location || !jobForm.country) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Build comprehensive job data matching ReliefWeb structure
    const jobData = {
      title: jobForm.title,
      organization: jobForm.organization,
      location: jobForm.location,
      country: jobForm.country,
      sector: jobForm.sector || "Other",
      description: jobForm.description,
      url: jobForm.url || `https://jobconnect.replit.app/jobs/internal-${Date.now()}`,
      datePosted: new Date(),
      source: "Internal",
      externalId: `internal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deadline: jobForm.deadline ? new Date(jobForm.deadline) : null,
      howToApply: jobForm.howToApply,
      experience: jobForm.experience,
      qualifications: jobForm.qualifications,
      responsibilities: jobForm.responsibilities,
      status: jobForm.status, // Include status field
      type: jobForm.type, // Include type field
      attachmentUrl: jobForm.attachmentUrl, // Include attachment URL
      bodyHtml: `
        <div>
          <h3>${jobForm.type === 'tender' ? 'Tender Description' : 'Job Description'}</h3>
          <p>${jobForm.description.replace(/\n/g, '<br>')}</p>
          ${jobForm.responsibilities ? `<h3>Key Responsibilities</h3><p>${jobForm.responsibilities.replace(/\n/g, '<br>')}</p>` : ''}
          ${jobForm.qualifications ? `<h3>Qualifications & Requirements</h3><p>${jobForm.qualifications.replace(/\n/g, '<br>')}</p>` : ''}
          ${jobForm.experience ? `<h3>Experience Level</h3><p>${jobForm.experience}</p>` : ''}
          ${jobForm.howToApply ? `<h3>How to Apply</h3><p>${jobForm.howToApply.replace(/\n/g, '<br>')}</p>` : ''}
          ${jobForm.attachmentUrl ? `<h3>Attachment</h3><p>Document: ${jobForm.attachmentUrl}</p>` : ''}
        </div>
      `.trim()
    };

    if (editingJob) {
      // Update existing job
      updateJobMutation.mutate({
        jobId: editingJob.id,
        jobData
      });
    } else {
      // Create new job
      createJobMutation.mutate(jobData);
    }
  };

  const handleApproveUser = (userId: number) => {
    approveUserMutation.mutate(userId);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileForm.firstName || !profileForm.lastName || !profileForm.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate(profileForm);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = (user as any)?.isAdmin === true;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 py-4 lg:py-8">
        <div className="mb-4 lg:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? "Super Admin Dashboard" : "Recruiter Dashboard"}
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {(user as any)?.firstName} {(user as any)?.lastName}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar Navigation - Hidden on mobile, stacked on mobile */}
          <div className="w-full lg:w-64 bg-white rounded-lg shadow-sm p-4 lg:p-6 h-fit">
            <nav className="space-y-2">
              {/* Main Navigation */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1 lg:space-y-1">
                <button
                  onClick={() => setActiveTab("my-jobs")}
                  className={`w-full text-left px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors flex items-center gap-2 lg:gap-3 text-sm lg:text-base ${
                    activeTab === "my-jobs"
                      ? "bg-[#0077B5] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FileText className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                  <span className="truncate">My Jobs</span>
                </button>
                <button
                  onClick={() => setActiveTab("create-job")}
                  className={`w-full text-left px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors flex items-center gap-2 lg:gap-3 text-sm lg:text-base ${
                    activeTab === "create-job"
                      ? "bg-[#0077B5] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Plus className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                  <span className="truncate">Create Job</span>
                </button>
                <button
                  onClick={() => setActiveTab("invoices")}
                  className={`w-full text-left px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors flex items-center gap-2 lg:gap-3 text-sm lg:text-base ${
                    activeTab === "invoices"
                      ? "bg-[#0077B5] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Receipt className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                  <span className="truncate">Invoices</span>
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full text-left px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors flex items-center gap-2 lg:gap-3 text-sm lg:text-base ${
                    activeTab === "profile"
                      ? "bg-[#0077B5] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Users className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                  <span className="truncate">Profile</span>
                </button>
              </div>

              {/* Admin Navigation */}
              {isAdmin && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2 lg:px-4">
                    Admin Functions
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-1 lg:space-y-1">
                    <button
                      onClick={() => setActiveTab("manage-users")}
                      className={`w-full text-left px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors flex items-center gap-2 lg:gap-3 text-sm lg:text-base ${
                        activeTab === "manage-users"
                          ? "bg-[#0077B5] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                      <span className="truncate">User Approvals</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("manage-all-jobs")}
                      className={`w-full text-left px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors flex items-center gap-2 lg:gap-3 text-sm lg:text-base ${
                        activeTab === "manage-all-jobs"
                          ? "bg-[#0077B5] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <FileText className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                      <span className="truncate">All Jobs</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("system-users")}
                      className={`w-full text-left px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors flex items-center gap-2 lg:gap-3 text-sm lg:text-base ${
                        activeTab === "system-users"
                          ? "bg-[#0077B5] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Users className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                      <span className="truncate">All Users</span>
                    </button>
                  </div>
                </div>
              )}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

          <TabsContent value="create-job">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {editingJob ? <Edit className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  {editingJob ? 'Edit Posting' : 'Create New Posting'}
                </CardTitle>
                {editingJob && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingJob(null);
                      setJobForm({
                        title: "",
                        organization: (user as any)?.companyName || "",
                        location: "",
                        country: "",
                        sector: "",
                        description: "",
                        howToApply: "",
                        experience: "",
                        qualifications: "",
                        responsibilities: "",
                        deadline: "",
                        url: "",
                        status: "published",
                        type: "job",
                        attachmentUrl: ""
                      });
                    }}
                    className="mt-2"
                  >
                    Cancel Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJobSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={jobForm.title}
                        onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                        placeholder="e.g. Protection Officer, Program Manager, Field Coordinator"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="organization">Organization *</Label>
                      <Input
                        id="organization"
                        value={jobForm.organization}
                        onChange={(e) => setJobForm({ ...jobForm, organization: e.target.value })}
                        placeholder="e.g. UNICEF, WHO, Save the Children"
                        required
                        readOnly={!isAdmin}
                        className={!isAdmin ? "bg-gray-100" : ""}
                        title={!isAdmin ? "Organization is auto-filled from your profile" : ""}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type *</Label>
                      <Select
                        value={jobForm.type}
                        onValueChange={(value: "job" | "tender") => setJobForm({ ...jobForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="job">Job Opportunity</SelectItem>
                          <SelectItem value="tender">Tender/Procurement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="attachment">Attachment (Optional)</Label>
                      <Input
                        id="attachment"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // For now, we'll just store the filename
                            // In a real implementation, you'd upload to a file storage service
                            setJobForm({ ...jobForm, attachmentUrl: file.name });
                          }
                        }}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#0077B5] file:text-white hover:file:bg-[#005582]"
                      />
                      {jobForm.attachmentUrl && (
                        <p className="text-sm text-gray-600 mt-1">
                          Selected: {jobForm.attachmentUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Select
                        value={jobForm.country}
                        onValueChange={(value) => {
                          setJobForm({ ...jobForm, country: value, location: "" }); // Reset location when country changes
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kenya">Kenya</SelectItem>
                          <SelectItem value="Somalia">Somalia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location">Location/City *</Label>
                      <Select
                        value={jobForm.location}
                        onValueChange={(value) => setJobForm({ ...jobForm, location: value })}
                        disabled={!jobForm.country}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={jobForm.country ? "Select location" : "Select country first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {jobForm.country === "Kenya" && (
                            <>
                              <SelectItem value="Nairobi">Nairobi</SelectItem>
                              <SelectItem value="Mombasa">Mombasa</SelectItem>
                              <SelectItem value="Kisumu">Kisumu</SelectItem>
                              <SelectItem value="Garissa">Garissa</SelectItem>
                              <SelectItem value="Eldoret">Eldoret</SelectItem>
                              <SelectItem value="Nakuru">Nakuru</SelectItem>
                              <SelectItem value="Machakos">Machakos</SelectItem>
                              <SelectItem value="Multiple locations (Kenya)">Multiple locations (Kenya)</SelectItem>
                            </>
                          )}
                          {jobForm.country === "Somalia" && (
                            <>
                              <SelectItem value="Mogadishu">Mogadishu</SelectItem>
                              <SelectItem value="Hargeisa">Hargeisa</SelectItem>
                              <SelectItem value="Baidoa">Baidoa</SelectItem>
                              <SelectItem value="Kismayo">Kismayo</SelectItem>
                              <SelectItem value="Galkayo">Galkayo</SelectItem>
                              <SelectItem value="Bosaso">Bosaso</SelectItem>
                              <SelectItem value="Multiple locations (Somalia)">Multiple locations (Somalia)</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="experience">Experience Level</Label>
                      <Select
                        value={jobForm.experience}
                        onValueChange={(value) => setJobForm({ ...jobForm, experience: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-2 years">0-2 years</SelectItem>
                          <SelectItem value="3-5 years">3-5 years</SelectItem>
                          <SelectItem value="6-9 years">6-9 years</SelectItem>
                          <SelectItem value="10+ years">10+ years</SelectItem>
                          <SelectItem value="Internship">Internship</SelectItem>
                          <SelectItem value="Volunteer">Volunteer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sector">Career Category/Sector</Label>
                    <Select
                      value={jobForm.sector}
                      onValueChange={(value) => setJobForm({ ...jobForm, sector: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select career category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Protection">Protection</SelectItem>
                        <SelectItem value="Food Security">Food Security</SelectItem>
                        <SelectItem value="Water, Sanitation and Hygiene">Water, Sanitation and Hygiene</SelectItem>
                        <SelectItem value="Shelter">Shelter</SelectItem>
                        <SelectItem value="Logistics">Logistics</SelectItem>
                        <SelectItem value="Emergency Response">Emergency Response</SelectItem>
                        <SelectItem value="Management">Management</SelectItem>
                        <SelectItem value="Administration">Administration</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Human Resources">Human Resources</SelectItem>
                        <SelectItem value="Information Management">Information Management</SelectItem>
                        <SelectItem value="Coordination">Coordination</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={jobForm.description}
                      onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                      placeholder="Provide a comprehensive description including background, context, and purpose..."
                      rows={6}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="responsibilities">Key Responsibilities</Label>
                    <Textarea
                      id="responsibilities"
                      value={jobForm.responsibilities}
                      onChange={(e) => setJobForm({ ...jobForm, responsibilities: e.target.value })}
                      placeholder="List the main duties and responsibilities for this position..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="qualifications">Qualifications & Requirements</Label>
                    <Textarea
                      id="qualifications"
                      value={jobForm.qualifications}
                      onChange={(e) => setJobForm({ ...jobForm, qualifications: e.target.value })}
                      placeholder="List required education, skills, certifications, and other qualifications..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="howToApply">How to Apply *</Label>
                    <Textarea
                      id="howToApply"
                      value={jobForm.howToApply}
                      onChange={(e) => setJobForm({ ...jobForm, howToApply: e.target.value })}
                      placeholder="Please provide detailed application instructions including required documents, email address, and any specific requirements..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deadline">Application Deadline</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={jobForm.deadline}
                        onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="url">External Job URL (Optional)</Label>
                      <Input
                        id="url"
                        type="url"
                        value={jobForm.url}
                        onChange={(e) => setJobForm({ ...jobForm, url: e.target.value })}
                        placeholder="https://organization.org/careers/job-123"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Publication Status *</Label>
                    <Select value={jobForm.status} onValueChange={(value) => setJobForm({ ...jobForm, status: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Save as Draft</SelectItem>
                        <SelectItem value="published">Publish Job</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      {jobForm.status === 'draft' ? 'Job will be saved but not visible to job seekers' : 'Job will be live and searchable immediately'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createJobMutation.isPending || updateJobMutation.isPending}
                    >
                      {editingJob 
                        ? updateJobMutation.isPending ? "Updating..." : "Update Job Posting"
                        : createJobMutation.isPending ? "Creating..." : 
                          jobForm.status === 'draft' ? "Save as Draft" : "Create & Publish Job"
                      }
                    </Button>
                    
                    {!editingJob && jobForm.status === 'published' && (
                      <Button 
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setJobForm({ ...jobForm, status: 'draft' });
                          const form = document.querySelector('form');
                          if (form) {
                            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                            form.dispatchEvent(submitEvent);
                          }
                        }}
                        disabled={createJobMutation.isPending}
                      >
                        Save as Draft Instead
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-jobs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    My Job Postings
                  </div>
                  {(userJobs as any[]).length > 0 && (
                    <div className="flex items-center gap-2">
                      {selectedJobs.length > 0 ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${selectedJobs.length} selected job(s)?`)) {
                              bulkDeleteJobsMutation.mutate(selectedJobs);
                            }
                          }}
                          disabled={bulkDeleteJobsMutation.isPending}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => setActiveTab("create-job")}
                          className="bg-[#0077B5] hover:bg-[#005582]"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New Job
                        </Button>
                      )}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              {userJobsLoading ? (
                <CardContent>
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077B5] mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading your jobs...</p>
                  </div>
                </CardContent>
              ) : (userJobs as any[]).length === 0 ? (
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">You haven't posted any jobs yet</p>
                    <Button 
                      onClick={() => setActiveTab("create-job")}
                      className="bg-[#0077B5] hover:bg-[#005582]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Job
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <>
                  {/* Select All Header */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 border-b">
                    <input
                      type="checkbox"
                      checked={selectedJobs.length === (userJobs as any[]).length && (userJobs as any[]).length > 0}
                      onChange={selectAllJobs}
                      className="h-4 w-4 text-[#0077B5] focus:ring-[#0077B5] border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All ({(userJobs as any[]).length} jobs)
                    </span>
                  </div>

                  {/* Job List - Simple list inside main card */}
                  <div className="divide-y divide-gray-100">
                    {(userJobs as any[]).map((job: any, index: number) => (
                      <div key={job.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                        {/* Only show checkbox for draft jobs */}
                        {job.status === 'draft' && (
                          <input
                            type="checkbox"
                            checked={selectedJobs.includes(job.id)}
                            onChange={() => toggleJobForDeletion(job.id)}
                            className="h-4 w-4 text-[#0077B5] focus:ring-[#0077B5] border-gray-300 rounded"
                          />
                        )}
                        
                        {/* Row number */}
                        <div className="w-8 text-sm font-medium text-gray-500">
                          {index + 1}.
                        </div>
                        
                        {/* Job title and status */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{job.title}</h3>
                            <Badge 
                              variant={job.status === 'published' ? 'default' : 'secondary'}
                              className={
                                job.status === 'published' 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                              }
                            >
                              {job.status === 'published' ? 'Live' : 'Draft'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{job.organization} • {job.location}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                            className="text-gray-500 hover:text-[#0077B5] hover:bg-gray-100 p-1"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingJob(job);
                              setJobForm({
                                title: job.title,
                                organization: job.organization,
                                location: job.location,
                                country: job.country,
                                sector: job.sector || '',
                                description: job.description,
                                howToApply: job.howToApply || '',
                                experience: job.experience || '',
                                qualifications: job.qualifications || '',
                                responsibilities: job.responsibilities || '',
                                deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
                                url: job.url || '',
                                status: (job as any).status || 'published',
                                type: (job as any).type || 'job',
                                attachmentUrl: (job as any).attachmentUrl || ''
                              });
                              // Switch to create-job tab
                              setActiveTab("create-job");
                            }}
                            className="text-gray-500 hover:text-[#0077B5] hover:bg-gray-100 p-1"
                          >
                            <Pen className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Profile Information
                  </div>
                  {!isEditingProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingProfile(true)}
                      className="text-[#0077B5] border-[#0077B5] hover:bg-[#0077B5] hover:text-white"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isEditingProfile ? (
                  // View Mode
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">First Name</Label>
                        <p className="text-lg font-medium mt-1">{(user as any)?.firstName || "Not specified"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Last Name</Label>
                        <p className="text-lg font-medium mt-1">{(user as any)?.lastName || "Not specified"}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                      <p className="text-lg font-medium mt-1">{(user as any)?.email || "Not specified"}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                        <p className="text-lg font-medium mt-1">{(user as any)?.phoneNumber || "Not specified"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Position/Title</Label>
                        <p className="text-lg font-medium mt-1">{(user as any)?.position || "Not specified"}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600">Company/Organization</Label>
                      <p className="text-lg font-medium mt-1">{(user as any)?.companyName || "Not specified"}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600">Bio/Description</Label>
                      <p className="text-lg mt-1 leading-relaxed">{(user as any)?.bio || "No bio provided"}</p>
                    </div>
                  </div>
                ) : (
                  // Edit Mode
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="flex justify-end mb-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingProfile(false)}
                        className="mr-2"
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          placeholder="Enter your first name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          placeholder="Enter your last name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="your.email@company.com"
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          value={profileForm.phoneNumber}
                          onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                          placeholder="+254 700 000 000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="position">Position/Title</Label>
                        <Input
                          id="position"
                          value={profileForm.position}
                          onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
                          placeholder="e.g. HR Manager, Recruiter"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="companyName">Company/Organization</Label>
                      <Input
                        id="companyName"
                        value={profileForm.companyName}
                        onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                        placeholder="Enter your organization name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio/Description</Label>
                      <Textarea
                        id="bio"
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        placeholder="Brief description about yourself or your role..."
                        rows={4}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[#0077B5] hover:bg-[#005582]"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Invoice Management</h2>
                <Button
                  onClick={() => {
                    setShowInvoiceForm(true);
                    setEditingInvoice(null);
                    setInvoiceForm({
                      description: "",
                      pricePerJob: "",
                      selectedJobIds: [],
                    });
                  }}
                  className="bg-[#0077B5] hover:bg-[#005582]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>

              {showInvoiceForm && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{editingInvoice ? "Edit Invoice" : "Create New Invoice"}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowInvoiceForm(false);
                          setEditingInvoice(null);
                        }}
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleInvoiceSubmit} className="space-y-6">

                      <div>
                        <Label htmlFor="invoiceDescription">Description</Label>
                        <Textarea
                          id="invoiceDescription"
                          value={invoiceForm.description}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                          placeholder="Brief description of services provided..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="pricePerJob">Price per Job (USD) *</Label>
                        <Input
                          id="pricePerJob"
                          type="number"
                          step="0.01"
                          min="0"
                          value={invoiceForm.pricePerJob}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, pricePerJob: e.target.value })}
                          placeholder="50.00"
                          required
                        />
                      </div>

                      <div>
                        <Label>Select Jobs to Include *</Label>
                        <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-4">
                          {availableJobsLoading ? (
                            <p className="text-center text-gray-500">Loading available jobs...</p>
                          ) : (availableJobsForBilling as any[]).length === 0 ? (
                            <div className="text-center text-gray-500">
                              <p>No jobs available to invoice</p>
                              <p className="text-xs mt-1">All your published jobs may have already been billed</p>
                            </div>
                          ) : (
                            (availableJobsForBilling as any[]).map((job: any) => (
                              <div key={job.id} className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  id={`job-${job.id}`}
                                  checked={invoiceForm.selectedJobIds.includes(job.id)}
                                  onChange={() => toggleJobSelection(job.id)}
                                  className="h-4 w-4 text-[#0077B5] focus:ring-[#0077B5] border-gray-300 rounded"
                                />
                                <label htmlFor={`job-${job.id}`} className="flex-1 text-sm">
                                  <div className="font-medium">{job.title}</div>
                                  <div className="text-gray-500">{job.organization} • {job.location}</div>
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                        {invoiceForm.selectedJobIds.length > 0 && (
                          <p className="text-sm text-gray-600 mt-2">
                            Selected: {invoiceForm.selectedJobIds.length} job(s) 
                            {invoiceForm.pricePerJob && ` • Total: $${(invoiceForm.selectedJobIds.length * parseFloat(invoiceForm.pricePerJob || '0')).toFixed(2)}`}
                          </p>
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-[#0077B5] hover:bg-[#005582]"
                        disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
                      >
                        {editingInvoice 
                          ? updateInvoiceMutation.isPending ? "Updating..." : "Update Invoice"
                          : createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"
                        }
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Your Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invoicesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077B5] mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading your invoices...</p>
                    </div>
                  ) : (userInvoices as any[]).length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No invoices created yet</p>
                      <Button 
                        onClick={() => {
                          setShowInvoiceForm(true);
                          setEditingInvoice(null);
                        }}
                        className="bg-[#0077B5] hover:bg-[#005582]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Invoice
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(userInvoices as any[]).map((invoice: any) => (
                        <div key={invoice.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">{invoice.title}</h3>
                                <Badge className={
                                  invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                  invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }>
                                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
                                <p><strong>Created:</strong> {new Date(invoice.createdAt).toLocaleDateString()}</p>
                                <p><strong>Jobs:</strong> {invoice.totalJobs} job(s)</p>
                                <p><strong>Total Amount:</strong> ${invoice.totalAmount}</p>
                              </div>
                              {invoice.description && (
                                <p className="text-sm text-gray-600 mt-2">{invoice.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => generatePDF(invoice)}
                                className="text-[#0077B5] hover:text-[#005582] transition-colors p-1"
                                title="Download PDF"
                              >
                                <Download className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingInvoice(invoice);
                                  setInvoiceForm({
                                    description: invoice.description || "",
                                    pricePerJob: invoice.pricePerJob,
                                    selectedJobIds: JSON.parse(invoice.selectedJobIds || '[]'),
                                  });
                                  setShowInvoiceForm(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                                title="Edit Invoice"
                              >
                                <Pen className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this invoice?')) {
                                    deleteInvoiceMutation.mutate(invoice.id);
                                  }
                                }}
                                disabled={deleteInvoiceMutation.isPending}
                                className="text-red-600 hover:text-red-800 transition-colors p-1 disabled:opacity-50"
                                title="Delete Invoice"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="manage-users">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Pending User Registrations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(pendingUsers) && pendingUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No pending user registrations</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(pendingUsers) && pendingUsers.map((pendingUser: any) => (
                        <div key={pendingUser.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {pendingUser.firstName} {pendingUser.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">{pendingUser.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{pendingUser.companyName}</Badge>
                              <Badge variant="secondary">{pendingUser.jobTitle}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveUser(pendingUser.id)}
                              disabled={approveUserMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectUserMutation.mutate({ userId: pendingUser.id, reason: "Admin rejected" })}
                              disabled={rejectUserMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="manage-all-jobs">
              <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      All Jobs in System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allJobsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077B5] mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading jobs...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(allJobs as any[])?.map((job: any) => (
                          <div 
                            key={job.id} 
                            className="p-3 border rounded hover:bg-blue-50 cursor-pointer"
                            onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                          >
                            <h3 className="text-blue-600 hover:text-blue-800 font-medium">
                              {job.title}
                            </h3>
                          </div>
                        )) || <p className="text-gray-500">No jobs found</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value="system-users">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      All System Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allUsersLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077B5] mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading users...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(allUsers as any[])?.map((user: any) => (
                          <div key={user.id} className="p-3 border rounded">
                            <h3 className="font-medium">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        )) || <p className="text-gray-500">No users found</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            </Tabs>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}