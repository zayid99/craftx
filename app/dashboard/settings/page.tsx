"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/components/logout-button";
import CancelSubscriptionButton from "@/components/dashboard/cancel-subscription-button";

type SubscriptionStatus = {
  plan: string;
  status: string;
  renewsAt: string | null;
  endsAt: string | null;
  isCancelling: boolean;
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  creator: "Creator",
  creator_pro: "Creator Pro",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  const loadSubscription = useCallback(async () => {
    setLoadingSubscription(true);
    try {
      const res = await fetch("/api/subscription/status");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } finally {
      setLoadingSubscription(false);
    }
  }, []);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      setLoadingUser(false);
    }

    loadUser();
    loadSubscription();
  }, [loadSubscription]);

  const planLabel = subscription ? PLAN_LABELS[subscription.plan] ?? subscription.plan : null;
  const isPaidPlan = subscription?.plan !== "free";
  const showCancelButton = isPaidPlan && !subscription?.isCancelling;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-1">Settings</h1>
      <p className="text-black/50 mb-6">Manage your CraftX account.</p>

      <div className="rounded-xl border border-black/10 bg-white p-5 space-y-4 mb-6">
        <div>
          <p className="text-sm font-medium text-black/50 mb-1">Email</p>
          <p className="text-base">{loadingUser ? "Loading..." : email}</p>
        </div>

        <div className="pt-2 border-t border-black/10">
          <LogoutButton />
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5 space-y-4">
        <div>
          <p className="text-sm font-medium text-black/50 mb-1">Plan</p>
          <p className="text-base">
            {loadingSubscription ? "Loading..." : planLabel}
          </p>
        </div>

        {!loadingSubscription && subscription && isPaidPlan && (
          <div>
            {subscription.isCancelling ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                Your subscription is cancelled and will end on{" "}
                {formatDate(subscription.endsAt)}. You'll keep {planLabel} access
                until then.
              </p>
            ) : (
              subscription.renewsAt && (
                <p className="text-sm text-black/60">
                  Renews on {formatDate(subscription.renewsAt)}
                </p>
              )
            )}
          </div>
        )}

        {!loadingSubscription && showCancelButton && (
          <div className="pt-2 border-t border-black/10">
            <CancelSubscriptionButton onCancelled={loadSubscription} />
          </div>
        )}
      </div>
    </div>
  );
}