"use client";

import React, { useEffect } from "react";
import Lottie from "react-lottie";

import RocketLottie from "@/asset/lottie/rocketLottie.json";
import launchWhatsAppSignup from "@/utils/fbLogin";
import { IconBrandWhatsapp } from "@tabler/icons-react";

const MetaLinkContainer = () => {
  useEffect(() => {
    if (window) {
      (function (d, s, id) {
        var js,
          fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s);
        js.id = id;
        // @ts-expect-error sdfdfds
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        // @ts-expect-error sdfdfds
        fjs.parentNode.insertBefore(js, fjs);
      })(document, "script", "facebook-jssdk");
      // @ts-expect-error sdfdfds
      window.fbAsyncInit = function () {
        // JavaScript SDK configuration and setup
        // @ts-expect-error sdfdfds
        FB.init({
          appId: process.env.NEXT_PUBLIC_FB_APP_ID, // Facebook App ID
          cookie: true, // enable cookies
          xfbml: true, // parse social plugins on this page
          version: "v20.0", //Graph API version
        });

        // Broadcast an event when FB object is ready
        var fbInitEvent = new Event("FBObjectReady");
        document.dispatchEvent(fbInitEvent);
      };
    }
  }, []);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: RocketLottie,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  useEffect(() => {
    if (window) {
      const sessionInfoListener = (event: any) => {
        console.log(event, "event------------------");
        if (event.origin == null) {
          return;
        }

        // Make sure the data is coming from facebook.com
        if (!event.origin.endsWith("facebook.com")) {
          return;
        }

        try {
          const data = JSON.parse(event.data);
          if (data.type === "WA_EMBEDDED_SIGNUP") {
            // if user finishes the Embedded Signup flow
            if (data.event === "FINISH") {
              const { phone_number_id, waba_id } = data.data;
              console.log(
                "Phone number ID ",
                phone_number_id,
                " WhatsApp business account ID ",
                waba_id
              );
            }
            // if user reports an error during the Embedded Signup flow
            else if (data.event === "ERROR") {
              const { error_message } = data.data;
              console.error("error ", error_message);
            }
            // if user cancels the Embedded Signup flow
            else {
              const { current_step } = data.data;
              console.warn("Cancel at ", current_step);
            }
          }
        } catch {
          // Don’t parse info that’s not a JSON
          console.log("Non JSON Response", event.data);
        }
      };

      window.addEventListener("message", sessionInfoListener);
      return () => {
        window.removeEventListener("message", sessionInfoListener);
      };
    }
  }, []);

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
            <button
              onClick={() => {
                launchWhatsAppSignup();
              }}
              className="flex gap-1 text-text align-middle px-3 py-2 rounded-full bg-[#1ED760] font-semibold text-white tracking-widest uppercase transform hover:scale-105 hover:bg-[#21e065] transition-colors duration-200 mb-1 antialiased "
            >
              <div className="flex">
                <IconBrandWhatsapp className="h-6 w-6" />
              </div>
              Connect with Facebook Business
            </button>
          </div>
          <div>
            <Lottie options={defaultOptions} width={100} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaLinkContainer;
