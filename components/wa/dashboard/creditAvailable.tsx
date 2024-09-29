import React from "react";

const CreditAvailable = () => {
  return (
    <div className="w-auto rounded-xl border border-bg-300 bg-bg-100 mb-4">
      <div className=" w-full  relative p-4">
        <p className=" text-l text-text-200">
          Message Quota:{" "}
          <span className=" font-bold text-text">250 message/day</span>
        </p>
      </div>
    </div>
  );
};

export default CreditAvailable;
