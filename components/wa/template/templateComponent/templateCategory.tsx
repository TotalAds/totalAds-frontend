import { BanknoteIcon } from "lucide-react";
import React from "react";

const TemplateCategory = () => {
  return (
    <div className="w-auto rounded-xl border border-bg-300 bg-bg-100 mb-4">
      <div className=" w-full relative p-4">
        <div className="">
          <h2 className="flex gap-2 text-text text-xl mb-4">Category</h2>
          <div>
            <div className="flex gap-2 p-2 cursor-pointer font-medium text-base items-center rounded mb-2 bg-primary-200 hover:bg-primary-200">
              <BanknoteIcon />
              Bank
            </div>
            <div className="flex gap-2 p-2 hover:bg-bg-200 cursor-pointer font-medium text-base items-center rounded mb-2">
              <BanknoteIcon />
              Bank
            </div>
            <div className="flex gap-2 p-2 hover:bg-bg-200 cursor-pointer font-medium  items-center rounded mb-2 text-base">
              <BanknoteIcon />
              Bank
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCategory;
