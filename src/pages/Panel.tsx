import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import CustomerPanel from "@/components/panel/CustomerPanel";
import EmployeePanel from "@/components/panel/EmployeePanel";
import AdminPanel from "@/components/panel/AdminPanel";
import VendedorPanel from "@/components/panel/VendedorPanel";
import CreatePasswordDialog from "@/components/auth/CreatePasswordDialog";

const Panel = () => {
  const navigate = useNavigate();
  const { user, isLoading, isEmployee, isAdmin, isVendedor, needsPasswordSetup, clearPasswordSetup } = useAuth();

  // Detect if we arrived via an invite/recovery link — keep showing loader while session is being established
  const [hasInviteToken] = useState(() => {
    const hash = window.location.hash;
    return !!(hash && (
      hash.includes("type=invite") ||
      hash.includes("type=signup") ||
      hash.includes("type=magiclink") ||
      hash.includes("type=recovery")
    ));
  });

  useEffect(() => {
    // Only redirect to auth if loading is done, no user, AND no invite token in the URL
    if (!isLoading && !user && !hasInviteToken) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate, hasInviteToken]);

  // Show loader while auth is initializing (including invite token processing)
  if (isLoading || (!user && hasInviteToken)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <CreatePasswordDialog open={needsPasswordSetup} onSuccess={clearPasswordSetup} />
      {isAdmin ? <AdminPanel /> : isVendedor && !isAdmin ? <VendedorPanel /> : isEmployee ? <EmployeePanel /> : <CustomerPanel />}
    </>
  );
};

export default Panel;
