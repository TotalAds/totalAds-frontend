"use client";
import React from "react";

import ContactTable from "./contactTable";
import { columns, contactsData } from "./tableData";
import TopContainer from "./topContainer";

const WhatsappContact = () => {
  return (
    <div>
      <TopContainer />
      <ContactTable data={contactsData} columns={columns} />
    </div>
  );
};

export default WhatsappContact;
