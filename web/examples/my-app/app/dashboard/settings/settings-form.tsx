"use client";

export function SettingsForm() {
  return (
    <form className="mt-4 space-y-3 rounded-lg border border-white/10 p-4">
      <label className="block text-sm">
        <span className="text-zinc-400">Display name</span>
        <input
          type="text"
          defaultValue="Souvik"
          className="mt-1 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm"
        />
      </label>
      <button
        type="button"
        className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white"
      >
        Save preferences
      </button>
    </form>
  );
}
