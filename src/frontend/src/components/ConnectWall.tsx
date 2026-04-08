import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Lock } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface ConnectWallProps {
  message?: string;
  title?: string;
}

export default function ConnectWall({
  title = "Connect to Continue",
  message = "Connect your Internet Identity to access this feature.",
}: ConnectWallProps) {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center px-4"
      data-ocid="connect-wall"
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
          <Lock className="h-8 w-8 text-accent" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center">
          <LinkIcon className="h-3.5 w-3.5 text-accent" />
        </div>
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="font-display text-xl font-bold text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground/60">
          OnlySigned uses Internet Identity — no passwords, no tracking.
        </p>
      </div>

      <Button
        onClick={login}
        disabled={isLoggingIn}
        size="lg"
        className="bg-accent text-accent-foreground hover:bg-accent/80 font-semibold px-8 min-h-[44px]"
        data-ocid="connect-wall-btn"
      >
        {isLoggingIn ? "Connecting…" : "Connect Wallet"}
      </Button>
    </div>
  );
}
