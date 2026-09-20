"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { authUserService } from "@/api/services/auth.service"
import { ResetConfirmFormSchema } from "@/components/schema/user-form-schema"
import { FieldInput, FormInput, PasswordInput } from "@/components/customs/form"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "react-toastify"

type Values = z.infer<typeof ResetConfirmFormSchema>

export default function ResetConfirmPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const form = useForm<Values>({ resolver: zodResolver(ResetConfirmFormSchema), defaultValues: { newPassword: "", confirmPassword: "" } })

  async function submit(values: Values) {
    setLoading(true)
    try {
      await authUserService.confirmPasswordReset({ uid, token, new_password: values.newPassword })
      toast.success("Password updated. You can now sign in.")
      router.replace("/login")
    } catch { toast.error("Could not reset your password. The link may have expired.") }
    finally { setLoading(false) }
  }

  return <FormInput title="Set a new password" description="Choose a new password for your account.">
    <form onSubmit={form.handleSubmit(submit)} className="mt-4 space-y-6">
      <PasswordInput control={form.control} name="newPassword" label="New password" placeholder="Enter a new password" />
      <FieldInput control={form.control} name="confirmPassword" type="password" label="Confirm password" placeholder="Repeat your new password" />
      <Button type="submit" disabled={loading} className="w-full py-6">{loading ? <Spinner /> : "Update password"}</Button>
    </form>
  </FormInput>
}
