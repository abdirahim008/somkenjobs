import { toast } from "@/hooks/use-toast"

export const showSuccessToast = (message: string, description?: string) => {
  toast({
    title: "✅ " + message,
    description,
    className: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400",
    duration: 5000,
  })
}

export const showErrorToast = (message: string, description?: string) => {
  toast({
    title: "❌ " + message,
    description,
    className: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
    duration: 6000,
  })
}

export const showWarningToast = (message: string, description?: string) => {
  toast({
    title: "⚠️ " + message,
    description,
    className: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    duration: 5000,
  })
}