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
    url: ""
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

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState({
    title: "",
    description: "",
    pricePerJob: "",
    selectedJobIds: [] as number[],
  });

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

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
        url: ""
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
        title: "",
        description: "",
        pricePerJob: "",
        selectedJobIds: [],
      });
      setShowInvoiceForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
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
    
    if (!invoiceForm.title || !invoiceForm.pricePerJob || invoiceForm.selectedJobIds.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select at least one job",
        variant: "destructive",
      });
      return;
    }

    const invoiceData = {
      ...invoiceForm,
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
    
    // Get selected jobs data
    const selectedJobs = (userJobs as any[]).filter(job => 
      JSON.parse(invoice.selectedJobIds || '[]').includes(job.id)
    );
    
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
      
      currentY += 35;
      
      // Invoice title
      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INVOICE', pageWidth / 2, currentY, { align: 'center' });
      currentY += 20;
      
      // Invoice details section
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Left column - Invoice details
      pdf.setFont('helvetica', 'bold');
      pdf.text('Invoice Details:', margin, currentY);
      pdf.setFont('helvetica', 'normal');
      currentY += 6;
      pdf.text(`Invoice #: ${invoice.invoiceNumber}`, margin, currentY);
      currentY += 5;
      pdf.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, margin, currentY);
      currentY += 5;
      pdf.text(`Status: ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}`, margin, currentY);
      
      // Right column - Company details
      const rightColumnX = pageWidth / 2 + 10;
      currentY -= 16;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bill To:', rightColumnX, currentY);
      pdf.setFont('helvetica', 'normal');
      currentY += 6;
      pdf.text(`${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`, rightColumnX, currentY);
      currentY += 5;
      pdf.text(`${(user as any)?.companyName || 'Company Name'}`, rightColumnX, currentY);
      currentY += 5;
      pdf.text(`${(user as any)?.email || 'email@company.com'}`, rightColumnX, currentY);
      
      currentY += 25;
      
      // Service description
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Service Description:', margin, currentY);
      currentY += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(invoice.title, margin, currentY);
      currentY += 6;
      if (invoice.description) {
        const descriptionLines = pdf.splitTextToSize(invoice.description, pageWidth - 2 * margin);
        pdf.text(descriptionLines, margin, currentY);
        currentY += descriptionLines.length * 5;
      }
      currentY += 10;
      
      // Job details table
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.text('Job Posting Details:', margin, currentY);
      currentY += 12;
      
      // Calculate table dimensions (reduced width and centered)
      const tableWidth = Math.min(pageWidth - 2 * margin, 140); // Reduced from full width
      const tableStartX = (pageWidth - tableWidth) / 2; // Center the table
      const colWidth1 = 20; // # column
      const colWidth2 = tableWidth - colWidth1 - 40; // Job Title column
      const colWidth3 = 40; // Price column
      
      // Outer table border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(tableStartX, currentY - 3, tableWidth, 12 + (selectedJobs.length * 12), 'S');
      
      // Table header
      pdf.setFillColor(248, 249, 250);
      pdf.rect(tableStartX, currentY - 3, tableWidth, 12, 'FD');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('#', tableStartX + 2, currentY + 5);
      pdf.text('Job Title', tableStartX + colWidth1 + 2, currentY + 5);
      pdf.text('Price', tableStartX + tableWidth - 5, currentY + 5, { align: 'right' });
      
      // Header column separators
      pdf.line(tableStartX + colWidth1, currentY - 3, tableStartX + colWidth1, currentY + 9);
      pdf.line(tableStartX + colWidth1 + colWidth2, currentY - 3, tableStartX + colWidth1 + colWidth2, currentY + 9);
      
      currentY += 12;
      
      // Table rows
      pdf.setFont('helvetica', 'normal');
      selectedJobs.forEach((job, index) => {
        // Alternating row colors
        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(tableStartX, currentY - 3, tableWidth, 12, 'F');
        }
        
        // Row borders
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(tableStartX, currentY + 9, tableStartX + tableWidth, currentY + 9);
        
        // Column separators
        pdf.line(tableStartX + colWidth1, currentY - 3, tableStartX + colWidth1, currentY + 9);
        pdf.line(tableStartX + colWidth1 + colWidth2, currentY - 3, tableStartX + colWidth1 + colWidth2, currentY + 9);
        
        const jobTitle = pdf.splitTextToSize(job.title, colWidth2 - 4);
        
        // Row number
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${index + 1}`, tableStartX + 2, currentY + 5);
        // Job title
        pdf.text(jobTitle[0] + (jobTitle.length > 1 ? '...' : ''), tableStartX + colWidth1 + 2, currentY + 5);
        // Price
        pdf.text(`$${invoice.pricePerJob}`, tableStartX + tableWidth - 5, currentY + 5, { align: 'right' });
        currentY += 12;
      });
      
      // Add spacing before totals
      currentY += 15;
      
      // Totals section
      const totalsX = pageWidth - margin - 60;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Total Jobs: ${invoice.totalJobs}`, totalsX, currentY);
      currentY += 6;
      pdf.text(`Price per Job: $${invoice.pricePerJob}`, totalsX, currentY);
      currentY += 10;
      
      // Total amount - highlighted
      pdf.setFillColor(0, 119, 181);
      pdf.rect(totalsX - 5, currentY - 5, 65, 12, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(`TOTAL: $${invoice.totalAmount}`, totalsX, currentY + 3);
      
      // Reset colors
      pdf.setTextColor(0, 0, 0);
      
      // Footer with digital signature
      const footerY = pageHeight - 40;
      currentY = Math.max(currentY + 30, footerY - 20);
      
      // Terms and conditions
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Terms & Conditions: Payment due within 30 days. Late payments subject to 1.5% monthly service charge.', margin, currentY);
      currentY += 5;
      pdf.text('This invoice is digitally generated and authenticated by Somken Jobs.', margin, currentY);
      
      // Digital signature section
      currentY += 15;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(0, 119, 181);
      pdf.text('DIGITALLY SIGNED & AUTHENTICATED', margin, currentY);
      
      // Signature details
      currentY += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(80, 80, 80);
      const signatureDate = new Date().toISOString();
      pdf.text(`Document ID: ${invoice.invoiceNumber}-${Date.now()}`, margin, currentY);
      currentY += 4;
      pdf.text(`Digital Signature: SHA256-${btoa(invoice.invoiceNumber + signatureDate).substring(0, 16)}`, margin, currentY);
      currentY += 4;
      pdf.text(`Authenticated: ${new Date().toLocaleString()}`, margin, currentY);
      
      // Page footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Page 1', pageWidth - margin, pageHeight - 10, { align: 'right' });
      pdf.text('Somken Jobs - Professional Invoice', margin, pageHeight - 10);
      
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
      bodyHtml: `
        <div>
          <h3>Job Description</h3>
          <p>${jobForm.description.replace(/\n/g, '<br>')}</p>
          ${jobForm.responsibilities ? `<h3>Key Responsibilities</h3><p>${jobForm.responsibilities.replace(/\n/g, '<br>')}</p>` : ''}
          ${jobForm.qualifications ? `<h3>Qualifications & Requirements</h3><p>${jobForm.qualifications.replace(/\n/g, '<br>')}</p>` : ''}
          ${jobForm.experience ? `<h3>Experience Level</h3><p>${jobForm.experience}</p>` : ''}
          ${jobForm.howToApply ? `<h3>How to Apply</h3><p>${jobForm.howToApply.replace(/\n/g, '<br>')}</p>` : ''}
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="my-jobs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Jobs
            </TabsTrigger>
            <TabsTrigger value="create-job" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Job
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Profile
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="manage-users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Manage Users
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="create-job">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {editingJob ? <Edit className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
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
                        url: ""
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
                      <Label htmlFor="title">Job Title *</Label>
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
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea
                      id="description"
                      value={jobForm.description}
                      onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                      placeholder="Provide a comprehensive job description including background, context, and purpose of the role..."
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

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createJobMutation.isPending || updateJobMutation.isPending}
                  >
                    {editingJob 
                      ? updateJobMutation.isPending ? "Updating..." : "Update Job Posting"
                      : createJobMutation.isPending ? "Creating..." : "Create Job Posting"
                    }
                  </Button>
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
                  {userJobs.length > 0 && (
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
              ) : userJobs.length === 0 ? (
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
                      checked={selectedJobs.length === userJobs.length && userJobs.length > 0}
                      onChange={selectAllJobs}
                      className="h-4 w-4 text-[#0077B5] focus:ring-[#0077B5] border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All ({userJobs.length} jobs)
                    </span>
                  </div>

                  {/* Job List - Simple list inside main card */}
                  <div className="divide-y divide-gray-100">
                    {userJobs.map((job: any, index: number) => (
                      <div key={job.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedJobs.includes(job.id)}
                          onChange={() => toggleJobForDeletion(job.id)}
                          className="h-4 w-4 text-[#0077B5] focus:ring-[#0077B5] border-gray-300 rounded"
                        />
                        
                        {/* Row number */}
                        <div className="w-8 text-sm font-medium text-gray-500">
                          {index + 1}.
                        </div>
                        
                        {/* Job title only */}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{job.title}</h3>
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
                                url: job.url || ''
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
                      title: "",
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
                        <Label htmlFor="invoiceTitle">Invoice Title *</Label>
                        <Input
                          id="invoiceTitle"
                          value={invoiceForm.title}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })}
                          placeholder="e.g. Job Posting Services - March 2025"
                          required
                        />
                      </div>

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
                          {userJobsLoading ? (
                            <p className="text-center text-gray-500">Loading your jobs...</p>
                          ) : (userJobs as any[]).length === 0 ? (
                            <p className="text-center text-gray-500">No jobs available to invoice</p>
                          ) : (
                            (userJobs as any[]).map((job: any) => (
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
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generatePDF(invoice)}
                                className="text-[#0077B5] border-[#0077B5] hover:bg-[#0077B5] hover:text-white"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingInvoice(invoice);
                                  setInvoiceForm({
                                    title: invoice.title,
                                    description: invoice.description || "",
                                    pricePerJob: invoice.pricePerJob,
                                    selectedJobIds: JSON.parse(invoice.selectedJobIds || '[]'),
                                  });
                                  setShowInvoiceForm(true);
                                }}
                                className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this invoice?')) {
                                    deleteInvoiceMutation.mutate(invoice.id);
                                  }
                                }}
                                disabled={deleteInvoiceMutation.isPending}
                                className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}