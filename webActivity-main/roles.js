// server/roles.js
const AccessControl = require("accesscontrol");
const ac = new AccessControl();

exports.roles = (function() {
ac.grant("Student")
 .readOwn("profile")
 .updateOwn("profile")

ac.grant("admin")
 .extend("Student")
 .updateAny("profile")
 .deleteAny("profile")

return ac;
})();
