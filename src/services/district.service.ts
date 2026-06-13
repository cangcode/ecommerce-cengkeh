import { http } from "@/lib/http";

export const getDistricts = async () => {
  const response = await http.get("/districts");

  return response.data;
};
