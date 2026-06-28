import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { showErrorToast } from "@/lib/toast-utils";

// Confirm-password is validated client-side; only token + password go to the API.
const resetFormSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormValues = z.infer<typeof resetFormSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [done, setDone] = useState(false);

  // wouter doesn't parse query strings, so read the token from the URL directly.
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") || "";
  }, []);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const resetPassword = useMutation({
    mutationFn: async (password: string): Promise<{ message: string }> => {
      const response = await apiRequest("POST", "/api/auth/reset-password", { token, password });
      return response.json();
    },
  });

  const onSubmit = async (data: ResetFormValues) => {
    try {
      await resetPassword.mutateAsync(data.password);
      setDone(true);
    } catch (error) {
      showErrorToast(
        "Reset Failed",
        error instanceof Error ? error.message : "This link may be invalid or expired.",
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        {!token ? (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Invalid Reset Link
              </CardTitle>
              <CardDescription>
                This password reset link is missing its token. Please request a new one from the login screen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setLocation("/")}>
                Go to Home
              </Button>
            </CardContent>
          </>
        ) : done ? (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Password Reset
              </CardTitle>
              <CardDescription>
                Your password has been updated. You can now log in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                style={{ backgroundColor: "#0077B5" }}
                onClick={() => setLocation("/")}
              >
                Back to Login
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Choose a New Password
              </CardTitle>
              <CardDescription>Enter and confirm your new password below.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter a new password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Re-enter your new password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <LoadingButton
                    type="submit"
                    className="w-full"
                    style={{ backgroundColor: "#0077B5" }}
                    loading={resetPassword.isPending}
                    loadingText="Resetting..."
                  >
                    Reset Password
                  </LoadingButton>
                </form>
              </Form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
