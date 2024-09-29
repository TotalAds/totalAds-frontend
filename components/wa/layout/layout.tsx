"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { IconBrandWhatsapp, IconFileInvoice } from "@tabler/icons-react";

import { getActiveLink, waMenuItem } from "../utils/layoutData";
import WANavbar from "./waNavbar";

interface IProps {
  children: React.ReactNode;
}

const WhatsAppLayout = ({ children }: IProps) => {
  const pathName = usePathname();

  return (
    <>
      <WANavbar />

      <aside
        id="logo-sidebar"
        className="fixed top-0 left-0 z-40 w-24 h-screen pt-20 transition-transform -translate-x-full bg-bg sm:translate-x-0 "
        aria-label="Sidebar"
      >
        <div className="h-full flex flex-col justify-between px-3 pb-4 overflow-y-auto bg-bg ">
          <ul className="space-y-2 font-medium mt-3">
            {/* <Accordion type="single" defaultValue="wa">
              <AccordionItem value="wa" className="border-0"> 
               <AccordionTrigger className="flex items-center p-2 text-text-200 hover:text-text-100 rounded-lg  group hover:no-underline ">
                  <div className="flex items-center">
                    <IconBrandWhatsapp className="w-5 h-5 text-text-200 transition duration-75  group-hover:text-text-100 " />
                    <span className="ms-3">WhatsApp</span>
                  </div>
                </AccordionTrigger> 
                <AccordionContent className="p-2 mb-2 mt-2 border bg-bg-200 rounded-xl"> */}
            <ul className="space-y-2 font-medium ">
              {waMenuItem.map((e, i) => (
                <li key={i}>
                  <Link
                    href={e.link}
                    className={cn(
                      "flex flex-col items-center p-2 text-text-200 hover:text-text-100 rounded-lg hover:bg-bg-300 group",
                      e.value === getActiveLink(pathName) ? "bg-bg-300" : ""
                    )}
                  >
                    {e.icon}
                    <span className="text-[12px] tracking-wide	">{e.text}</span>
                    {e.value === "wa_chat" ? (
                      <span className="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-text bg-accent-100 rounded-full ">
                        3
                      </span>
                    ) : (
                      ""
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            {/* </AccordionContent>
              </AccordionItem>
            </Accordion> */}

            {/* <li>
              <a
                href="#"
                className="flex items-center p-2 text-text-200 hover:text-text-100 rounded-lg hover:bg-bg-200 group mb-4"
              >
                <svg
                  className="w-5 h-5 text-text-200 transition duration-75  group-hover:text-text-100 "
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 22 21"
                >
                  <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z" />
                  <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z" />
                </svg>
                <span className="ms-3">Dashboard</span>
              </a>
            </li> */}
          </ul>
          <ul className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200 dark:border-gray-700">
            <li>
              <a
                href="#"
                className="flex items-center p-2 text-text-200 hover:text-text-100 rounded-lg hover:bg-bg-200 group"
              >
                <IconFileInvoice className="w-5 h-5 text-text-200 transition duration-75  group-hover:text-text-100 " />
                <span className="ms-3">Billing</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>

      <div className="p-4 sm:ml-28 mr-4 mt-16 rounded-xl border-t border-l border-bg-300 h-[calc(100vh-5rem)] overflow-y-auto bg-bg-200">
        <div className="p-4 rounded-lg ">{children}</div>
      </div>
    </>
  );
};

export default WhatsAppLayout;
