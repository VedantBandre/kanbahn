"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const setAccess = useAuth((s) => s.setAccess);
    const router = useRouter();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        try {
            const { data } = await api.post("/auth/jwt/create", { username, password });
            setAccess(data.access);
            router.push("/boards");
        } catch {
            setError("Invalid credentials or server error.");
        }
    }

    return (
        <div className="max-w-sm mx-auto mt-24">
            <h1 className="text-2x1 font-semibold mb-4">
                Login
            </h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <input className="w-full border rounded-lg p-2 bg-transparent" 
                placeholder="username" value={username} onChange={e=>setPassword(e.target.value)}/>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button className="w-full rounded-lg p-2 border hover:bg-black/5 dark:hover:bg-white/10">
                Sign In
                </button>
            </form>
            <button onClick={() => document.documentElement.classList.toggle("dark")}
            className="mt-4 text-sm underline">
                Toggle theme
            </button>
        </div>
    );
}

