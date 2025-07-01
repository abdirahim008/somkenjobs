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
import { Plus, Users, FileText, CheckCircle, ArrowLeft } from "lucide-react";
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

  // Update organization field when user data loads
  useEffect(() => {
    if (user && (user as any)?.companyName) {
      setJobForm(prev => ({
        ...prev,
        organization: (user as any).companyName
      }));
    }
  }, [user]);

  // Get pending users (for super admin)
  const { data: pendingUsers = [] } = useQuery({
    queryKey: ["/api/admin/pending-users"],
    enabled: (user as any)?.isAdmin === true,
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

    createJobMutation.mutate(jobData);
  };

  const handleApproveUser = (userId: number) => {
    approveUserMutation.mutate(userId);
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

        <Tabs defaultValue="create-job" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create-job" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Job
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
                  <FileText className="h-5 w-5" />
                  Create New Job Posting
                </CardTitle>
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
                    disabled={createJobMutation.isPending}
                  >
                    {createJobMutation.isPending ? "Creating..." : "Create Job Posting"}
                  </Button>
                </form>
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