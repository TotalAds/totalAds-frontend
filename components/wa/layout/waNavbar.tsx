import { InfoIcon, Wallet } from "lucide-react";
import React from "react";

import MenuIcon from "@/asset/outlineIcon/menuIcon";
import DarkModeToggle from "@/components/common/darkModeToggle";
import GetLogo from "@/components/common/getLogo";
import Tooltip from "@/components/common/tooltip";

const WANavbar = () => {
  return (
    <nav className="fixed top-0 z-50 w-full bg-bg ">
      <div className="px-3  lg:px-5 lg:pl-3 h-16">
        <div className="h-full flex items-center justify-between">
          <div className="flex items-center justify-start rtl:justify-end">
            <button
              data-drawer-target="logo-sidebar"
              data-drawer-toggle="logo-sidebar"
              aria-controls="logo-sidebar"
              type="button"
              className="inline-flex items-center p-2 text-sm text-text rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 0 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <a href="#" className="flex ms-2 md:me-24">
              <GetLogo className="h-8 w-8 me-3" />

              {/* <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-text">
                TotalAds
              </span> */}
            </a>
          </div>
          <div className="flex items-center">
            <div className="hidden sm:flex items-center pr-2 mr-4 border-r border-text-200 text-text gap-1 text-sm py-1">
              WB API Status
              <InfoIcon className="w-4 h-4" data-tooltip-target="wb_status" />
              <Tooltip id="wb_status" arrow>
                WhatsApp Business API is live!
              </Tooltip>
              <span className="ml-2 bg-success text-white text-xs font-medium me-2 px-2.5 py-0.5 rounded-full ">
                Live
              </span>
            </div>
            <div className="hidden sm:flex items-center pr-2 mr-4 border-r border-text-200 text-text gap-1 text-sm py-1">
              Messaging Tier
              <InfoIcon
                className="w-4 h-4"
                data-tooltip-target="message_tier"
              />
              <Tooltip id="message_tier" arrow>
                Number of unique users you can send template messages.
              </Tooltip>
              <span className="ml-2 text-text text-xs font-medium me-2 px-2.5 py-0.5 rounded-full ">
                1000 messages / day
              </span>
            </div>
            <div className="hidden sm:flex items-center pr-2 mr-4 border-r border-text-200 text-text gap-1 text-sm py-1">
              WB Quality Rating
              <InfoIcon
                className="w-4 h-4"
                data-tooltip-target="quality_rating"
              />
              <Tooltip id="quality_rating" arrow>
                Your WhatsApp Business Account has a High-quality rating. The
                messages you&apos;ve sent to your customers over the past 7 days
                have been well-received and of excellent quality.
                {/* Your WhatsApp Business Account’s quality rating is Medium. The messages you&apos;ve sent to your customers in the last 7 days have been of moderate quality. */}
                {/* Your WhatsApp Business Account’s quality rating is Low. The messages you&apos;ve sent to your customers in the last 7 days have been of poor quality. As a result, you cannot send messages at this time. */}
              </Tooltip>
              <span className="ml-2 bg-success text-white text-xs font-medium me-2 px-2.5 py-0.5 rounded-full ">
                High
              </span>
            </div>
            <div className="mr-8 hidden sm:flex gap-2 items-center text-text text">
              <Wallet />{" "}
              <span className="flex text-xl tracking-wide">₹ 50.66</span>
            </div>
            <div className="mr-2">
              <DarkModeToggle className="relative top-0 right-0" />
            </div>
            <div className="flex items-center ms-3">
              <div>
                <button
                  type="button"
                  className="h-10 border w-10 rounded-lg p-2 blur-1 bg-bg-200 hover:bg-bg-300 transition-all "
                  aria-expanded="false"
                  data-dropdown-toggle="dropdown-user"
                >
                  <GetLogo className="w-6 h-6 rounded-full" />
                </button>
              </div>
              <div
                className="z-50 hidden my-4 text-base list-none bg-bg-200 divide-y divide-gray-100 rounded shadow dark:divide-gray-600"
                id="dropdown-user"
              >
                <div className="px-4 py-3" role="none">
                  <p className="text-sm text-text " role="none">
                    Neil Sims
                  </p>
                  <p
                    className="text-sm font-medium text-text truncate "
                    role="none"
                  >
                    neil.sims@flowbite.com
                  </p>
                </div>
                <ul className="py-1" role="none">
                  <li>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-text-200 hover:bg-bg-100"
                      role="menuitem"
                    >
                      Profile
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-text-200 hover:bg-bg-100"
                      role="menuitem"
                    >
                      Sign out
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default WANavbar;
