import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description: string
  variant?: "default" | "destructive"
}

export function useToast() {
  const toast = ({ description, variant = "default" }: ToastProps) => {
    if (variant === "destructive") {
      sonnerToast.error(description)
    } else {
      sonnerToast.success(description)
    }
  }

  return { toast }
}
