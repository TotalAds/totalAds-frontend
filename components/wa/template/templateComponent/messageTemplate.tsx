import Image from "next/image";
import React from "react";

import AlertIcon from "@/asset/images/alertIcon.png";
import { Button } from "@/components/ui/button";

const MessageTemplate = () => {
  return (
    <div className="p-4 bg-bg-200 rounded w-full">
      <div className="flex justify-center">
        <Image src={AlertIcon} alt="" width={80} />
      </div>
      <h1 className="text-center text-text text-base font-bold mb-2 mt-4">
        Web Reminder
      </h1>
      <p className="text-text-200 text-sm text-ellipsis line-clamp-4 ">
        Lorem ipsum dolor sit amet consectetur, adipisicing elit. Cupiditate
        veritatis iure deserunt facere voluptate id. Vero id facilis saepe
        voluptatem aliquam quaerat facere nostrum velit omnis quibusdam enim
        est, possimus dolor, quia quasi! Voluptatibus vitae in fugit? Tempora,
        reprehenderit recusandae ratione error nesciunt eaque dolore. Architecto
        repellendus fugiat assumenda ratione voluptatem placeat. Placeat itaque
        cumque tempore vero veritatis, alias quasi molestiae natus voluptas. Qui
        eos delectus veritatis atque dolores culpa ex necessitatibus, quia
        cupiditate accusantium eius corporis iure quas labore alias sint iusto,
        dolorem ullam magni doloribus! Quidem soluta alias ex, quae officia
        impedit molestias! Nobis voluptates ea commodi delectus?
      </p>
      <div className="flex justify-between items-center mt-3">
        <Button>Preview</Button>
        <Button variant={"outline"}>Submit</Button>
      </div>
    </div>
  );
};

export default MessageTemplate;
