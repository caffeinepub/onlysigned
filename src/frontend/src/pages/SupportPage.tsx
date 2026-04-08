import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Mail,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSubmitSupportForm } from "../hooks/useQueries";

const FAQS = [
  {
    q: "How do I get a Username NFT?",
    a: "Username NFTs are minted by admin only. Search for your desired username on the Username NFTs page and submit an offer. Admin will review and, if approved, mint the NFT and assign it to your account.",
  },
  {
    q: "Why do I need 500 followers to issue certificates?",
    a: "The 500-follower requirement ensures Certificate Issuers have an established presence on the platform. This protects the marketplace from spam certificates. Admin users are exempt from this requirement.",
  },
  {
    q: "Can OnlySigned recover my lost funds?",
    a: "No. All transactions are on the blockchain and we have no access to your funds or keys. You are solely responsible for securing your Internet Identity and wallet. The only exception is Username NFT recovery — admin can help re-assign your Username NFT if you can prove identity through alternative means.",
  },
  {
    q: "Are my private assets really private?",
    a: "Yes. Private assets are encrypted and only accessible to you. Even admin cannot see your private content. Privacy is enforced at the encryption level, not just through policy.",
  },
  {
    q: "How do I verify a certificate?",
    a: "Go to the Certificate Validation page and enter the Certificate ID or shareable URL. The system will check the blockchain record and confirm authenticity. Every valid certificate displays all signers, the ICRC-7 token ID, and an authenticity hash.",
  },
  {
    q: "Can I list an original asset for sale?",
    a: "No. Only signed copies and collections can be listed in the marketplace. Original assets cannot be sold directly. You must first sign the asset to create a numbered ICRC-7 NFT certificate, which can then be listed for sale.",
  },
  {
    q: "What currencies are supported?",
    a: "The marketplace supports ICP, ckBTC, ckUSDC, and ckUSDT. All transactions are on-chain. There are no fiat payment methods.",
  },
  {
    q: "How do royalties work?",
    a: "When you set a royalty percentage on an asset (e.g. 10%), you automatically receive that percentage of every future sale of signed copies of that asset. Royalties are distributed automatically at transaction time.",
  },
];

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const submitForm = useSubmitSupportForm();

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    try {
      await submitForm.mutateAsync({
        subject,
        message,
        email: email || undefined,
      });
      setSubmitted(true);
      toast.success("Message sent to support@onlysigned.com");
    } catch {
      toast.error("Failed to send message. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8" data-ocid="support-page">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-accent" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            Support
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Submit feedback, bug reports, or enhancement suggestions. We read
          everything.
        </p>
      </div>

      {/* Contact form */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent" />
            Send a Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {submitted ? (
            <div
              className="flex flex-col items-center justify-center py-8 gap-4 text-center"
              data-ocid="support-success"
            >
              <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-accent" />
              </div>
              <div className="space-y-1">
                <p className="font-display font-semibold text-foreground">
                  Message Sent!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your message has been sent to support@onlysigned.com.
                  We&apos;ll get back to you as soon as possible.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setSubject("");
                  setMessage("");
                  setEmail("");
                }}
                data-ocid="support-send-another"
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="support-subject">Subject *</Label>
                <Input
                  id="support-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Bug report: certificate validation"
                  data-ocid="support-subject-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="support-message">Message *</Label>
                <Textarea
                  id="support-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Describe your issue, suggestion, or feedback in detail…"
                  data-ocid="support-message-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="support-email">
                  Contact Email{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="support-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  data-ocid="support-email-input"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitForm.isPending}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/80"
                data-ocid="support-submit-btn"
              >
                {submitForm.isPending ? "Sending…" : "Send Message"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Messages are sent to{" "}
                <span className="font-mono">support@onlysigned.com</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Direct contact */}
      <div className="flex items-center gap-3 bg-muted/20 rounded-xl p-4 border border-border/50">
        <Mail className="h-4 w-4 text-accent flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          You can also email us directly at{" "}
          <a
            href="mailto:support@onlysigned.com"
            className="text-accent underline hover:text-accent/80"
            data-ocid="support-email-link"
          >
            support@onlysigned.com
          </a>
        </p>
      </div>

      <Separator className="opacity-20" />

      {/* FAQs */}
      <div className="space-y-3">
        <h2 className="font-display font-bold text-lg text-foreground">
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {FAQS.map((faq, idx) => (
            <Card
              key={faq.q}
              className="bg-card border-border hover:border-accent/20 transition-colors"
              data-ocid={`faq-item-${idx}`}
            >
              <CardContent className="p-0">
                <button
                  type="button"
                  className="w-full flex items-start justify-between gap-3 p-4 text-left"
                  onClick={() =>
                    setOpenFaq((prev) => (prev === idx ? null : idx))
                  }
                  aria-expanded={openFaq === idx}
                  data-ocid={`faq-toggle-${idx}`}
                >
                  <span className="text-sm font-medium text-foreground">
                    {faq.q}
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4">
                    <Separator className="opacity-20 mb-3" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
