import { useEffect } from "react";
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

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
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
