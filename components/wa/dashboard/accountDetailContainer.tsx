import { Edit, Edit2Icon } from "lucide-react";
import React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const AccountDetailContainer = () => {
  return (
    <div className="w-auto rounded-xl border border-bg-300 bg-bg-100 mb-4">
      <div className=" w-full  relative p-4">
        <>
          <div className="flex justify-between align-top">
            <div className="flex align-top gap-3">
              <div>
                <Avatar className="h-14    w-14  ">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h2 className="flex gap-2 text-text font-semibold tracking-wider text-xl mb-2">
                  Readreuse
                </h2>
                <p className="line-clamp-2 text-text mb-2">
                  <span className="font-semibold">Mobile: </span>
                  +919926488445
                </p>
              </div>
            </div>
            <div className="">
              <Button className="px-2 py-0 gap-1">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
          <p className="line-clamp-2 text-text mb-2">
            <span className="font-semibold">Address: </span>
            Chokse Mohalla Pithampur Dist Dhar
          </p>
          <p className="line-clamp-2 text-text mb-2">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Incidunt
            corporis sequi quos ipsam officiis id cum est eius, omnis et vel
            numquam praesentium obcaecati dolor libero sapiente quasi eligendi
            nobis reiciendis ab excepturi delectus maxime nostrum. Enim tempore
            vel, facilis voluptatum saepe iusto animi quis eos obcaecati minus
            voluptates optio beatae dolor eveniet quisquam ut et quia magnam{" "}
          </p>
        </>
      </div>
    </div>
  );
};

export default AccountDetailContainer;
