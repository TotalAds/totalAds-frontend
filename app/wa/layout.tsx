import React from "react";

import WhatsAppLayout from "@/components/wa/layout/layout";

interface IProps {
  children: React.ReactNode;
}

const WhatsappLayout = ({ children }: IProps) => {
  return (
    <div>
      <WhatsAppLayout>{children}</WhatsAppLayout>
    </div>
  );
};

export default WhatsappLayout;
