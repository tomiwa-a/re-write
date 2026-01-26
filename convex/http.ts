import { httpRouter } from "convex/server";
import { auth } from "./auth";
// import { httpAction } from "./_generated/server";

const http = httpRouter();

auth.addHttpRoutes(http);

export default http;
