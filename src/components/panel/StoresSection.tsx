import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Wrench } from "lucide-react";
import ProductsStore from "./ProductsStore";
import SparePartsStore from "./SparePartsStore";

const StoresSection = () => {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="machinery-store" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="machinery-store" className="gap-2">
            <Package className="h-4 w-4" />
            Maquinaria
          </TabsTrigger>
          <TabsTrigger value="spare-parts-store" className="gap-2">
            <Wrench className="h-4 w-4" />
            Repuestos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="machinery-store">
          <ProductsStore onBack={() => {}} />
        </TabsContent>
        <TabsContent value="spare-parts-store">
          <SparePartsStore onBack={() => {}} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoresSection;
