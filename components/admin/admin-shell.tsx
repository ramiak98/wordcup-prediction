"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useMemo, useState } from "react";
import { BarChart3, ClipboardList, LogOut, Settings, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AdminContextValue = {
  password: string;
  adminFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used inside AdminShell");
  }
  return context;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/votes", label: "Votes", icon: ClipboardList },
  { href: "/admin/results", label: "Results", icon: Trophy },
  { href: "/admin/scoring", label: "Scoring", icon: Settings }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [passwordInput, setPasswordInput] = useState("");
  const [password, setPassword] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (localStorage.getItem("wc_admin_password") ?? "")
  );

  const value = useMemo<AdminContextValue>(
    () => ({
      password,
      adminFetch: (input, init) =>
        fetch(input, {
          ...init,
          headers: {
            ...(init?.headers ?? {}),
            "x-admin-password": password
          }
        })
    }),
    [password]
  );

  if (!password) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin access</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                localStorage.setItem("wc_admin_password", passwordInput);
                setPassword(passwordInput);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                  autoFocus
                />
              </div>
              <Button className="w-full" type="submit">
                Enter admin
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <AdminContext.Provider value={value}>
      <main className="min-h-screen">
        <div className="border-b bg-white">
          <div className="wc-stripe h-1.5" />
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <Link href="/admin" className="text-lg font-black">
                World Cup Admin
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("wc_admin_password");
                  setPassword("");
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
            <nav className="flex gap-2 overflow-auto">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant={pathname === item.href ? "default" : "outline"}
                  size="sm"
                  className={cn("shrink-0", pathname === item.href && "shadow-none")}
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </AdminContext.Provider>
  );
}
