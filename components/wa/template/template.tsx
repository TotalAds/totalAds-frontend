"use client";
import React from "react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import TemplateComponent from "./templateComponent/templateComponent";

const WaTemplate = () => {
  return (
    <div>
      <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-text">
        Template Message
      </span>
      <div className="flex items-center py-4">
        <div className="flex items-center gap-5">
          <Input
            placeholder="Search Template..."
            value={""}
            onChange={(event) => {}}
            className=" w-80"
          />
        </div>
      </div>
      <Tabs defaultValue="template">
        <div className="w-[800px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="template">
          <TemplateComponent />
        </TabsContent>
        <TabsContent value="pending">Change your password here.</TabsContent>
      </Tabs>
    </div>
  );
};

export default WaTemplate;
