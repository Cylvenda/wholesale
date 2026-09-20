"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormInput, FieldInput, PasswordInput } from "@/components/customs/form";
import { useAuthUserStore } from "@/store/auth/userAuth.store";
import { useState } from "react";
import { LoginFormSchema } from "@/components/schema/user-form-schema";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2 } from "lucide-react";
import { Suspense } from "react";
import { authUserService } from "@/api/services/auth.service";

type LoginFormValues = z.infer<typeof LoginFormSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { fetchUser } = useAuthUserStore();
  const accountCreated = searchParams.get("registered") === "1";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);

    try {
      const res = await authUserService.userLogin(data);

      if (res.status === 200) {
        // Wait briefly for cookie to sync (helps in dev)
        await new Promise((resolve) => setTimeout(resolve, 200));

        const currentUser = await fetchUser();

        if (!currentUser) {
          toast.error("Login succeeded, but failed to load your profile.");
          return;
        }

        if (!currentUser.isActive) {
          toast.warning("Your account is not activated yet.");
          return;
        }

        router.replace("/dashboard");
      }
    } catch {
      toast.error("Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-inherit">
      <FormInput
        title={"Welcome Back"}
        description={"Login to your Community Hub account to continue"}
      >
        {accountCreated && (
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold">Akaunti imeundwa kwa mafanikio.</p>
                <p>
                  Before signing in, please verify your account using the activation link we sent to your email inbox.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* EMAIL */}
          <FieldInput
            control={form.control}
            name="email"
            type="email"
            label={"Email Address"}
            placeholder={"Enter your email"}
          />

            {/* PASSWORD */}
            <PasswordInput
              control={form.control}
              name="password"
              label={"Password"}
              placeholder={"Enter your password"}
              forgetPassword={{
                text: "Forgot password?",
                location: "/reset",
              }}
            />

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-chart-3 text-primary-foreground font-bold hover:bg-chart-2 rounded-xl transition-all duration-300 shadow-md hover:shadow-chart-3/20"
            >
              {loading ? <Spinner /> : "Sign In"}
            </Button>

            </form>
      </FormInput>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
