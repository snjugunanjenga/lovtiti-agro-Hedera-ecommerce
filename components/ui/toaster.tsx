"use client"

import * as React from "react"
import { Toast, ToastProvider, ToastViewport } from "@/components/ui/toast"
import { useToast, type ToasterToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }: ToasterToast) => {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

function ToastTitle({ children, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className="text-sm font-semibold" {...props}>{children}</div>
}

function ToastDescription({ children, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className="text-sm opacity-90" {...props}>{children}</div>
}
