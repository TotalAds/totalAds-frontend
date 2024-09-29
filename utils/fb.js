{
  /* // Load the JavaScript SDK asynchronously */
}
(function (d, s, id) {
  var js,
    fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s);
  js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
})(document, "script", "facebook-jssdk");

console.log(process.env.FB_APP_ID, "====================================");

window.fbAsyncInit = function () {
  // JavaScript SDK configuration and setup
  FB.init({
    appId: process.env.FB_APP_ID, // Facebook App ID
    cookie: true, // enable cookies
    xfbml: true, // parse social plugins on this page
    version: "v20.0", //Graph API version
  });

  // Broadcast an event when FB object is ready
  var fbInitEvent = new Event("FBObjectReady");
  document.dispatchEvent(fbInitEvent);
};
