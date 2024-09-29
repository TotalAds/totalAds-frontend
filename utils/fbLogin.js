export default function launchWhatsAppSignup() {
  // Conversion tracking code
  if (window?.fbq !== undefined) {
    console.log(window.fbq);
    fbq("trackCustom", "WhatsAppOnboardingStart", {
      appId: process.env.NEXT_PUBLIC_FB_APP_ID,
      feature: "whatsapp_embedded_signup",
    });
  }

  // Launch Facebook login
  FB.login(
    function (response) {
      if (response.authResponse) {
        const code = response.authResponse.code;
        console.log("user login successfully", response);
        // The returned code must be transmitted to your backend,
        // which will perform a server-to-server call from there to our servers for an access token
      } else {
        console.log(
          "User cancelled login or did not fully authorize.",
          response
        );
      }
    },
    {
      config_id: process.env.NEXT_PUBLIC_FB_CONFIG_ID, // configuration ID goes here
      response_type: "code", // must be set to 'code' for System User access token
      override_default_response_type: true, // when true, any response types passed in the "response_type" will take precedence over the default types
      scope:
        "business_management, whatsapp_business_management, whatsapp_business_messaging",
      extras: {
        feature: "whatsapp_embedded_signup",
        version: 1,
        sessionInfoVersion: 3,
        setup: {
          // business: {
          //   name: "Acme Inc.",
          //   email: "johndoe@acme.com",
          //   phone: {
          //     code: 91,
          //     number: "6505551234",
          //   },
          //   website: "https://www.acme.com",
          //   address: {
          //     streetAddress1: "1 Acme Way",
          //     city: "Acme Town",
          //     state: "CA",
          //     zipPostal: "94000",
          //     country: "US",
          //   },
          //   timezone: "UTC-08:00",
          // },
          // phone: {
          //   displayName: "Acme Inc",
          //   category: "ENTERTAIN",
          //   description: "Acme Inc. is a leading entertainment company.",
          // },
        },
      },
    }
  );
}
