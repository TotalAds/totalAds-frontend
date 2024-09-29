import React from "react";

import AccountDetailContainer from "./accountDetailContainer";
import CreditAvailable from "./creditAvailable";
import MetaLinkContainer from "./metaLinkContainer";

const Dashboard = () => {
  return (
    <div className="flex justify-between">
      <div className=" w-2/3 mr-6">
        <MetaLinkContainer />
        <AccountDetailContainer />
      </div>
      <div className=" w-1/3 ">
        <CreditAvailable />
      </div>
    </div>
  );
};

export default Dashboard;
