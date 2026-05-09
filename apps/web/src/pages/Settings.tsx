import { useState, useEffect } from "react";
import { User, Bell, Loader2, Radio, SlidersHorizontal } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase.from("profiles") as any)
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }: { data: any }) => {
        if (data?.full_name) setFullName(data.full_name);
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user?.id]);
  const [emailNotif, setEmailNotif] = useState(() => localStorage.getItem("notif_email") !== "false");
  const [pushNotif, setPushNotif] = useState(() => localStorage.getItem("notif_push") !== "false");
  const [redditOn, setRedditOn] = useState(true);
  const [hnOn, setHnOn] = useState(true);
  const [customSubreddits, setCustomSubreddits] = useState("");
  const [weightDemand, setWeightDemand] = useState(30);
  const [weightMobile, setWeightMobile] = useState(25);
  const [weightMonetize, setWeightMonetize] = useState(20);
  const [weightBuild, setWeightBuild] = useState(15);
  const [weightCompete, setWeightCompete] = useState(10);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: fullName } as any).eq("id", user.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { full_name: fullName } });
      window.dispatchEvent(new CustomEvent("profile-updated"));
      toast({ title: "Profile updated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const path = `${user.id}/avatar.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: publicUrl } as any).eq("id", user.id);
      setAvatarUrl(publicUrl);
      window.dispatchEvent(new CustomEvent("profile-updated"));
      toast({ title: "Avatar updated" });
    } catch (e: any) {
      toast({ title: "Error uploading avatar", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleEmailNotif = (val: boolean) => {
    setEmailNotif(val);
    localStorage.setItem("notif_email", String(val));
    toast({ title: val ? "Email notifications enabled" : "Email notifications disabled" });
  };

  const handlePushNotif = async (val: boolean) => {
    if (val && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({ title: "Permission denied", description: "Allow notifications in your browser settings.", variant: "destructive" });
        return;
      }
    }
    setPushNotif(val);
    localStorage.setItem("notif_push", String(val));
    toast({ title: val ? "Push notifications enabled" : "Push notifications disabled" });
  };

  const initials = fullName ? fullName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "U";

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted mt-1">Manage your account preferences.</p>
      </div>
      <div className="bg-card rounded-2xl p-6 shadow-card mb-4">
        <div className="flex items-center gap-3 mb-5">
          <User className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Profile</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground border-none outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Email</label>
            <input value={user?.email || ""} disabled
              className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm text-muted border-none outline-none" />
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-medium text-muted mb-1 block">Avatar</label>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xl font-bold">{initials}</div>
            )}
            <label className="text-sm font-medium text-primary hover:underline cursor-pointer">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Change Avatar"}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
        </div>
        <button onClick={handleSaveProfile} disabled={saving}
          className="mt-4 gradient-primary text-primary-foreground rounded-xl px-6 py-2.5 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save Changes
        </button>
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-card mb-4">
        <div className="flex items-center gap-3 mb-5">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Notifications</h3>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <p className="text-sm text-foreground">Email notifications</p>
            <p className="text-xs text-muted mt-0.5">Receive idea digests and crawl summaries by email</p>
          </div>
          <Switch checked={emailNotif} onCheckedChange={handleEmailNotif} />
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm text-foreground">Push notifications</p>
            <p className="text-xs text-muted mt-0.5">Browser alerts when a new crawl completes</p>
          </div>
          <Switch checked={pushNotif} onCheckedChange={handlePushNotif} />
        </div>
      </div>

      <div className="border-t border-border mt-6 pt-6">
        <h2 className="text-lg font-bold text-foreground mb-4">IdeaRadar Configuration</h2>

        <div className="bg-card rounded-2xl p-6 shadow-card mb-4">
          <div className="flex items-center gap-3 mb-5">
            <Radio className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Crawl Sources</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Reddit</p>
                <p className="text-xs text-muted mt-0.5">r/SomebodyMakeThis, r/startupideas, r/entrepreneur</p>
              </div>
              <Switch checked={redditOn} onCheckedChange={setRedditOn} />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Hacker News</p>
                <p className="text-xs text-muted mt-0.5">Ask HN + Show HN posts</p>
              </div>
              <Switch checked={hnOn} onCheckedChange={setHnOn} />
            </div>
            <div className="pt-1">
              <label className="text-xs font-medium text-muted mb-1 block">Custom subreddits</label>
              <Input
                value={customSubreddits}
                onChange={(e) => setCustomSubreddits(e.target.value)}
                placeholder="e.g. r/webdev, r/indiehackers"
                className="bg-secondary border-none focus-visible:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-5">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Scoring Weights</h3>
          </div>
          <div className="space-y-1">
            {[
              { label: "Demand Signal",    value: weightDemand,   set: setWeightDemand },
              { label: "Mobile Fit",       value: weightMobile,   set: setWeightMobile },
              { label: "Monetization",     value: weightMonetize, set: setWeightMonetize },
              { label: "Buildability",     value: weightBuild,    set: setWeightBuild },
              { label: "Competition Gap",  value: weightCompete,  set: setWeightCompete },
            ].map(({ label, value, set }) => (
              <div key={label} className="flex items-center gap-4 py-2">
                <span className="w-36 text-sm text-foreground flex-shrink-0">{label}</span>
                <Slider
                  className="flex-1"
                  min={0} max={100} step={1}
                  value={[value]}
                  onValueChange={([v]) => set(v)}
                />
                <span className="w-8 text-right text-sm font-semibold text-primary flex-shrink-0">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted mt-4">Weights affect how ideas are graded. Total should add up to 100.</p>
        </div>
      </div>
    </div>
  );
}
