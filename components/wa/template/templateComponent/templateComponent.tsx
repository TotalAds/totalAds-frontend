import React from "react";

import MessageTemplate from "./messageTemplate";
import TemplateCategory from "./templateCategory";

const TemplateComponent = () => {
  return (
    <div className="flex gap-6 mt-4 ">
      <div className=" w-1/4">
        <TemplateCategory />
      </div>
      <div className="p-4 rounded-xl border border-bg-300 bg-bg-100 mb-4 w-3/4">
        <div className=" grid grid-cols-3 gap-4">
          <MessageTemplate />
          <MessageTemplate />
          <MessageTemplate />
          <MessageTemplate />
          <MessageTemplate />
          <MessageTemplate />
          <MessageTemplate />
          <MessageTemplate />
          <MessageTemplate />
        </div>
      </div>
    </div>
  );
};

export default TemplateComponent;
