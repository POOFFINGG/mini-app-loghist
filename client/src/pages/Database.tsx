import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Truck, FileText, Database as DatabaseIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CounterpartiesList } from "@/components/database/CounterpartiesList";
import { DriversList } from "@/components/database/DriversList";
import { VehiclesList } from "@/components/database/VehiclesList";
import { DocumentsList } from "@/components/database/DocumentsList";
import { Button } from "@/components/ui/button";

export default function Database() {
  const [activeTab, setActiveTab] = useState("counterparties");

  return (
    <div className="min-h-screen pb-24 pt-4 px-4 bg-gray-50/50 dark:bg-background flex flex-col">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <DatabaseIcon className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-xl font-bold">База данных</h1>
      </header>

      <Tabs defaultValue="counterparties" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="bg-background/80 backdrop-blur-xl sticky top-[72px] z-10 -mx-4 px-4 pb-2 pt-1 border-b border-border/50">
          <TabsList className="grid grid-cols-4 h-auto p-1 bg-secondary/40 backdrop-blur-md border border-border/50 rounded-2xl">
            <TabsTrigger value="counterparties" className="flex flex-col items-center gap-1.5 py-3 text-[11px] data-[state=active]:bg-background/90 dark:data-[state=active]:bg-card/90 shadow-none data-[state=active]:shadow-sm rounded-xl transition-all font-medium">
              <Users className="w-5 h-5" />
              <span>Контрагенты</span>
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex flex-col items-center gap-1.5 py-3 text-[11px] data-[state=active]:bg-background/90 dark:data-[state=active]:bg-card/90 shadow-none data-[state=active]:shadow-sm rounded-xl transition-all font-medium">
              <Users className="w-5 h-5" />
              <span>Водители</span>
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex flex-col items-center gap-1.5 py-3 text-[11px] data-[state=active]:bg-background/90 dark:data-[state=active]:bg-card/90 shadow-none data-[state=active]:shadow-sm rounded-xl transition-all font-medium">
              <Truck className="w-5 h-5" />
              <span>Транспорт</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex flex-col items-center gap-1.5 py-3 text-[11px] data-[state=active]:bg-background/90 dark:data-[state=active]:bg-card/90 shadow-none data-[state=active]:shadow-sm rounded-xl transition-all font-medium">
              <FileText className="w-5 h-5" />
              <span>Документы</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1">
          <TabsContent value="counterparties" className="mt-0 outline-none">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              <CounterpartiesList />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="drivers" className="mt-0 outline-none">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              <DriversList />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="vehicles" className="mt-0 outline-none">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              <VehiclesList />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="documents" className="mt-0 outline-none">
             <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              <DocumentsList />
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
