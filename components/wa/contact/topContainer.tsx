"use client";
import { ContactRound, ImportIcon, Mail } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import AddContact from "./addContact";

const TopContainer = () => {
  return (
    <div className="w-auto rounded-xl border border-bg-300 bg-bg-100 mb-4">
      <div className=" w-full dark:bg-grid-small-white/[0.2] bg-grid-small-black/[0.2] relative p-4">
        {/* Radial gradient for the container to give a faded look */}
        <div className="absolute pointer-events-none inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        <div className="flex">
          <div>
            <h2 className="flex gap-2 text-text text-xl mb-2">
              Boost Your Business with TotalAds
            </h2>
            <p className=" text-s text-text-200 mb-4">
              Experience seamless customer engagement with our platform. Apply
              now to start using WhatsApp Business API for free and take your
              business to the next level.
            </p>
            <div className="flex align-middle gap-8">
              <Button variant="outline">
                <ImportIcon className="mr-2 h-4 w-4" />
                Import Excel,CSV file
              </Button>
              <Dialog>
                <DialogTrigger>
                  <Button>
                    <ContactRound className="mr-2 h-4 w-4" /> Add contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <AddContact />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopContainer;
