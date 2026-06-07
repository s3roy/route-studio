import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

async function getSettings() {
  const res = await fetch("https://api.example.com/user/settings", {
    cache: "no-store",
  });
  return res.json();
}

export default async function SettingsPage() {
  await getSettings();
  return (
    <div>
      <h1>Settings</h1>
      <p className="text-sm text-zinc-400">Server page with a client form below.</p>
      <SettingsForm />
    </div>
  );
}
