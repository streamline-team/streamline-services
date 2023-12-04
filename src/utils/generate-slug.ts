import crypto from "crypto";

const generateSlug = () => crypto.randomBytes(8).toString("hex");

export default generateSlug;
