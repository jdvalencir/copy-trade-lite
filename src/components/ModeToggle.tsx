"use client";

import { Check, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only wire up after mount: the server can't know the theme, so gating the
  // control avoids a hydration mismatch and ensures the provider is fully
  // initialized before the first selection (fixes the "click twice" glitch on
  // a fresh visit with no stored theme).
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const options = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ] as const;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Toggle theme">
          {isDark ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onClick={() => setTheme(o.value)}
            className="justify-between"
          >
            {o.label}
            <Check className={cn("h-4 w-4", mounted && theme === o.value ? "opacity-100" : "opacity-0")} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
