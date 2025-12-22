import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, XCircle, AlertCircle, Clock, Loader2, Home } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type ResultStatus = "loading" | "approved" | "rejected" | "error" | "expired" | "already_processed" | "invalid";

interface ResultInfo {
  status: ResultStatus;
  eventTitle?: string;
  organizerEmail?: string;
  message?: string;
}

const ApprovalResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<ResultInfo>({ status: "loading" });
  
  const token = searchParams.get("token");
  const action = searchParams.get("action");
  const status = searchParams.get("status");
  const title = searchParams.get("title");
  const email = searchParams.get("email");
  const error = searchParams.get("error");

  useEffect(() => {
    // Check if we have pre-populated status from edge function redirect
    if (status === "success" && action) {
      setResult({
        status: action === "approve" ? "approved" : "rejected",
        eventTitle: title ? decodeURIComponent(title) : undefined,
        organizerEmail: email ? decodeURIComponent(email) : undefined,
      });
      return;
    }

    if (status === "expired") {
      setResult({ status: "expired" });
      return;
    }

    if (status === "already_processed") {
      setResult({ 
        status: "already_processed",
        message: searchParams.get("current_status") || undefined
      });
      return;
    }

    if (status === "invalid" || error) {
      setResult({ 
        status: "invalid",
        message: error ? decodeURIComponent(error) : "Ogiltig länk"
      });
      return;
    }

    // If no status, show invalid
    if (!token || !action) {
      setResult({ status: "invalid", message: "Saknade parametrar" });
    }
  }, [token, action, status, title, email, error, searchParams]);

  const getResultContent = () => {
    switch (result.status) {
      case "loading":
        return {
          icon: <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />,
          title: "Behandlar...",
          description: "Vänta medan vi behandlar din begäran.",
          color: "text-muted-foreground",
        };
      case "approved":
        return {
          icon: <CheckCircle2 className="h-16 w-16 text-green-500" />,
          title: "Evenemang Godkänt!",
          description: result.eventTitle 
            ? `"${result.eventTitle}" har godkänts och publicerats.`
            : "Evenemanget har godkänts och publicerats.",
          color: "text-green-500",
        };
      case "rejected":
        return {
          icon: <XCircle className="h-16 w-16 text-destructive" />,
          title: "Evenemang Avvisat",
          description: result.eventTitle 
            ? `"${result.eventTitle}" har avvisats.`
            : "Evenemanget har avvisats.",
          color: "text-destructive",
        };
      case "expired":
        return {
          icon: <Clock className="h-16 w-16 text-amber-500" />,
          title: "Länken Har Gått Ut",
          description: "Denna godkännandlänk har gått ut. Använd admin-panelen för att hantera evenemanget.",
          color: "text-amber-500",
        };
      case "already_processed":
        return {
          icon: <AlertCircle className="h-16 w-16 text-blue-500" />,
          title: "Redan Behandlat",
          description: result.message 
            ? `Detta evenemang har redan blivit ${result.message === "approved" ? "godkänt" : "avvisat"}.`
            : "Detta evenemang har redan behandlats.",
          color: "text-blue-500",
        };
      case "invalid":
      case "error":
      default:
        return {
          icon: <AlertCircle className="h-16 w-16 text-destructive" />,
          title: "Fel",
          description: result.message || "Något gick fel. Kontrollera länken och försök igen.",
          color: "text-destructive",
        };
    }
  };

  const content = getResultContent();

  return (
    <Layout>
      <Helmet>
        <title>Godkännanderesultat | NowInTown</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <main className="container max-w-lg py-16 px-4">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              {content.icon}
            </div>
            <CardTitle className={`text-2xl ${content.color}`}>
              {content.title}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {content.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.organizerEmail && (
              <p className="text-sm text-muted-foreground">
                Arrangören ({result.organizerEmail}) har meddelats via e-post.
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button asChild variant="outline">
                <Link to="/admin">
                  Till Admin-panelen
                </Link>
              </Button>
              <Button asChild>
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Till Startsidan
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </Layout>
  );
};

export default ApprovalResult;
