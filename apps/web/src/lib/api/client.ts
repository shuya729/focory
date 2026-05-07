import createClient from "openapi-react-query";
import { serverApi } from "./server";

export const clientApi = createClient(serverApi);
