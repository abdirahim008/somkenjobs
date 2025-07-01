import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "./AuthModal";
import { User, LogOut, Shield, Building } from "lucide-react";
import type { User as UserType } from "@shared/schema";

export default function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const typedUser = user as UserType | undefined;

  if (!isAuthenticated) {
    return (
      <AuthModal>
        <Button 
          variant="outline" 
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <User className="mr-2 h-4 w-4" />
          Login / Register
        </Button>
      </AuthModal>
    );
  }

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = () => {
    if (!typedUser) return "U";
    return `${typedUser.firstName?.[0] || ""}${typedUser.lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {typedUser?.firstName} {typedUser?.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {typedUser?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Building className="mr-2 h-4 w-4" />
          <span>{typedUser?.companyName}</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          <span>{typedUser?.jobTitle}</span>
        </DropdownMenuItem>
        {typedUser?.isAdmin && (
          <DropdownMenuItem disabled>
            <Shield className="mr-2 h-4 w-4" />
            <span className="text-blue-600">Admin</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}