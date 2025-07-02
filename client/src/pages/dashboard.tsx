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
import { Plus, Users, FileText, CheckCircle, ArrowLeft, Edit, Trash2, Eye } from "lucide-react";
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
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  // Edit mode state
  const [editingJob, setEditingJob] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
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

        <Tabs defaultValue="my-jobs" className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="create-job" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Job
            </TabsTrigger>
            <TabsTrigger value="my-jobs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Jobs
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
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  My Job Postings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userJobsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077B5] mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading your jobs...</p>
                  </div>
                ) : userJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">You haven't posted any jobs yet</p>
                    <Button 
                      onClick={() => document.querySelector('[data-state="active"][value="create-job"]')?.click()}
                      className="bg-[#0077B5] hover:bg-[#005582]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Job
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userJobs.map((job: any) => (
                      <div key={job.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><strong>Organization:</strong> {job.organization}</p>
                              <p><strong>Location:</strong> {job.location}</p>
                              <p><strong>Sector:</strong> {job.sector || 'Not specified'}</p>
                              <p><strong>Posted:</strong> {new Date(job.datePosted).toLocaleDateString()}</p>
                              {job.deadline && (
                                <p><strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}</p>
                              )}
                            </div>
                            <div className="mt-3">
                              <Badge variant="outline" className="text-[#0077B5] border-[#0077B5]">
                                {job.experience || 'Any level'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                              className="text-[#0077B5] border-[#0077B5] hover:bg-[#0077B5] hover:text-white"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
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
                                const createJobTab = document.querySelector('[value="create-job"]') as HTMLElement;
                                if (createJobTab) createJobTab.click();
                              }}
                              className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this job posting?')) {
                                  deleteJobMutation.mutate(job.id);
                                }
                              }}
                              disabled={deleteJobMutation.isPending}
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