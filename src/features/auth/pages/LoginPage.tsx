import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "../auth-context";
import { AuthLayout } from "../components/AuthLayout";
import { useSubmit } from "../hooks/useSubmit";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { pending, formError, fieldErrors, submit } = useSubmit();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit(async () => {
      await login({ email, password });
      navigate(from, { replace: true });
    });
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back to VerityAI."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && <Alert>{formError}</Alert>}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <Button type="submit" className="w-full" loading={pending}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
