"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type Profile = {
  email?: string;
  role?: string;
};

export default function DashboardPage() {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const getProfile = async () => {
    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) return;

    const { data } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    alert(user.id);
    setProfile(data);
    console.log(data);
    
  };

  useEffect(() => {
  const fetchProfile =
    async () => {
      await getProfile();
    };

  fetchProfile();
}, []);

  const handleLogout =
    async () => {
      await supabase.auth.signOut();

      window.location.href =
        "/login";
    };

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-5">
        Dashboard
      </h1>

      {profile ? (
        <div>
          <p>
            Email: {profile.email}
          </p>

          <p>
            Role: {profile.role}
          </p>

          {profile.role ===
            "admin" && (
            <div className="mt-5 p-5 border">
              <h2 className="text-2xl font-bold">
                Admin Panel
              </h2>

              <p>
                Solo admins ven esto
              </p>
            </div>
          )}

          <button
            onClick={
              handleLogout
            }
            className="bg-red-600 text-white px-4 py-2 mt-5"
          >
            Logout
          </button>
        </div>
      ) : (
        <p>
          Cargando perfil...
        </p>
      )}
    </main>
  );
}