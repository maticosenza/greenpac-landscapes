import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import CustomerPanel from "@/components/panel/CustomerPanel";
import EmployeePanel from "@/components/panel/EmployeePanel";
import AdminPanel from "@/components/panel/AdminPanel";

const Panel = () => {
  const navigate = useNavigate();
  const { user, isLoading, isEmployee, isAdmin } = useAuth();

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

  // Admin gets the AdminPanel with team management
  if (isAdmin) {
    return <AdminPanel />;
  }

  // Employee gets EmployeePanel
  if (isEmployee) {
    return <EmployeePanel />;
  }

  // Customer gets CustomerPanel
  return <CustomerPanel />;
};

export default Panel;
