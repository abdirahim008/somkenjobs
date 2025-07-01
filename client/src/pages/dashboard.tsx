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
import { Plus, Users, FileText, CheckCircle, XCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User, InsertJob } from "@shared/schema";

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
    sector: "",
    description: "",
    applicationInstructions: "",
    applicationEmail: "",
    closingDate: "",
    externalUrl: ""
  });

  // Get pending users (for super admin)
  const { data: pendingUsers = [] } = useQuery({
    queryKey: ["/api/admin/pending-users"],
    enabled: user?.role === "super_admin",
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (jobData: InsertJob) => {
      return await apiRequest("/api/jobs", {
        method: "POST",
        body: JSON.stringify(jobData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job created successfully!",
      });
      setJobForm({
        title: "",
        organization: "",
        location: "",
        sector: "",
        description: "",
        applicationInstructions: "",
        applicationEmail: "",
        closingDate: "",
        externalUrl: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
    onError: (error) => {
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
      return await apiRequest(`/api/admin/approve-user/${userId}`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User approved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve user",
        variant: "destructive",
      });
    },
  });

  const handleJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobForm.title || !jobForm.organization || !jobForm.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const jobData: InsertJob = {
      title: jobForm.title,
      organization: jobForm.organization,
      location: jobForm.location,
      sector: jobForm.sector || "Other",
      description: jobForm.description,
      applicationInstructions: jobForm.applicationInstructions,
      applicationEmail: jobForm.applicationEmail,
      closingDate: jobForm.closingDate ? new Date(jobForm.closingDate) : undefined,
      externalUrl: jobForm.externalUrl,
      datePosted: new Date(),
      externalId: `manual-${Date.now()}`,
    };

    createJobMutation.mutate(jobData);
  };

  const handleApproveUser = (userId: number) => {
    approveUserMutation.mutate(userId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "super_admin";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isAdmin ? "Super Admin Dashboard" : "Recruiter Dashboard"}
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user.firstName} {user.lastName}
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
                      placeholder="e.g. Program Manager"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="organization">Organization *</Label>
                    <Input
                      id="organization"
                      value={jobForm.organization}
                      onChange={(e) => setJobForm({ ...jobForm, organization: e.target.value })}
                      placeholder="e.g. UNICEF"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Select
                      value={jobForm.location}
                      onValueChange={(value) => setJobForm({ ...jobForm, location: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nairobi, Kenya">Nairobi, Kenya</SelectItem>
                        <SelectItem value="Mombasa, Kenya">Mombasa, Kenya</SelectItem>
                        <SelectItem value="Kisumu, Kenya">Kisumu, Kenya</SelectItem>
                        <SelectItem value="Kenya">Kenya (Multiple Locations)</SelectItem>
                        <SelectItem value="Mogadishu, Somalia">Mogadishu, Somalia</SelectItem>
                        <SelectItem value="Hargeisa, Somalia">Hargeisa, Somalia</SelectItem>
                        <SelectItem value="Somalia">Somalia (Multiple Locations)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sector">Sector</Label>
                    <Select
                      value={jobForm.sector}
                      onValueChange={(value) => setJobForm({ ...jobForm, sector: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Protection">Protection</SelectItem>
                        <SelectItem value="Food Security">Food Security</SelectItem>
                        <SelectItem value="Water and Sanitation">Water and Sanitation</SelectItem>
                        <SelectItem value="Shelter">Shelter</SelectItem>
                        <SelectItem value="Logistics">Logistics</SelectItem>
                        <SelectItem value="Human Resources">Human Resources</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Job Description</Label>
                  <Textarea
                    id="description"
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    rows={6}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="applicationEmail">Application Email</Label>
                    <Input
                      id="applicationEmail"
                      type="email"
                      value={jobForm.applicationEmail}
                      onChange={(e) => setJobForm({ ...jobForm, applicationEmail: e.target.value })}
                      placeholder="jobs@organization.org"
                    />
                  </div>
                  <div>
                    <Label htmlFor="closingDate">Closing Date</Label>
                    <Input
                      id="closingDate"
                      type="date"
                      value={jobForm.closingDate}
                      onChange={(e) => setJobForm({ ...jobForm, closingDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="applicationInstructions">Application Instructions</Label>
                  <Textarea
                    id="applicationInstructions"
                    value={jobForm.applicationInstructions}
                    onChange={(e) => setJobForm({ ...jobForm, applicationInstructions: e.target.value })}
                    placeholder="How to apply for this position..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="externalUrl">External URL (Optional)</Label>
                  <Input
                    id="externalUrl"
                    type="url"
                    value={jobForm.externalUrl}
                    onChange={(e) => setJobForm({ ...jobForm, externalUrl: e.target.value })}
                    placeholder="https://organization.org/careers/job-id"
                  />
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
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No pending user registrations</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((pendingUser: User) => (
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
  );
}