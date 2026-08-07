"use client";

import * as React from "react";

import { apiFetch } from "@/lib/client";
import { CurrencyProvider } from "@/lib/currency";

import { PageShell } from "@/components/shared/page-shell";
import { AuthLanding } from "@/components/auth/auth-landing";
import { PaymentRequired } from "@/components/auth/payment-required";

import { UserPanel } from "@/components/user/user-panel";
import { AdminPanel } from "@/components/admin/admin-panel";

import type { PlatformSettings, SafeUser } from "@/lib/types";

import { Sparkles } from "lucide-react";


export default function Home() {

  const [booted, setBooted] = React.useState(false);

  const [user, setUser] = React.useState<SafeUser | null>(null);

  const [settings, setSettings] =
    React.useState<PlatformSettings | null>(null);


  const bootstrap = React.useCallback(async () => {

    try {

      const [meRes, settingsRes] = await Promise.all([

        apiFetch<any>("/api/auth/me"),

        apiFetch<any>("/api/settings"),

      ]);


      console.log("AUTH:", meRes);

      console.log("SETTINGS:", settingsRes);



      const currentUser =
        meRes?.data?.user ??
        meRes?.user ??
        null;


      const currentSettings =
        settingsRes?.data?.settings ??
        settingsRes?.settings ??
        null;



      console.log("FINAL USER:", currentUser);

      console.log("FINAL SETTINGS:", currentSettings);



      setUser(currentUser);

      setSettings(currentSettings);



    } catch (error) {


      console.error(
        "BOOT ERROR:",
        error
      );


      setUser(null);


    } finally {


      setBooted(true);


    }


  }, []);



  React.useEffect(() => {

    bootstrap();

  }, [bootstrap]);



  if (!booted) {

    return (

      <PageShell>

        <BootSplash />

      </PageShell>

    );

  }


  if (!settings) {

    return (

      <PageShell>

        <div className="flex min-h-screen items-center justify-center text-white">

          Settings failed to load.

        </div>

      </PageShell>

    );

  }



  if (!user) {


    return (

      <CurrencyProvider initialSettings={settings}>

        <PageShell>

          <AuthLanding

            settings={settings}

            onAuthed={(u)=>setUser(u)}

          />

        </PageShell>

      </CurrencyProvider>

    );

  }



  if (
    user.role !== "admin" &&
    user.is_suspended
  ) {


    return (

      <CurrencyProvider initialSettings={settings}>

        <PageShell>

          <PaymentRequired

            user={user}

            settings={settings}

            onPaid={(u)=>setUser(u)}

            onLogout={()=>setUser(null)}

          />

        </PageShell>

      </CurrencyProvider>

    );

  }



  if (user.role === "admin") {


    return (

      <CurrencyProvider initialSettings={settings}>

        <PageShell>

          <AdminPanel

            user={user}

            settings={settings}

            onSettingsChange={setSettings}

            onLogout={()=>setUser(null)}

            onUserUpdate={(u)=>setUser(u)}

          />

        </PageShell>

      </CurrencyProvider>

    );

  }



  return (

    <CurrencyProvider initialSettings={settings}>

      <PageShell>

        <UserPanel

          user={user}

          settings={settings}

          onUserUpdate={(u)=>setUser(u)}

          onLogout={()=>setUser(null)}

        />

      </PageShell>

    </CurrencyProvider>

  );

}



function BootSplash(){

  return (

    <div className="flex flex-1 flex-col items-center justify-center gap-4">

      <div className="relative">

        <div className="absolute inset-0 animate-ping rounded-2xl bg-violet-500/40" />


        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-xl glow-violet">

          <Sparkles className="h-7 w-7 text-white" />

        </div>

      </div>


      <p className="text-sm text-violet-100/50">
        Loading EarnStream…
      </p>


    </div>

  );

}