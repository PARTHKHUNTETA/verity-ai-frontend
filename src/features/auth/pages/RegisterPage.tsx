import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "../auth-context";
import { AuthLayout } from "../components/AuthLayout";
import { useSubmit } from "../hooks/useSubmit";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", organizationName: "" });
  const { pending, formError, fieldErrors, submit } = useSubmit();

  const update = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit(async () => {
      await register({ ...form, name: form.name.trim() || undefined });
      navigate("/", { replace: true });
    });
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="You'll be the owner of a new organization."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && <Alert>{formError}</Alert>}
        <Input
          label="Your name"
          autoComplete="name"
          value={form.name}
          onChange={update("name")}
          error={fieldErrors.name}
          hint="Optional"
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update("email")}
          error={fieldErrors.email}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          value={form.password}
          onChange={update("password")}
          error={fieldErrors.password}
          hint="At least 10 characters"
        />
        <Input
          label="Organization name"
          autoComplete="organization"
          required
          value={form.organizationName}
          onChange={update("organizationName")}
          error={fieldErrors.organizationName}
        />
        <Button type="submit" className="w-full" loading={pending}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
