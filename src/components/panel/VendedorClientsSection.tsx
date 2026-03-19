import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MapPin } from "lucide-react";
import VendedorCustomersList from "./VendedorCustomersList";
import ClientZonalReports from "./ClientZonalReports";

interface VendedorClientsSectionProps {
  searchTerm: string;
  vendedorId: string;
}

const VendedorClientsSection = ({ searchTerm, vendedorId }: VendedorClientsSectionProps) => {
  return (
    <Tabs defaultValue="list" className="w-full">
      <TabsList className="w-full max-w-md h-auto p-1 bg-muted/50 rounded-lg grid grid-cols-2 gap-1 mb-4">
        <TabsTrigger
          value="list"
          className="text-sm px-3 py-2 rounded-md gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground transition-all"
        >
          <Users className="h-4 w-4 shrink-0" />
          Todos los clientes
        </TabsTrigger>
        <TabsTrigger
          value="zones"
          className="text-sm px-3 py-2 rounded-md gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground transition-all"
        >
          <MapPin className="h-4 w-4 shrink-0" />
          Zona de clientes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="list">
        <VendedorCustomersList searchTerm={searchTerm} vendedorId={vendedorId} />
      </TabsContent>

      <TabsContent value="zones">
        <ClientZonalReports />
      </TabsContent>
    </Tabs>
  );
};

export default VendedorClientsSection;
