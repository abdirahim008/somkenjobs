import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, LoginUser, InsertUser } from "@shared/schema";
import { showSuccessToast } from "@/lib/toast-utils";

interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!localStorage.getItem("auth_token"),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser): Promise<AuthResponse> => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["/api/auth/user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser): Promise<{ message: string; userId: number }> => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Simulate a brief delay for loading animation
      await new Promise(resolve => setTimeout(resolve, 800));
      localStorage.removeItem("auth_token");
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
    },
    onSuccess: () => {
      showSuccessToast("Logged Out Successfully", "You have been logged out of your account");
      // Redirect to home page after success message
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    },
  });

  const logout = logoutMutation.mutate;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation,
    register: registerMutation,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}