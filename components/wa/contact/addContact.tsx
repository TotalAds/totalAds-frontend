import React from "react";

import {
  BottomGradient,
  LabelInputContainer,
} from "@/components/authentication/signup";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AddContact = () => {
  return (
    <DialogHeader>
      <DialogTitle>Add Contact</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete your account
        and remove your data from our servers.
      </DialogDescription>
      <div>
        <div className="flex flex-col mt-4">
          <LabelInputContainer className="mb-4">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="projectmayhem@fc.com" type="email" />
          </LabelInputContainer>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input id="mobile" placeholder="+91-99999-99999" type="number" />
          </LabelInputContainer>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" placeholder="projectmayhem@fc.com" />
          </LabelInputContainer>
        </div>
        <Button variant={"outline"} className="w-full mt-4" type="submit">
          Login &rarr;
          {/* <BottomGradient /> */}
        </Button>
      </div>
    </DialogHeader>
  );
};

export default AddContact;
