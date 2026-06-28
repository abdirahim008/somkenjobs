import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema, loginUserSchema, forgotPasswordSchema, type InsertUser, type LoginUser, type ForgotPassword } from "@shared/schema";
import { UserPlus, LogIn, KeyRound, MailCheck } from "lucide-react";
import { showSuccessToast, showErrorToast, showWarningToast } from "@/lib/toast-utils";

interface AuthModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultTab?: "login" | "register";
}

export default function AuthModal({ children, open: controlledOpen, onOpenChange, defaultTab = "login" }: AuthModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Update active tab when defaultTab changes and modal opens; reset the
  // forgot-password view each time the modal opens.
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      setShowForgot(false);
      setForgotSubmitted(false);
    }
  }, [open, defaultTab]);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const forgotForm = useForm<ForgotPassword>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const forgotPassword = useMutation({
    mutationFn: async (data: ForgotPassword): Promise<{ message: string }> => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
  });

  const onForgot = async (data: ForgotPassword) => {
    try {
      await forgotPassword.mutateAsync(data);
      setForgotSubmitted(true);
    } catch (error) {
      showErrorToast(
        "Request Failed",
        error instanceof Error ? error.message : "Please try again",
      );
    }
  };

  const backToLogin = () => {
    setShowForgot(false);
    setForgotSubmitted(false);
    forgotForm.reset();
  };

  const loginForm = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      companyName: "",
      jobTitle: "",
      phoneNumber: "",
    },
  });

  const onLogin = async (data: LoginUser) => {
    try {
      await login.mutateAsync(data);
      setOpen(false);
      showSuccessToast("Login Successful", "Welcome back!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Please check your credentials";
      
      // Check if the error is specifically about pending approval
      if (errorMessage.includes("pending approval")) {
        showWarningToast("Account Pending Approval", "Your account is awaiting admin approval. You'll be able to login once your account is approved.");
      } else {
        showErrorToast("Login Failed", errorMessage);
      }
    }
  };

  const onRegister = async (data: InsertUser) => {
    try {
      await register.mutateAsync(data);
      showSuccessToast("Registration Successful", "Your account is pending admin approval. You'll be notified once approved.");
      registerForm.reset();
      setActiveTab("login");
    } catch (error) {
      showErrorToast("Registration Failed", error instanceof Error ? error.message : "Please try again");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Access Your Account</DialogTitle>
          <DialogDescription>
            Login to your existing account or register as an employer/recruiter
          </DialogDescription>
        </DialogHeader>
        
        {showForgot ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Reset Password
              </CardTitle>
              <CardDescription>
                {forgotSubmitted
                  ? "Check your email for a reset link"
                  : "Enter your account email and we'll send you a reset link"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forgotSubmitted ? (
                <div className="space-y-4 text-center">
                  <MailCheck className="h-10 w-10 mx-auto text-green-600" />
                  <p className="text-sm text-muted-foreground">
                    If an account exists for that email, a password reset link is on its way.
                    The link expires in 1 hour.
                  </p>
                  <Button variant="outline" className="w-full" onClick={backToLogin}>
                    Back to Login
                  </Button>
                </div>
              ) : (
                <Form {...forgotForm}>
                  <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-4">
                    <FormField
                      control={forgotForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <LoadingButton
                      type="submit"
                      className="w-full"
                      style={{ backgroundColor: "#0077B5" }}
                      loading={forgotPassword.isPending}
                      loadingText="Sending..."
                    >
                      Send Reset Link
                    </LoadingButton>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={backToLogin}
                        className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        ) : (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Login
                </CardTitle>
                <CardDescription>
                  Sign in to your employer/recruiter account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <LoadingButton
                      type="submit"
                      className="w-full"
                      style={{ backgroundColor: "#0077B5" }}
                      loading={login.isPending}
                      loadingText="Signing in..."
                    >
                      Sign In
                    </LoadingButton>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Register
                </CardTitle>
                <CardDescription>
                  Create an employer/recruiter account (requires admin approval)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a secure password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Organization" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="HR Manager, Recruiter, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+254 700 000 000" 
                              value={field.value || ""} 
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <LoadingButton 
                      type="submit" 
                      className="w-full" 
                      style={{ backgroundColor: "#0077B5" }}
                      loading={register.isPending}
                      loadingText="Registering..."
                    >
                      Register Account
                    </LoadingButton>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}